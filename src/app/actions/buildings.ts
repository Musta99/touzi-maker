"use server";

import { db } from "@/lib/db";
import { buildings, floors, flats, projectFamilies } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBuildings() {
  const allBuildings = await db.query.buildings.findMany({
    orderBy: [asc(buildings.sequenceOrder)],
  });

  // Calculate total registered families/flats in each building
  const flatCounts = await db
    .select({
      buildingId: floors.buildingId,
      flatCount: sql<number>`count(distinct ${projectFamilies.id})`,
    })
    .from(projectFamilies)
    .innerJoin(flats, eq(projectFamilies.flatId, flats.id))
    .innerJoin(floors, eq(flats.floorId, floors.id))
    .groupBy(floors.buildingId);

  const flatCountMap = new Map(flatCounts.map((fc) => [fc.buildingId, Number(fc.flatCount)]));

  return allBuildings.map((b) => ({
    ...b,
    flatCount: flatCountMap.get(b.id) || 0,
  }));
}


const standardFloors = [
  { en: "Ground Floor", bn: "নিচ তলা" },
  { en: "1st Floor",    bn: "দ্বিতীয় তলা" },
  { en: "2nd Floor",    bn: "তৃতীয় তলা" },
  { en: "3rd Floor",    bn: "চতুর্থ তলা" },
  { en: "4th Floor",    bn: "পঞ্চম তলা" },
  { en: "5th Floor",    bn: "ষষ্ঠ তলা" },
  { en: "6th Floor",    bn: "সপ্তম তলা" },
  { en: "7th Floor",    bn: "অষ্টম তলা" },
  { en: "8th Floor",    bn: "নবম তলা" },
];

export async function addBuilding(data: { nameEn: string; nameBn: string; sequenceOrder: number; insertAfterOrder?: number }) {
  // If inserting at a specific position, shift all buildings at or after that position
  if (data.insertAfterOrder !== undefined) {
    const targetOrder = data.insertAfterOrder + 1;

    // Get all buildings that need to shift
    const allBuildings = await db.query.buildings.findMany({
      orderBy: [asc(buildings.sequenceOrder)],
    });

    // Shift buildings from the end to avoid unique constraint conflicts
    const toShift = allBuildings.filter(b => b.sequenceOrder >= targetOrder);
    for (let i = toShift.length - 1; i >= 0; i--) {
      const b = toShift[i];
      await db.update(buildings)
        .set({ 
          sequenceOrder: b.sequenceOrder + 1,
          nameEn: `Building ${b.sequenceOrder + 1}`
        })
        .where(eq(buildings.id, b.id));
    }

    data.sequenceOrder = targetOrder;
    data.nameEn = `Building ${targetOrder}`;
  }

  const [newBuilding] = await db.insert(buildings).values({
    nameEn: data.nameEn,
    nameBn: data.nameBn,
    sequenceOrder: data.sequenceOrder,
    isActive: true,
  }).returning();

  const floorsToInsert = standardFloors.map((f, i) => ({
    buildingId: newBuilding.id,
    nameEn: f.en,
    nameBn: f.bn,
    sequenceOrder: i + 1
  }));

  await db.insert(floors).values(floorsToInsert);

  revalidatePath("/[locale]/buildings", "page");
}

export async function reorderBuilding(id: string, newSequenceOrder: number) {
  await db.update(buildings)
    .set({ sequenceOrder: newSequenceOrder })
    .where(eq(buildings.id, id));
  
  revalidatePath("/[locale]/buildings", "page");
}

export async function getFloorsByBuilding(buildingId: string) {
  return await db.query.floors.findMany({
    where: eq(floors.buildingId, buildingId),
    orderBy: [asc(floors.sequenceOrder)],
  });
}

export async function updateBuilding(id: string, data: { nameBn: string }) {
  await db.update(buildings)
    .set({ nameBn: data.nameBn })
    .where(eq(buildings.id, id));
  revalidatePath("/[locale]/buildings", "page");
}

export async function deleteBuilding(id: string) {
  // Guard: if any projectFamilies reference flats in this building, block deletion
  const pfRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(projectFamilies)
    .innerJoin(flats, eq(projectFamilies.flatId, flats.id))
    .innerJoin(floors, eq(flats.floorId, floors.id))
    .where(eq(floors.buildingId, id));

  if (Number(pfRows[0].count) > 0) {
    throw new Error(
      "এই বিল্ডিংয়ে সক্রিয় পরিবার রয়েছে। আগে পরিবারগুলো মুছে ফেলুন।"
    );
  }

  await db.delete(buildings).where(eq(buildings.id, id));
  revalidatePath("/[locale]/buildings", "page");
}
