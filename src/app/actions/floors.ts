"use server";

import { db } from "@/lib/db";
import { floors, flats, buildings } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFloors(buildingId: string) {
  return await db.query.floors.findMany({
    where: eq(floors.buildingId, buildingId),
    orderBy: [asc(floors.sequenceOrder)],
  });
}

export async function addFloor(data: { buildingId: string; nameEn: string; nameBn: string; sequenceOrder: number }) {
  await db.insert(floors).values({
    buildingId: data.buildingId,
    nameEn: data.nameEn,
    nameBn: data.nameBn,
    sequenceOrder: data.sequenceOrder,
  });
  
  // Update building floor count
  const allFloors = await db.query.floors.findMany({ where: eq(floors.buildingId, data.buildingId) });
  await db.update(buildings).set({ floorCount: allFloors.length }).where(eq(buildings.id, data.buildingId));

  revalidatePath("/[locale]/buildings/[id]", "page");
}

export async function getFlats(floorId: string) {
  return await db.query.flats.findMany({
    where: eq(flats.floorId, floorId),
    orderBy: [asc(flats.sequenceOrder)],
  });
}

export async function addFlat(data: { floorId: string; buildingId: string; name: string; sequenceOrder: number; notes?: string }) {
  await db.insert(flats).values({
    floorId: data.floorId,
    name: data.name,
    sequenceOrder: data.sequenceOrder,
    notes: data.notes,
  });

  // Update building flat count
  const allFlatsInBuilding = await db.execute(`
    SELECT count(*) as count 
    FROM flats 
    JOIN floors ON flats.floor_id = floors.id 
    WHERE floors.building_id = '${data.buildingId}'
  `);
  
  await db.update(buildings)
    .set({ flatCount: Number(allFlatsInBuilding.rows[0].count) })
    .where(eq(buildings.id, data.buildingId));

  revalidatePath("/[locale]/buildings/[id]", "page");
}
