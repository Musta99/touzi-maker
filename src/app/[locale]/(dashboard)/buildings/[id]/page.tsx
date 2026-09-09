import { db } from "@/lib/db";
import { buildings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import BuildingDetailClient from "./BuildingDetailClient";
import { notFound } from "next/navigation";
import { getFloors, getFlats } from "@/app/actions/floors";

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
  const floorsWithFlats = await Promise.all(
    floorsData.map(async (floor) => {
      const flats = await getFlats(floor.id);
      return { ...floor, flats };
    })
  );

  return (
    <BuildingDetailClient 
      building={buildingData as any} 
      floors={floorsWithFlats as any} 
    />
  );
}
