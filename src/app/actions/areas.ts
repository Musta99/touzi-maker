"use server";

import { db } from "@/lib/db";
import { areas } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const DEFAULT_AREAS = [
  { nameBn: "মৌসুমী আ/এ", nameEn: "Mousumi R/A" },
  { nameBn: "৩ নং গলি", nameEn: "Lane 3" },
  { nameBn: "আঞ্জুমান গলি", nameEn: "Anjuman Lane" },
];

export async function getAreas() {
  let allAreas = await db.query.areas.findMany({
    orderBy: [asc(areas.createdAt)],
  });

  // Rename legacy initial seed area "মূল এলাকা" to "মৌসুমী আ/এ" if present
  const legacyMainArea = allAreas.find(a => a.nameBn === "মূল এলাকা" || a.nameEn === "Main Area");
  if (legacyMainArea) {
    await db.update(areas)
      .set({ nameBn: "মৌসুমী আ/এ", nameEn: "Mousumi R/A" })
      .where(eq(areas.id, legacyMainArea.id));
  }

  // Ensure default 3 areas exist
  for (const defArea of DEFAULT_AREAS) {
    const exists = allAreas.some(a => a.nameBn === defArea.nameBn);
    if (!exists && !legacyMainArea) {
      await db.insert(areas).values(defArea);
    }
  }

  allAreas = await db.query.areas.findMany({
    orderBy: [asc(areas.createdAt)],
  });

  return allAreas;
}

export async function addArea(data: { nameBn: string; nameEn?: string }) {
  const nameEn = data.nameEn?.trim() || data.nameBn.trim();
  const [newArea] = await db.insert(areas).values({
    nameBn: data.nameBn.trim(),
    nameEn,
  }).returning();

  revalidatePath("/[locale]/buildings", "page");
  return newArea;
}
