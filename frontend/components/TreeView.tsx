"use client";

import { useState } from "react";
import { FileNode } from "@/lib/types";
import { ChevronRight, ChevronDown, Folder, File, MoreVertical, Plus } from "lucide-react";

interface TreeViewProps {
  data: FileNode[];
  onSelect: (path: string) => void;
  onAddFile: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (path: string) => void;
}

interface TreeNodeProps {
  node: FileNode;
  level: number;
  onSelect: (path: string) => void;
  onAddFile: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (path: string) => void;
  path: string;
}

function TreeNode({ node, level, onSelect, onAddFile, onDelete, onRename, path }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const isFolder = node.type === "folder";

  return (
    <div>
      <div
        className="flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 relative"
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={() => (isFolder ? setIsOpen(!isOpen) : onSelect(path))}
      >
        {isFolder ? (
          <div className="flex items-center">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Folder size={16} className="ml-2" />
          </div>
        ) : (
          <File size={16} />
        )}
        <span className="ml-2">{node.name}</span>
        <div className="ml-auto">
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!isMenuOpen);
          }}>
            <MoreVertical size={16} />
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-8 right-0 bg-white dark:bg-gray-800 border rounded shadow-lg z-10">
            {isFolder && <button onClick={(e) => { e.stopPropagation(); onAddFile(path); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Add File</button>}
            <button onClick={(e) => { e.stopPropagation(); onRename(path); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Rename</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(path); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Delete</button>
          </div>
        )}
      </div>
      {isFolder && isOpen && (
        <div>
          {node.children?.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onAddFile={onAddFile}
              onDelete={onDelete}
              onRename={onRename}
              path={`${path}/${child.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView({ data, onSelect, onAddFile, onDelete, onRename }: TreeViewProps) {
  return (
    <div>
      {data.map((node) => (
        <TreeNode
          key={node.name}
          node={node}
          level={0}
          onSelect={onSelect}
          onAddFile={onAddFile}
          onDelete={onDelete}
          onRename={onRename}
          path={node.name}
        />
      ))}
    </div>
  );
}