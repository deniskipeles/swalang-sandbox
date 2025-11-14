// frontend/lib/types.ts
export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}



export interface File {
  id: string;
  name: string;
  type: 'file';
  content: string;
}

export interface Folder {
  id:string;
  name: string;
  type: 'folder';
  children: FileSystemNode[];
}

export type FileSystemNode = File | Folder;

export type ActiveMobileView = 'explorer' | 'editor' | 'console' | 'preview';

// Add this interface to your types.ts file
export interface GetProjectResponse {
  strategy: 'fat' | 'split';
  size: number;
  tree?: FileSystemNode[];
  files?: { name: string; isFolder: boolean }[];
}