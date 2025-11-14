import { getProject } from "@/lib/astra";
import { notFound } from "next/navigation";
import ProjectIDE from "@/components/ProjectIDE";
import type { FileSystemNode as FrontendFileSystemNode } from '@/lib/types';
import type { FileSystemNode as ApiFileSystemNode } from "@/lib/astra";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Project ${params.id} - Swalang IDE`,
    description: `Edit and run code for project ${params.id}`,
  };
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id).catch((err) => {
    console.error("Failed to fetch project:", err);
    return null;
  });
  console.log(project)

  if (!project) {
    notFound();
  }

  // The ProjectIDE component is now responsible for handling both strategies.
  // We pass the strategy and the relevant data structure to it.
  return (
    <ProjectIDE
      projectId={params.id}
      strategy={project.strategy}
      initialTree={project.tree as unknown as FrontendFileSystemNode[] | undefined}
      initialFiles={project.files as ApiFileSystemNode[] | undefined}
    />
  );
}