import { getFamilies } from "@/app/actions/families";
import FamiliesClient from "./FamiliesClient";

export default async function FamiliesPage() {
  const families = await getFamilies();
  
  return <FamiliesClient initialFamilies={families as any} />;
}
