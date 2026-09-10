"use server";

import { db } from "@/lib/db";
import { collections, projectFamilies, buildings, projects, flats, floors, tobrukDistributions, areas } from "@/lib/db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { getActiveProject } from "./collections";
export async function getDashboardStats() {
  const project = await getActiveProject();
  if (!project) return null;

  // Execute independent database queries concurrently in parallel
  const [bRows, fRows, cRows, tRows, areaBreakdown, buildingBreakdown] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(buildings)
      .where(eq(buildings.isActive, true)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projectFamilies)
      .where(eq(projectFamilies.projectId, project.id)),
    db
      .select({ sum: sql<number>`sum(amount)` })
      .from(collections)
      .innerJoin(
        projectFamilies,
        eq(collections.projectFamilyId, projectFamilies.id)
      )
      .where(eq(projectFamilies.projectId, project.id)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tobrukDistributions)
      .innerJoin(
        projectFamilies,
        eq(tobrukDistributions.projectFamilyId, projectFamilies.id)
      )
      .where(eq(projectFamilies.projectId, project.id)),
    // Stats grouped by Area
    getAreaStats(project.id),
    // Stats grouped by Building
    getBuildingStats(project.id),
  ]);

  const totalBuildings = bRows[0]?.count || 0;
  const totalFamilies = fRows[0]?.count || 0;
  const totalCollection = cRows[0]?.sum || 0;
  const tobrukCount = tRows[0]?.count || 0;
  const tobrukDistributed =
    totalFamilies > 0 ? Math.round((tobrukCount / totalFamilies) * 100) : 0;

  return { 
    totalBuildings, 
    totalFamilies, 
    totalCollection, 
    tobrukDistributed,
    areaBreakdown,
    buildingBreakdown
  };
}

export async function getAreaStats(projectId: string) {
  const allAreas = await db.query.areas.findMany();
  
  const pfRows = await db.select({
    areaId: buildings.areaId,
    areaNameBn: sql<string>`coalesce(areas.name_bn, 'অন্যান্য এলাকা')`,
    areaNameEn: sql<string>`coalesce(areas.name_en, 'Other Area')`,
    familyId: projectFamilies.id,
    amount: collections.amount,
  })
  .from(projectFamilies)
  .innerJoin(flats, eq(projectFamilies.flatId, flats.id))
  .innerJoin(floors, eq(flats.floorId, floors.id))
  .innerJoin(buildings, eq(floors.buildingId, buildings.id))
  .leftJoin(collections, eq(collections.projectFamilyId, projectFamilies.id))
  .leftJoin(areas, eq(buildings.areaId, areas.id))
  .where(eq(projectFamilies.projectId, projectId));

  const areaMap: Record<string, { areaId: string; nameBn: string; nameEn: string; familiesCount: number; collectedAmount: number }> = {};

  for (const row of pfRows) {
    const key = row.areaId || "unassigned";
    if (!areaMap[key]) {
      areaMap[key] = {
        areaId: key,
        nameBn: row.areaNameBn,
        nameEn: row.areaNameEn,
        familiesCount: 0,
        collectedAmount: 0,
      };
    }
    areaMap[key].familiesCount += 1;
    if (row.amount) {
      areaMap[key].collectedAmount += Number(row.amount);
    }
  }

  return Object.values(areaMap);
}

export async function getBuildingStats(projectId: string) {
  const allBuildings = await db.query.buildings.findMany({
    where: eq(buildings.isActive, true),
    with: { area: true },
    orderBy: [asc(buildings.sequenceOrder)],
  });

  const pfData = await db.select({
    buildingId: floors.buildingId,
    amount: collections.amount,
  })
  .from(projectFamilies)
  .innerJoin(flats, eq(projectFamilies.flatId, flats.id))
  .innerJoin(floors, eq(flats.floorId, floors.id))
  .leftJoin(collections, eq(collections.projectFamilyId, projectFamilies.id))
  .where(eq(projectFamilies.projectId, projectId));

  return allBuildings.map(b => {
    const bFamilies = pfData.filter(pf => pf.buildingId === b.id);
    const paidFamilies = bFamilies.filter(pf => pf.amount !== null && Number(pf.amount) > 0);
    const totalCollected = bFamilies.reduce((sum, pf) => sum + (Number(pf.amount) || 0), 0);

    return {
      buildingId: b.id,
      nameBn: b.nameBn,
      nameEn: b.nameEn,
      areaNameBn: b.area?.nameBn || "অন্যান্য এলাকা",
      totalFamilies: bFamilies.length,
      paidFamilies: paidFamilies.length,
      totalCollected,
    };
  });
}

export async function getCollectionChartData() {
  const project = await getActiveProject();
  if (!project) return [];

  const allCollections = await db.select({
    amount: collections.amount,
  })
  .from(collections)
  .innerJoin(projectFamilies, eq(collections.projectFamilyId, projectFamilies.id))
  .where(eq(projectFamilies.projectId, project.id));

  const amountMap: Record<number, number> = {};
  for (const c of allCollections) {
    amountMap[c.amount] = (amountMap[c.amount] || 0) + 1;
  }

  return Object.entries(amountMap).map(([amount, count]) => ({
    amount: `Tk ${amount}`,
    count
  })).sort((a, b) => parseInt(a.amount.replace('Tk ', '')) - parseInt(b.amount.replace('Tk ', '')));
}

export async function getBuildingProgressData() {
  const project = await getActiveProject();
  if (!project) return [];

  const allBuildings = await db.query.buildings.findMany({
    where: eq(buildings.isActive, true),
    orderBy: [asc(buildings.sequenceOrder)],
  });

  const pfData = await db.select({
    buildingId: floors.buildingId,
    flatId: projectFamilies.flatId,
    isPaid: sql<boolean>`EXISTS(SELECT 1 FROM collections WHERE collections.project_family_id = project_families.id AND collections.status = 'paid')`
  })
  .from(projectFamilies)
  .innerJoin(flats, eq(projectFamilies.flatId, flats.id))
  .innerJoin(floors, eq(flats.floorId, floors.id))
  .where(eq(projectFamilies.projectId, project.id));

  return allBuildings.map(b => {
    const bFamilies = pfData.filter(pf => pf.buildingId === b.id);
    const paidCount = bFamilies.filter(pf => pf.isPaid).length;
    return {
      name: b.nameBn,
      nameEn: b.nameEn,
      total: bFamilies.length,
      paid: paidCount
    };
  });
}
