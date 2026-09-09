"use server";

import { db } from "@/lib/db";
import { collections, projectFamilies, buildings, projects, flats, floors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getActiveProject } from "./collections";

export async function getCollectionSummaryReport() {
  const project = await getActiveProject();
  if (!project) throw new Error("No active project");

  // Get all buildings with their floors and flats
  const allBuildings = await db.query.buildings.findMany({
    where: eq(buildings.isActive, true),
    orderBy: [buildings.sequenceOrder],
  });

  // Get all collections for this project
  const allCollections = await db.query.collections.findMany({
    with: {
      projectFamily: {
        with: { flat: { with: { floor: true } } }
      }
    }
  });

  const collectionsForProject = allCollections.filter(c => c.projectFamily.projectId === project.id && c.status === 'paid');

  const reportData = allBuildings.map(building => {
    // Find collections belonging to this building
    const buildingCollections = collectionsForProject.filter(
      c => c.projectFamily.flat.floor.buildingId === building.id
    );

    const totalCollected = buildingCollections.reduce((sum, c) => sum + (c.amount || 0), 0);

    return {
      buildingNameEn: building.nameEn,
      buildingNameBn: building.nameBn,
      totalCollected,
      flatsCollected: buildingCollections.length
    };
  });

  const grandTotal = reportData.reduce((sum, r) => sum + r.totalCollected, 0);

  return {
    projectNameEn: project.nameEn,
    projectNameBn: project.nameBn,
    data: reportData,
    grandTotal
  };
}

export async function getBuildingDetailReport(buildingId: string) {
  const project = await getActiveProject();
  if (!project) throw new Error("No active project");

  const building = await db.query.buildings.findFirst({
    where: eq(buildings.id, buildingId),
    with: {
      floors: {
        with: {
          flats: true
        }
      }
    }
  });

  if (!building) throw new Error("Building not found");

  const pfData = await db.query.projectFamilies.findMany({
    where: eq(projectFamilies.projectId, project.id),
    with: { collections: true }
  });

  const reportData = [];

  for (const floor of building.floors) {
    for (const flat of floor.flats) {
      const pf = pfData.find(p => p.flatId === flat.id);
      const isPaid = pf?.collections.some(c => c.status === 'paid');
      const amount = pf?.collections.find(c => c.status === 'paid')?.amount || 0;

      reportData.push({
        floorNameEn: floor.nameEn,
        floorNameBn: floor.nameBn,
        flatName: flat.name,
        headName: pf?.headNameSnapshot || "Unknown",
        status: isPaid ? "Paid" : "Pending",
        amount
      });
    }
  }

  return {
    projectNameEn: project.nameEn,
    buildingNameEn: building.nameEn,
    data: reportData
  };
}

export async function getBuildingRangeReport(startBuildingId: string, endBuildingId: string) {
  const project = await getActiveProject();
  if (!project) throw new Error("No active project");

  // Get start and end buildings to determine sequence range
  const allBuildings = await db.query.buildings.findMany({
    where: eq(buildings.isActive, true),
    orderBy: [buildings.sequenceOrder],
  });

  const startIdx = allBuildings.findIndex(b => b.id === startBuildingId);
  const endIdx = allBuildings.findIndex(b => b.id === endBuildingId);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error("Invalid building range selected");
  }

  // Ensure start is before end
  const actualStartIdx = Math.min(startIdx, endIdx);
  const actualEndIdx = Math.max(startIdx, endIdx);

  const rangeBuildings = allBuildings.slice(actualStartIdx, actualEndIdx + 1);
  const buildingIds = rangeBuildings.map(b => b.id);

  // Fetch full details for all buildings in range
  const buildingsData = await db.query.buildings.findMany({
    where: (buildings, { inArray }) => inArray(buildings.id, buildingIds),
    with: {
      floors: {
        orderBy: (floors, { asc }) => [asc(floors.sequenceOrder)],
        with: {
          flats: true
        }
      }
    },
    orderBy: [buildings.sequenceOrder]
  });

  const pfData = await db.query.projectFamilies.findMany({
    where: eq(projectFamilies.projectId, project.id),
    with: { collections: true }
  });

  const reportData = [];

  for (const building of buildingsData) {
    for (const floor of building.floors) {
      for (const flat of floor.flats) {
        const pf = pfData.find(p => p.flatId === flat.id);
        const paidCollection = pf?.collections.find(c => c.status === 'paid');
        
        if (!paidCollection) continue;

        const amount = paidCollection.amount || 0;
        let tobrukPackages: { amount: number, qty: number }[] = [];
        
        if (paidCollection.tobrukPackageBreakdown) {
          try {
            tobrukPackages = JSON.parse(paidCollection.tobrukPackageBreakdown);
          } catch (e) {
            // ignore parse error
          }
        }

        reportData.push({
          buildingNameEn: building.nameEn,
          buildingNameBn: building.nameBn,
          floorNameEn: floor.nameEn,
          floorNameBn: floor.nameBn,
          flatName: flat.name,
          headName: pf?.headNameSnapshot || "Unknown",
          status: "Paid",
          amount,
          tobrukPackages
        });
      }
    }
  }

  const startName = rangeBuildings[0].nameBn || rangeBuildings[0].nameEn;
  const endName = rangeBuildings[rangeBuildings.length - 1].nameBn || rangeBuildings[rangeBuildings.length - 1].nameEn;
  const rangeName = startName === endName ? startName : `${startName} থেকে ${endName}`;

  return {
    projectNameEn: project.nameEn,
    rangeName,
    data: reportData
  };
}
