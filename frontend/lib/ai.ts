import { getProject, getFileContent, searchSimilar } from "./astra";
import { FileSystemNode } from "./types";

/**
 * AI Plugin Interface - Developers implement this
 */
export interface AIPlugin {
  name: string;
  analyze(projectId: string, context: AIContext): Promise<AIResponse>;
}

export interface AIContext {
  projectId: string;
  fileTree: any[];
  targetFile?: string;
  query?: string;
}

export interface AIResponse {
  suggestions: string[];
  relatedFiles: string[];
  code?: string;
}

/**
 * Default AI: Vector-based code assistant
 */
export const VectorAI: AIPlugin = {
  name: "VectorAI",
  async analyze(projectId, context) {
    const results = await searchSimilar(projectId, {
      text: context.query,
      limit: 5,
    });

    const relatedFiles = results.map((r) => r.path);
    return {
      suggestions: [
        `Found ${relatedFiles.length} similar files`,
        "Consider refactoring common patterns",
      ],
      relatedFiles,
    };
  },
};

/**
 * Get ALL project data for AI training
 */
export async function getAllProjectData(projectId: string) {
  const { strategy, tree, files } = await getProject(projectId);
  
  if (strategy === "fat" && tree) {
    return {
      type: "complete",
      // The `tree` from getProject needs to be cast to the correct frontend type.
      // This is a safe cast assuming the structure is identical.
      files: flattenTree(tree as unknown as FileSystemNode[]),
    };
  }

  // For split, fetch each file content
  const fileData = await Promise.all(
    (files || []).map(async (f) => ({
      path: f.name,
      content: f.isFolder ? null : await getFileContent(projectId, f.name),
    }))
  );
  return { type: "split", files: fileData };
}


function flattenTree(nodes: FileSystemNode[], prefix = ""): any[] {
  return nodes.flatMap((n) => {
    const path = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === "folder") {
      return flattenTree(n.children || [], path);
    }
    return [{ path, content: n.content }];
  });
}