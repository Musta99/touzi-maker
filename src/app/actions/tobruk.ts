"use server";

import { db } from "@/lib/db";
import { projectFamilies, tobrukDistributions, flats, floors, buildings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveProject } from "./collections";
import { revalidatePath } from "next/cache";

export async function getTobrukList() {
  const project = await getActiveProject();
  if (!project) return [];

  const data = await db.query.projectFamilies.findMany({
    where: eq(projectFamilies.projectId, project.id),
    with: {
      flat: {
        with: {
          floor: {
            with: { building: true }
          }
        }
      },
      tobrukDistributions: true,
      collections: true,
    },
  });

  return data.map(pf => {
    // Sum up paid collection amounts
    const totalAmount = pf.collections
      .filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

    // Parse tobruk breakdown if present
    const paidCollection = pf.collections.find((c: any) => c.status === 'paid');
    let tobrukBreakdown: { amount: number; qty: number }[] | null = null;
    if (paidCollection?.tobrukPackageBreakdown) {
      try {
        tobrukBreakdown = JSON.parse(paidCollection.tobrukPackageBreakdown);
      } catch {}
    }

    return {
      id: pf.id,
      headName: pf.headNameSnapshot,
      buildingNameEn: pf.flat.floor.building.nameEn,
      floorNameEn: pf.flat.floor.nameEn,
      flatName: pf.flat.name,
      hasPaid: pf.collections.some((c: any) => c.status === 'paid'),
      isDistributed: pf.tobrukDistributions.length > 0 && pf.tobrukDistributions[0].status === 'distributed',
      totalAmount,
      tobrukBreakdown, // null = auto, array = explicit breakdown
    };
  }).sort((a, b) => {
    if (a.buildingNameEn !== b.buildingNameEn) return a.buildingNameEn.localeCompare(b.buildingNameEn);
    if (a.floorNameEn !== b.floorNameEn) return a.floorNameEn.localeCompare(b.floorNameEn);
    return a.flatName.localeCompare(b.flatName);
  });
}

export async function markTobrukDistributed(projectFamilyId: string) {
  // Check if it already exists
  const existing = await db.query.tobrukDistributions.findFirst({
    where: eq(tobrukDistributions.projectFamilyId, projectFamilyId)
  });

  if (existing) {
    await db.update(tobrukDistributions)
      .set({ status: 'distributed', date: new Date() })
      .where(eq(tobrukDistributions.id, existing.id));
  } else {
    await db.insert(tobrukDistributions).values({
      projectFamilyId,
      status: 'distributed',
      date: new Date(),
    });
  }

  revalidatePath("/[locale]/tobruk", "page");
  revalidatePath("/[locale]", "page"); // update dashboard stats
}
