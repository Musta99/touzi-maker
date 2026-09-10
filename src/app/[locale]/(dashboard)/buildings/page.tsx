import { getBuildings } from "@/app/actions/buildings";
import { getAreas } from "@/app/actions/areas";
import BuildingsClient from "./BuildingsClient";

export default async function BuildingsPage() {
  const buildings = await getBuildings();
  const areas = await getAreas();
  
  return <BuildingsClient initialBuildings={buildings as any} initialAreas={areas} />;
}
