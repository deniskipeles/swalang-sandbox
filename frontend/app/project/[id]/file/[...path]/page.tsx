import { getProject, getFileContent } from "@/lib/astra";
import { notFound } from "next/navigation";
import FileIDEView from "@/components/FileIDEView";
import type { GetProjectResponse } from "@/lib/types";

// SEO: Generate dynamic metadata for the specific file page
export async function generateMetadata({ params }: { params: { id: string; path: string[] } }) {
  const path = params.path.join("/");
  return {
    title: `${path} - ${params.id} | Swalang Sandbox`,
    description: `Viewing and editing ${path} in project ${params.id}. A live IDE with file tree navigation and code execution.`,
    openGraph: {
      title: `${path} - ${params.id}`,
      description: `Navigate the full project and run your code live.`,
      type: "article",
    },
  };
}

// SEO: Pre-render all file pages at build time for maximum performance
export async function generateStaticParams({ params }: { params: { id: string } }) {
  try {
    const { strategy, tree, files } = await getProject(params.id);
    let paths: string[] = [];

    if (strategy === "fat" && tree) {
      const flatten = (nodes: any[], prefix = ""): string[] => {
        return nodes.flatMap((n) => {
          const currentPath = prefix ? `${prefix}/${n.name}` : n.name;
          return n.type === "folder" ? flatten(n.children, currentPath) : [currentPath];
        });
      };
      paths = flatten(tree);
    } else if (files) {
      paths = files.filter((f) => !f.isFolder).map((f) => f.name);
    }
    
    return paths.map((p) => ({ path: p.split("/") }));
  } catch (error) {
    console.error(`Could not generate static params for project ${params.id}:`, error);
    return [];
  }
}

// The main page component - a Server Component
export default async function FilePage({ params }: { params: { id: string; path: string[] } }) {
  const path = params.path.join("/");
  
  try {
    // Fetch project structure and specific file content in parallel
    const [project, content] = await Promise.all([
      getProject(params.id),
      getFileContent(params.id, path)
    ]);

    if (!project || content === null) {
      notFound();
    }
    
    // Pass all initial data to the client component for rendering the interactive IDE
    return (
      <FileIDEView
        projectId={params.id}
        initialProject={project as GetProjectResponse}
        activeFilePath={path}
        initialContent={content}
      />
    );

  } catch (error) {
    console.error(`Error loading page for /project/${params.id}/file/${path}:`, error);
    notFound();
  }
}