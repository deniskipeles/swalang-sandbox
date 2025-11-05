"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useWebSocket } from "@/hooks/useWebSocket";
import Editor from "@/components/Editor";
import Console from "@/components/Console";
import FileTree from "@/components/FileTree";
import ThemeToggle from "@/components/ThemeToggle";

export default function Playground() {
  const session = useSession();
  const { messages, runCode } = useWebSocket(session?.ws_url);
  const [files, setFiles] = useState<Record<string, string>>({ "main.sw": "print('Hello Swalang!')" });
  const [activeFile, setActiveFile] = useState("main.sw");

  async function uploadFiles() {
    if (!session) return;
    for (const path in files) {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/session/${session.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: files[path] }),
      });
    }
  }

  async function handleRun() {
    if (!session) return;
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

  if (!session) return <div>Loading session...</div>;

  return (
    <main className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-3 border-b">
        <h1 className="font-bold">Swalang Playground</h1>
        <ThemeToggle />
      </header>
      <div className="flex flex-1">
        <div className="flex flex-col w-48 border-r">
          <FileTree files={files} onSelect={setActiveFile} active={activeFile} />
          <button
            onClick={createFile}
            className="bg-gray-200 text-gray-800 rounded-md px-3 py-1 m-2"
          >
            + New File
          </button>
        </div>
        <div className="flex-1 flex flex-col">
          <Editor files={files} activeFile={activeFile} onChange={updateFile} />
          <div className="p-2">
            <button
              onClick={handleRun}
              disabled={!session}
              className="bg-blue-600 text-white rounded-md px-3 py-1 disabled:opacity-50"
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
