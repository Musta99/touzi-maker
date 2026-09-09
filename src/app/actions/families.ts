"use server";

import { db } from "@/lib/db";
import { families, flats, floors, flatFamilies, projectFamilies, collections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveProject } from "./collections";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";

export async function registerFamilyAndCollect(data: {
  headName: string;
  mobile: string;
  buildingId: string;
  floorId: string;
  sideLocation: string;
  amount: number;
  tobrukPackageBreakdown?: { amount: number; qty: number }[]; // optional override
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  // Server-side validation: if breakdown provided, its total must equal amount
  if (data.tobrukPackageBreakdown && data.tobrukPackageBreakdown.length > 0) {
    const breakdownTotal = data.tobrukPackageBreakdown.reduce((sum, row) => sum + row.amount * row.qty, 0);
    if (breakdownTotal !== data.amount) {
      throw new Error(`Tobruk breakdown total (৳${breakdownTotal}) must equal amount paid (৳${data.amount}).`);
    }
  }
  
  const project = await getActiveProject();
  if (!project) throw new Error("No active project found.");

  // 1. Create or Find Flat by Side Location name on the selected floor
  let flat = await db.query.flats.findFirst({
    where: and(
      eq(flats.floorId, data.floorId),
      eq(flats.name, data.sideLocation)
    )
  });

  if (!flat) {
    const [newFlat] = await db.insert(flats).values({
      floorId: data.floorId,
      name: data.sideLocation,
      sequenceOrder: 1, // simplified
    }).returning();
    flat = newFlat;
  }

  // 2. Create Family master record
  const [newFamily] = await db.insert(families).values({
    headName: data.headName,
    mobile: data.mobile || null,
  }).returning();

  // 3. Link Family to Flat
  await db.insert(flatFamilies).values({
    flatId: flat.id,
    familyId: newFamily.id,
    isOwner: false,
    sideLocation: data.sideLocation,
  });

  // 4. Create Project Family (snapshot for the current year)
  const [pf] = await db.insert(projectFamilies).values({
    projectId: project.id,
    familyId: newFamily.id,
    flatId: flat.id,
    headNameSnapshot: data.headName,
    sideLocationSnapshot: data.sideLocation,
  }).returning();

  // 5. Record Collection
  await db.insert(collections).values({
    projectFamilyId: pf.id,
    amount: data.amount,
    status: 'paid',
    collectedById: session.user.id,
    tobrukPackageBreakdown: data.tobrukPackageBreakdown && data.tobrukPackageBreakdown.length > 0
      ? JSON.stringify(data.tobrukPackageBreakdown)
      : null,
  });

  revalidatePath("/[locale]/families", "page");
  revalidatePath("/[locale]/receipts", "page");
  revalidatePath("/[locale]", "page");
  
  return true;
}

export async function getFamilies() {
  const project = await getActiveProject();
  if (!project) return [];

  // Step 1: get projectFamilies with family + collections
  const rows = await db.query.projectFamilies.findMany({
    where: eq(projectFamilies.projectId, project.id),
    with: {
      family: true,
      collections: true,
    },
    orderBy: (pf, { asc }) => [asc(pf.headNameSnapshot)],
  });

  // Step 2: for each row, fetch flat → floor → building separately
  const results = await Promise.all(rows.map(async row => {
    const paid = row.collections.find(c => c.status === 'paid');
    let tobrukPackages: { amount: number; qty: number }[] = [];
    if (paid?.tobrukPackageBreakdown) {
      try { tobrukPackages = JSON.parse(paid.tobrukPackageBreakdown); } catch {}
    }

    // Get flat
    const flat = await db.query.flats.findFirst({
      where: eq(flats.id, row.flatId),
    });

    // Get floor
    const floorRecord = flat ? await db.query.floors.findFirst({
      where: (f, { eq: eqF }) => eqF(f.id, flat.floorId),
    }) : null;

    // Get building
    const building = floorRecord ? await db.query.buildings.findFirst({
      where: (b, { eq: eqB }) => eqB(b.id, floorRecord.buildingId),
    }) : null;

    return {
      id: row.family.id,
      projectFamilyId: row.id,
      collectionId: paid?.id ?? null,
      headName: row.family.headName,
      mobile: row.family.mobile,
      buildingId: building?.id ?? null,
      buildingNameEn: building?.nameEn ?? null,
      buildingNameBn: building?.nameBn ?? null,
      floorId: floorRecord?.id ?? null,
      floorNameEn: floorRecord?.nameEn ?? null,
      floorNameBn: floorRecord?.nameBn ?? null,
      sideLocation: flat?.name ?? null,
      amount: paid?.amount ?? 0,
      tobrukPackages,
    };
  }));

  return results;
}

export async function updateFamily(data: {
  id: string;
  projectFamilyId: string;
  collectionId: string | null;
  headName: string;
  mobile: string;
  buildingId: string;
  floorId: string;
  sideLocation: string;
  amount: number;
  tobrukPackageBreakdown?: { amount: number; qty: number }[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Validate breakdown
  if (data.tobrukPackageBreakdown && data.tobrukPackageBreakdown.length > 0) {
    const total = data.tobrukPackageBreakdown.reduce((s, r) => s + r.amount * r.qty, 0);
    if (total !== data.amount) throw new Error(`Breakdown total (৳${total}) must equal amount paid (৳${data.amount}).`);
  }

  // 1. Update family master record
  await db.update(families)
    .set({ headName: data.headName, mobile: data.mobile || null })
    .where(eq(families.id, data.id));

  // 2. Find or create the flat
  let flat = await db.query.flats.findFirst({
    where: and(eq(flats.floorId, data.floorId), eq(flats.name, data.sideLocation))
  });
  if (!flat) {
    const [newFlat] = await db.insert(flats).values({
      floorId: data.floorId,
      name: data.sideLocation,
      sequenceOrder: 1,
    }).returning();
    flat = newFlat;
  }

  // 3. Update flatFamilies link
  await db.update(flatFamilies)
    .set({ flatId: flat.id, sideLocation: data.sideLocation })
    .where(eq(flatFamilies.familyId, data.id));

  // 4. Update projectFamilies snapshot
  await db.update(projectFamilies)
    .set({
      headNameSnapshot: data.headName,
      sideLocationSnapshot: data.sideLocation,
      flatId: flat.id,
    })
    .where(eq(projectFamilies.id, data.projectFamilyId));

  // 5. Update collection
  const breakdownJson = data.tobrukPackageBreakdown && data.tobrukPackageBreakdown.length > 0
    ? JSON.stringify(data.tobrukPackageBreakdown) : null;

  if (data.collectionId) {
    await db.update(collections)
      .set({ amount: data.amount, tobrukPackageBreakdown: breakdownJson })
      .where(eq(collections.id, data.collectionId));
  } else {
    await db.insert(collections).values({
      projectFamilyId: data.projectFamilyId,
      amount: data.amount,
      status: 'paid',
      collectedById: session.user.id,
      tobrukPackageBreakdown: breakdownJson,
    });
  }

  revalidatePath('/[locale]/families', 'page');
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/reports', 'page');
  return true;
}

