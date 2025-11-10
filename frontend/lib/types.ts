// frontend/lib/types.ts
export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}
