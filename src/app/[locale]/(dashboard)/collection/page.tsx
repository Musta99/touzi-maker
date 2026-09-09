import { getActiveProject, getBuildingsWithProgress } from "@/app/actions/collections";
import CollectionClient from "./CollectionClient";

export default async function CollectionPage() {
  const project = await getActiveProject();
  const buildings = project ? await getBuildingsWithProgress(project.id) : [];

  return (
    <CollectionClient
      project={project as any}
      buildings={buildings as any}
    />
  );
}
