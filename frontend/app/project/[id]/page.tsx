import { getProject } from "@/lib/astra";
import { notFound } from "next/navigation";
import ProjectIDE from "@/components/ProjectIDE";
import type { FileSystemNode as FrontendFileSystemNode } from '@/lib/types';
import type { FileSystemNode as ApiFileSystemNode } from "@/lib/astra";
import createSupabaseServerClient from "@/lib/supabase/server";

export async function generateMetadata({ params, searchParams }: { params: { id: string }, searchParams?: { version?: string } }) {
  const supabase = await createSupabaseServerClient();
  const projectId = params.id;
  const versionId = searchParams?.version;

  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('name, description')
    .eq('id', projectId)
    .single();

  if (projectError || !projectData) {
    return {
      title: 'Project Not Found - Swalang IDE',
      description: 'The requested project could not be found.',
    };
  }

  let versionInfo = '';

  if (versionId) {
    const { data: versionData, error: versionError } = await supabase
      .from('project_versions')
      .select('version_label')
      .eq('project_id', projectId)
      .eq('astra_snapshot_version', versionId)
      .single();
      
    if (versionData && !versionError) {
      versionInfo = versionData.version_label || `${versionId.substring(0, 8)}...`;
    } else {
      versionInfo = `${versionId.substring(0, 8)}...`;
    }
  }
  
  const title = versionInfo
    ? `${projectData.name} (${versionInfo}) - Swalang IDE`
    : `${projectData.name} - Swalang IDE`;
    
  const description = projectData.description || `View and edit the "${projectData.name}" project. A live IDE for the Swalang language.`;

  return {
    title,
    description,
    openGraph: {
        title: title,
        description: description,
        type: 'website'
    }
  };
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const version = searchParams?.version as string | undefined;

  const project = await getProject(params.id, version).catch((err) => {
    console.error(`Failed to fetch project ${params.id} (Version: ${version || 'latest'}):`, err);
    return null;
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectIDE
      projectId={params.id}
      strategy={project.strategy}
      initialTree={project.tree as unknown as FrontendFileSystemNode[] | undefined}
      initialFiles={project.files as ApiFileSystemNode[] | undefined}
      currentVersion={version}
    />
  );
}