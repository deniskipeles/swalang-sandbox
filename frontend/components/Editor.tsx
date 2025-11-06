"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorProps {
  files: Record<string, string>;
  activeFile: string;
  onChange: (path: string, content: string) => void;
}

export default function Editor({ files, activeFile, onChange }: EditorProps) {
  return (
    <div className="flex-1">
      <MonacoEditor
        language="python" // until Swalang syntax highlighting is ready
        value={files[activeFile] || ""}
        theme="vs-dark"
        onChange={(v) => onChange(activeFile, v || "")}
      />
    </div>
  );
}
