"use server";

import { db } from "@/lib/db";
import { collections, projectFamilies, projects, buildings, floors, flats, families, flatFamilies, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getActiveProject() {
  return await db.query.projects.findFirst({
    where: eq(projects.status, 'active'),
    orderBy: [desc(projects.createdAt)],
  });
}

export async function getBuildingsWithProgress(projectId: string) {
  const allBuildings = await db.query.buildings.findMany({
    where: eq(buildings.isActive, true),
    with: { floors: { with: { flats: { with: { families: { with: { family: true } } } } } } },
    orderBy: [buildings.sequenceOrder],
  });

  // Calculate earnings and family counts per building for active project
  const pfData = await db
    .select({
      buildingId: floors.buildingId,
      familyId: projectFamilies.familyId,
      collectedAmount: collections.amount,
    })
    .from(projectFamilies)
    .innerJoin(flats, eq(projectFamilies.flatId, flats.id))
    .innerJoin(floors, eq(flats.floorId, floors.id))
    .leftJoin(collections, eq(collections.projectFamilyId, projectFamilies.id))
    .where(eq(projectFamilies.projectId, projectId));

  return allBuildings.map((b) => {
    const bRows = pfData.filter((r) => r.buildingId === b.id);
    const totalEarned = bRows.reduce((sum, r) => sum + (r.collectedAmount || 0), 0);
    // Unique family count
    const uniqueFamilies = new Set(bRows.map((r) => r.familyId)).size;
    const paidCount = bRows.filter((r) => (r.collectedAmount || 0) > 0).length;

    return {
      ...b,
      totalEarned,
      familyCount: uniqueFamilies,
      paidCount,
    };
  });
}


export async function getFloorWithFlats(buildingId: string, projectId: string) {
  const floorsData = await db.query.floors.findMany({
    where: eq(floors.buildingId, buildingId),
    with: {
      flats: {
        with: {
          families: {
            with: { family: true }
          }
        }
      }
    },
    orderBy: [floors.sequenceOrder],
  });

  // Get paid status for each flat
  const paidFlatIds = new Set<string>();
  const pfRows = await db.query.projectFamilies.findMany({
    where: eq(projectFamilies.projectId, projectId),
    with: { collections: true },
  });

  for (const pf of pfRows) {
    if (pf.collections.some((c: any) => c.status === 'paid')) {
      paidFlatIds.add(pf.flatId);
    }
  }

  return { floors: floorsData, paidFlatIds };
}

export async function recordCollection(data: {
  projectId: string;
  flatId: string;
  headName: string;
  amount: number;
  collectedById: string;
  notes?: string;
}) {
  // Upsert projectFamily for this flat
  let pf = await db.query.projectFamilies.findFirst({
    where: and(
      eq(projectFamilies.projectId, data.projectId),
      eq(projectFamilies.flatId, data.flatId)
    ),
  });

  let targetFamilyId: string;

  if (!pf) {
    // Get or create a family entry for this flat
    const flatData = await db.query.flatFamilies.findFirst({
      where: eq(flatFamilies.flatId, data.flatId),
      with: { family: true },
    });

    if (flatData) {
      targetFamilyId = flatData.familyId;
      // Update existing family master record
      await db.update(families)
        .set({ headName: data.headName })
        .where(eq(families.id, targetFamilyId));
    } else {
      // Create an ad-hoc family
      const [newFamily] = await db.insert(families).values({
        headName: data.headName,
      }).returning();
      targetFamilyId = newFamily.id;
    }

    const [newPf] = await db.insert(projectFamilies).values({
      projectId: data.projectId,
      familyId: targetFamilyId,
      flatId: data.flatId,
      headNameSnapshot: data.headName,
    }).returning();
    pf = newPf;
  } else {
    // PF exists. Update snapshot and master family record.
    targetFamilyId = pf.familyId;
    await db.update(families)
      .set({ headName: data.headName })
      .where(eq(families.id, targetFamilyId));
      
    await db.update(projectFamilies)
      .set({ headNameSnapshot: data.headName })
      .where(eq(projectFamilies.id, pf.id));
  }

  // Record the collection
  const [collection] = await db.insert(collections).values({
    projectFamilyId: pf.id,
    amount: data.amount,
    status: 'paid',
    collectedById: data.collectedById,
  }).returning();

  revalidatePath("/[locale]/collection", "page");
  revalidatePath("/[locale]", "page");

  return collection;
}

export async function getCollectionsList() {
  const project = await getActiveProject();
  if (!project) return [];

  const data = await db.query.collections.findMany({
    with: {
      projectFamily: {
        with: {
          flat: {
            with: {
              floor: {
                with: { building: true }
              }
            }
          }
        }
      },
      collectedBy: true
    },
    orderBy: (collections, { desc }) => [desc(collections.date)]
  });

  return data.filter(c => c.projectFamily.projectId === project.id).map(c => ({
    id: c.id,
    date: c.date,
    amount: c.amount,
    status: c.status,
    flatName: c.projectFamily.flat.name,
    floorNameEn: c.projectFamily.flat.floor.nameEn,
    buildingNameEn: c.projectFamily.flat.floor.building.nameEn,
    headName: c.projectFamily.headNameSnapshot,
    collectorName: c.collectedBy.name,
  }));
}
