import { db } from "@/lib/db";
import { buildings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import BuildingDetailClient from "./BuildingDetailClient";
import { notFound } from "next/navigation";
import { getFloors } from "@/app/actions/floors";
import { getFamiliesByBuilding } from "@/app/actions/families";

export default async function BuildingDetailPage(props: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await props.params;

  const buildingData = await db.query.buildings.findFirst({
    where: eq(buildings.id, id),
  });

  if (!buildingData) {
    notFound();
  }

  const floorsData = await getFloors(id);
  const initialFamilies = await getFamiliesByBuilding(id);

  return (
    <BuildingDetailClient 
      building={buildingData as any} 
      floors={floorsData as any} 
      initialFamilies={initialFamilies as any}
    />
  );
}

