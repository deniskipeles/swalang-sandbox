"use client";

import { useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import Editor from "@/components/Editor";
import Console from "@/components/Console";
import FileTree from "@/components/FileTree";
import ThemeToggle from "@/components/ThemeToggle";

export default function Playground() {
  const { messages, runCode } = useWebSocket(process.env.NEXT_PUBLIC_WS_BASE + "/api/session/ws");
  const [files, setFiles] = useState<Record<string, string>>({ "main.sw": "print('Hello Swalang!')" });
  const [activeFile, setActiveFile] = useState("main.sw");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  async function uploadFiles() {
    for (const path in files) {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/session/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: files[path] }),
      });
    }
  }

  async function handleRun() {
    await uploadFiles();
    runCode();
  }

  function updateFile(path: string, content: string) {
    setFiles((f) => ({ ...f, [path]: content }));
  }

  function createFile() {
    const newFileName = prompt("Enter file name");
    if (newFileName) {
      setFiles((f) => ({ ...f, [newFileName]: "" }));
      setActiveFile(newFileName);
    }
  }

  return (
    <main className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-3 border-b">
        <div className="flex items-center">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2">
            {isSidebarOpen ? 'Close' : 'Open'} Files
          </button>
          <h1 className="font-bold">Swalang Playground</h1>
        </div>
        <ThemeToggle />
      </header>
      <div className="flex flex-col md:flex-row flex-1">
        {isSidebarOpen && (
          <div className="flex flex-col w-full md:w-48 border-r">
            <FileTree files={files} onSelect={setActiveFile} active={activeFile} />
            <button
              onClick={createFile}
              className="bg-gray-200 text-gray-800 rounded-md px-3 py-1 m-2"
            >
              + New File
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col">
          <Editor files={files} activeFile={activeFile} onChange={updateFile} />
          <div className="p-2">
            <button
              onClick={handleRun}
              className="bg-blue-600 text-white rounded-md px-3 py-1"
            >
              ▶ Run
            </button>
          </div>
          <Console logs={messages} />
        </div>
      </div>
    </main>
  );
}
