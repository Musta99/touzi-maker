"use server";

import { db } from "@/lib/db";
import { collections, projectFamilies, buildings, projects, flats, floors, tobrukDistributions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getActiveProject } from "./collections";

export async function getDashboardStats() {
  const project = await getActiveProject();
  if (!project) return null;

  const bRows = await db.select({ count: sql<number>`count(*)` }).from(buildings).where(eq(buildings.isActive, true));
  const totalBuildings = bRows[0].count;

  const fRows = await db.select({ count: sql<number>`count(*)` }).from(projectFamilies).where(eq(projectFamilies.projectId, project.id));
  const totalFamilies = fRows[0].count;

  const cRows = await db.select({ sum: sql<number>`sum(amount)` })
    .from(collections)
    .innerJoin(projectFamilies, eq(collections.projectFamilyId, projectFamilies.id))
    .where(eq(projectFamilies.projectId, project.id));
  
  const totalCollection = cRows[0].sum || 0;

  const tRows = await db.select({ count: sql<number>`count(*)` })
    .from(tobrukDistributions)
    .innerJoin(projectFamilies, eq(tobrukDistributions.projectFamilyId, projectFamilies.id))
    .where(eq(projectFamilies.projectId, project.id));
    
  const tobrukCount = tRows[0].count;
  const tobrukDistributed = totalFamilies > 0 ? Math.round((tobrukCount / totalFamilies) * 100) : 0;

  return { totalBuildings, totalFamilies, totalCollection, tobrukDistributed };
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
      name: b.nameEn,
      total: bFamilies.length,
      paid: paidCount
    };
  });
}
