import { getProject, getFileContent } from "@/lib/astra";
import { notFound } from "next/navigation";
import FileIDEView from "@/components/FileIDEView";
import type { GetProjectResponse } from "@/lib/types";
import createSupabaseServerClient from "@/lib/supabase/server";

export async function generateMetadata({ 
    params, 
    searchParams 
}: { 
    params: { id: string; path: string[] };
    searchParams?: { version?: string };
}) {
  const supabase = await createSupabaseServerClient();
  const projectId = params.id;
  const versionId = searchParams?.version;
  const filePath = params.path.join("/");

  const { data: projectData } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();
  
  const projectName = projectData?.name || projectId;

  let versionInfo = '';
  if (versionId) {
    const { data: versionData } = await supabase
      .from('project_versions')
      .select('version_label')
      .eq('project_id', projectId)
      .eq('astra_snapshot_version', versionId)
      .single();
    versionInfo = versionData?.version_label || `${versionId.substring(0, 8)}...`;
  }
  
  const title = versionInfo
    ? `${filePath} at ${versionInfo} - ${projectName}`
    : `${filePath} - ${projectName}`;
    
  const description = `Viewing file ${filePath} in project ${projectName}.`;

  return {
    title,
    description,
    openGraph: {
      title: title,
      description: `Navigate the full project and run your code live.`,
      type: "article",
    },
  };
}

export default async function FilePage({ 
    params,
    searchParams
}: { 
    params: { id: string; path: string[] };
    searchParams?: { version?: string };
}) {
  const path = params.path.join("/");
  const version = searchParams?.version;
  
  try {
    const [project, content] = await Promise.all([
      getProject(params.id, version),
      getFileContent(params.id, path, version)
    ]);

    if (!project || content === null) {
      notFound();
    }
    
    return (
      <FileIDEView
        projectId={params.id}
        initialProject={project as GetProjectResponse}
        activeFilePath={path}
        initialContent={content}
        currentVersion={version}
      />
    );

  } catch (error) {
    console.error(`Error loading page for /project/${params.id}/file/${path} (Version: ${version}):`, error);
    notFound();
  }
}