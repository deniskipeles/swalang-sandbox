export const ASTRA_API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

export interface FileSystemNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: FileSystemNode[];
  isFolder?: boolean;
}

export async function getProject(id: string, version?: string): Promise<{
  strategy: "fat" | "split";
  size: number;
  tree?: FileSystemNode[];
  files?: FileSystemNode[];
}> {
  // Conditionally build the URL to include the version if it exists.
  const url = version
    ? `${ASTRA_API}/api/projects/${id}?version=${version}`
    : `${ASTRA_API}/api/projects/${id}`;

  const res = await fetch(url, { cache: 'no-store' }); // Use no-store to ensure fresh data for versions
  if (!res.ok) throw new Error("Project not found");
  
  const data = await res.json();
  return data;
}

export async function getFileContent(projectId: string, path: string, version?: string): Promise<string> {
  const url = version
    ? `${ASTRA_API}/api/projects/${projectId}/files/${path}?version=${version}`
    : `${ASTRA_API}/api/projects/${projectId}/files/${path}`;
    
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error("File not found");
  return res.text();
}

export async function saveProject(id: string, tree: FileSystemNode[]): Promise<any> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tree }),
  });
  if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save project');
  }
  return res.json();
}

export async function indexProject(id: string): Promise<{ jobId: string }> {
  const res = await fetch(`${ASTRA_API}/api/projects/${id}/index`, { method: "POST" });
  return res.json();
}

export async function searchSimilar(
  projectId: string,
  query: { text?: string; filePath?: string; limit?: number }
): Promise<SimilarResult[]> {
  const res = await fetch(`${ASTRA_API}/api/search/similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, ...query, limit: query.limit || 10 }),
  });
  const data = await res.json();
  return data.results;
}

export interface SimilarResult {
  path: string;
  name: string;
  similarity: number;
}

export function websocket(projectId: string, onUpdate: (data: any) => void) {
  const ws = new WebSocket(`ws://localhost:8080/ws/${projectId}`);
  ws.onmessage = (e) => onUpdate(JSON.parse(e.data));
  return ws;
}

/**
 * Fetches a specific version of a project's file tree from Astra.
 * @param astraSnapshotVersion The timeuuid of the snapshot.
 * @returns The file system tree.
 */
export async function getSnapshotFromAstra(
  projectId: string,
  userId: string,
  astraSnapshotVersion: string
): Promise<{ tree: FileSystemNode[] }> {
  const res = await fetch(`${ASTRA_API}/api/projects/${projectId}/snapshots/${astraSnapshotVersion}`, {
    headers: { "X-User-Id": userId },
  });
  if (!res.ok) {
    if (res.status === 404) return { tree: [] };
    throw new Error("Failed to fetch snapshot from Astra");
  }
  return res.json();
}