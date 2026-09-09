import { getBuildings } from "@/app/actions/buildings";
import BuildingsClient from "./BuildingsClient";

export default async function BuildingsPage() {
  const buildings = await getBuildings();
  
  return <BuildingsClient initialBuildings={buildings as any} />;
}
