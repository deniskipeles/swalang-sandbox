export const ASTRA_API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

export interface FileSystemNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: FileSystemNode[];
  isFolder?: boolean;
}

export async function getProject(id: string): Promise<{
  strategy: "fat" | "split";
  size: number;
  tree?: FileSystemNode[];
  files?: FileSystemNode[];
}> {
  const res = await fetch(`${ASTRA_API}/api/projects/${id}`);
  if (!res.ok) throw new Error("Project not found");
  // FIX: Wait for the JSON promise to resolve
  const data = await res.json();
  return  data
}

export async function getFileContent(projectId: string, path: string): Promise<string> {
  const res = await fetch(`${ASTRA_API}/api/projects/${projectId}/files/${path}`);
  if (!res.ok) throw new Error("File not found");
  return res.text();
}

export async function saveProject(id: string, tree: FileSystemNode[]): Promise<void> {
  await fetch(`${ASTRA_API}/api/projects/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tree }),
  });
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