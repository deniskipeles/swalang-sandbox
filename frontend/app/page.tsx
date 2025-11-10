"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useWebSocket } from "@/hooks/useWebSocket";
import Editor from "@/components/Editor";
import Console from "@/components/Console";
import TreeView from "@/components/TreeView";
import ThemeToggle from "@/components/ThemeToggle";
import { Folder, Play, X } from "lucide-react";
import { FileNode } from "@/lib/types";

// Helper function to convert a flat file map to a tree structure
function filesToTree(files: Record<string, string>): FileNode[] {
  const root: FileNode = { name: "root", type: "folder", children: [] };

  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    let currentNode = root;

    parts.forEach((part, index) => {
      let childNode = currentNode.children?.find((child) => child.name === part);

      if (!childNode) {
        childNode = {
          name: part,
          type: index === parts.length - 1 ? "file" : "folder",
          children: index === parts.length - 1 ? undefined : [],
        };
        currentNode.children?.push(childNode);
      }

      currentNode = childNode;
    });
  });

  return root.children || [];
}

// Helper function to convert a tree structure back to a flat file map
function treeToFiles(nodes: FileNode[], path = ""): Record<string, string> {
  let files: Record<string, string> = {};
  nodes.forEach(node => {
    const newPath = path ? `${path}/${node.name}` : node.name;
    if (node.type === "file") {
      files[newPath] = ""; // Content will be managed in fileContent state
    } else if (node.children) {
      files = { ...files, ...treeToFiles(node.children, newPath) };
    }
  });
  return files;
}

export default function Playground() {
  const session = useSession();
  const { messages, runCode } = useWebSocket(session?.ws_url);
  const [fileContent, setFileContent] = useState<Record<string, string>>({
    "main.sw": "print('Hello Swalang!')",
  });
  const [fileTree, setFileTree] = useState<FileNode[]>(filesToTree(fileContent));
  const [activeFile, setActiveFile] = useState("main.sw");
  const [isTreeVisible, setTreeVisible] = useState(false);
  const [isConsoleVisible, setConsoleVisible] = useState(false);

  async function uploadFiles() {
    if (!session) return;
    for (const path in fileContent) {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/session/${session.session_id}/files`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, content: fileContent[path] }),
        }
      );
    }
  }

  async function handleRun() {
    if (!session) return;
    await uploadFiles();
    runCode();
    if (window.innerWidth < 768) {
      setConsoleVisible(true);
    }
  }

  function updateFile(path: string, content: string) {
    setFileContent((f) => ({ ...f, [path]: content }));
  }

  function handleAddFile(path: string) {
    const newFileName = prompt("Enter file name");
    if (newFileName) {
      // Logic to add a file to the tree
      const newPath = path ? `${path}/${newFileName}` : newFileName;
      setFileContent(f => ({...f, [newPath]: ""}));
      setFileTree(filesToTree({...fileContent, [newPath]: ""}));
      setActiveFile(newPath);
    }
  }

  function handleDelete(path: string) {
    // Logic to delete a file or folder from the tree
    const newFileContent = {...fileContent};
    delete newFileContent[path];
    setFileContent(newFileContent);
    setFileTree(filesToTree(newFileContent));
    if (activeFile === path) {
      setActiveFile(Object.keys(newFileContent)[0]);
    }
  }

  function handleRename(path: string) {
    const newName = prompt("Enter new name");
    if (newName) {
      // Logic to rename a file or folder in the tree
      const newFileContent = {...fileContent};
      const content = newFileContent[path];
      delete newFileContent[path];
      const newPath = path.substring(0, path.lastIndexOf("/") + 1) + newName;
      newFileContent[newPath] = content;
      setFileContent(newFileContent);
      setFileTree(filesToTree(newFileContent));
      if (activeFile === path) {
        setActiveFile(newPath);
      }
    }
  }

  if (!session) return <div>Loading session...</div>;

  return (
    <main className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-3 border-b">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden"
            onClick={() => setTreeVisible(!isTreeVisible)}
          >
            <Folder />
          </button>
          <h1 className="font-bold">Swalang Playground</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRun}
            disabled={!session}
            className="hidden md:flex bg-blue-600 text-white rounded-md px-3 py-1 disabled:opacity-50 items-center gap-2"
          >
            <Play size={16} />
            Run
          </button>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`
            fixed md:relative top-0 left-0 h-full bg-white dark:bg-gray-900 z-10
            transform ${isTreeVisible ? "translate-x-0" : "-translate-x-full"}
            transition-transform duration-300 ease-in-out
            md:transform-none md:w-64 border-r flex flex-col
          `}
        >
          <div className="flex justify-between items-center p-2 border-b md:hidden">
            <h2 className="font-bold">Files</h2>
            <button onClick={() => setTreeVisible(false)}>
              <X />
            </button>
          </div>
          <TreeView
            data={fileTree}
            onSelect={(file) => {
              setActiveFile(file);
              setTreeVisible(false);
            }}
            onAddFile={handleAddFile}
            onDelete={handleDelete}
            onRename={handleRename}
          />
           <button
            onClick={() => handleAddFile("")}
            className="bg-gray-200 text-gray-800 rounded-md px-3 py-1 m-2"
          >
            + New File
          </button>
        </div>
        <div className="flex-1 flex flex-col">
          <Editor
            files={fileContent}
            activeFile={activeFile}
            onChange={updateFile}
          />
          <div className="hidden md:block">
            <Console logs={messages} />
          </div>
        </div>
      </div>
      <footer className="md:hidden p-4 flex justify-end">
        <button
          onClick={handleRun}
          disabled={!session}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg disabled:opacity-50"
        >
          <Play />
        </button>
      </footer>
      {isConsoleVisible && (
        <div className="fixed bottom-0 left-0 w-full h-1/2 bg-white dark:bg-gray-900 z-20 flex flex-col">
           <div className="flex justify-between items-center p-2 border-b">
             <h2 className="font-bold">Console</h2>
             <button onClick={() => setConsoleVisible(false)}>
               <X />
             </button>
           </div>
          <Console logs={messages} />
        </div>
      )}
    </main>
  );
}
