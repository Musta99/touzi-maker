"use server";

import { db } from "@/lib/db";
import { projects, projectFamilies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAllProjects() {
  return await db.query.projects.findMany({
    orderBy: (projects, { desc }) => [desc(projects.year)]
  });
}

export async function startNewProject(nameEn: string, nameBn: string, year: number, importFromProjectId: string) {
  // Deactivate all projects
  await db.update(projects).set({ status: 'closed' });

  // Create new project
  const [newProject] = await db.insert(projects).values({
    nameEn,
    nameBn,
    year,
    status: 'active'
  }).returning();

  // If importing from old project, copy families
  if (importFromProjectId) {
    const oldFamilies = await db.query.projectFamilies.findMany({
      where: eq(projectFamilies.projectId, importFromProjectId)
    });

    if (oldFamilies.length > 0) {
      const newFamilies = oldFamilies.map(f => ({
        projectId: newProject.id,
        familyId: f.familyId,
        flatId: f.flatId,
        headNameSnapshot: f.headNameSnapshot,
        isOwnerSnapshot: f.isOwnerSnapshot,
        sideLocationSnapshot: f.sideLocationSnapshot,
      }));
      await db.insert(projectFamilies).values(newFamilies);
    }
  }

  revalidatePath("/[locale]/settings", "page");
  revalidatePath("/[locale]", "layout");

  return newProject;
}
