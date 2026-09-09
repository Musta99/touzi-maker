"use server";

import { db } from "@/lib/db";
import { buildings, floors } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBuildings() {
  return await db.query.buildings.findMany({
    orderBy: [asc(buildings.sequenceOrder)],
  });
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
