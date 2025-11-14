import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { File, FileSystemNode } from '@/lib/types';
import { FolderIcon } from './icons/FolderIcon';
import { FileIcon } from './icons/FileIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { NewFileIcon } from './icons/NewFileIcon';
import { NewFolderIcon } from './icons/NewFolderIcon';
import { SearchIcon } from './icons/SearchIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { KebabMenuIcon } from './icons/KebabMenuIcon';


interface TreeViewProps {
  data: FileSystemNode[];
  onFileSelect: (file: File) => void;
  activeFileId: string | null;
  renamingId: string | null;
  onStartRename: (nodeId: string) => void;
  onCancelRename: () => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onNodeSelect: (nodeId: string) => void;
  selectedNodeId: string | null;
  onDeleteNode: (nodeId: string) => void;
  onCopyNode: (nodeId: string) => void;
}

interface TreeItemProps {
    node: FileSystemNode;
    onFileSelect: (file: File) => void;
    level: number;
    activeFileId: string | null;
    renamingId: string | null;
    onStartRename: (nodeId: string) => void;
    onCancelRename: () => void;
    onRenameNode: (nodeId: string, newName: string) => void;
    onNodeSelect: (nodeId: string) => void;
    selectedNodeId: string | null;
    onDeleteNode: (nodeId: string) => void;
    onCopyNode: (nodeId: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = (props) => {
  const { node, onFileSelect, level, activeFileId, renamingId, onStartRename, onCancelRename, onRenameNode, onNodeSelect, selectedNodeId, onDeleteNode, onCopyNode } = props;
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState(node.name);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isRenaming = renamingId === node.id;
  const isSelected = selectedNodeId === node.id;

  useEffect(() => {
    if (!isRenaming) {
      setInputValue(node.name);
    }
  }, [isRenaming, node.name]);

   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleRenameSubmit = () => {
    if (inputValue.trim() && inputValue.trim() !== node.name) {
      onRenameNode(node.id, inputValue);
    } else {
      onCancelRename();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelRename();
    }
  };

  const nameComponent = isRenaming ? (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleRenameSubmit}
      onKeyDown={handleKeyDown}
      autoFocus
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="bg-gray-200 dark:bg-gray-700 border border-blue-500 rounded px-1 -ml-1 text-sm w-full outline-none"
    />
  ) : (
    <span className="text-sm truncate">{node.name}</span>
  );


  if (node.type === 'folder') {
    return (
      <div className="text-sm">
        <div
          onClick={() => onNodeSelect(node.id)}
          onDoubleClick={() => setIsOpen(!isOpen)}
          className={`flex items-center cursor-pointer p-1 rounded ${isSelected ? 'bg-blue-500/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          style={{ paddingLeft: `${level * 1}rem` }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="p-0.5">
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </span>
          <FolderIcon className="mx-1 flex-shrink-0"/>
          {nameComponent}
          <div className="ml-auto flex-shrink-0 relative" ref={menuRef}>
            {(isHovered || isMenuOpen) && !isRenaming && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }} 
                className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                  <KebabMenuIcon />
              </button>
            )}
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 w-32">
                  <button onClick={(e) => { e.stopPropagation(); onStartRename(node.id); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">Rename</button>
                  <button onClick={(e) => { e.stopPropagation(); onCopyNode(node.id); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">Copy</button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">Delete</button>
              </div>
            )}
          </div>
        </div>
        {isOpen && (
          <div>
            {node.children.map(child => (
              <TreeItem key={child.id} {...props} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => { if(!isRenaming) { onFileSelect(node); onNodeSelect(node.id); } }}
      className={`flex items-center cursor-pointer p-1 rounded ${isSelected ? 'bg-blue-500/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
      style={{ paddingLeft: `${level * 1}rem` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FileIcon className="mx-1 flex-shrink-0" />
      {nameComponent}
      <div className="ml-auto flex-shrink-0 relative" ref={menuRef}>
        {(isHovered || isMenuOpen) && !isRenaming && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(prev => !prev); }} 
            className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
              <KebabMenuIcon />
          </button>
        )}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 w-32">
              <button onClick={(e) => { e.stopPropagation(); onStartRename(node.id); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">Rename</button>
              <button onClick={(e) => { e.stopPropagation(); onCopyNode(node.id); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">Copy</button>
              <button onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600">Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

const TreeView: React.FC<TreeViewProps> = ({ data, onFileSelect, activeFileId, renamingId, onStartRename, onCancelRename, onRenameNode, onNewFile, onNewFolder, onNodeSelect, selectedNodeId, onDeleteNode, onCopyNode }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filterTree = (nodes: FileSystemNode[], query: string): FileSystemNode[] => {
    if (!query.trim()) {
      return nodes;
    }

    const lowerCaseQuery = query.toLowerCase().trim();

    const recursivelyFilter = (nodes: FileSystemNode[]): FileSystemNode[] => {
      return nodes.reduce((acc, node) => {
        const nodeNameMatches = node.name.toLowerCase().includes(lowerCaseQuery);

        if (node.type === 'folder') {
          const filteredChildren = recursivelyFilter(node.children);
          if (nodeNameMatches || filteredChildren.length > 0) {
            acc.push({ ...node, children: nodeNameMatches ? node.children : filteredChildren });
          }
        } else if (nodeNameMatches) {
          acc.push(node);
        }
        return acc;
      }, [] as FileSystemNode[]);
    };

    return recursivelyFilter(nodes);
  };
  
  const filteredData = useMemo(() => filterTree(data, searchQuery), [data, searchQuery]);
  
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2">
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="text-lg font-semibold">Explorer</h2>
        <div className="flex items-center space-x-1">
            <button onClick={onNewFile} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="New File">
                <NewFileIcon />
            </button>
            <button onClick={onNewFolder} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="New Folder">
                <NewFolderIcon />
            </button>
             <button
              onClick={() => selectedNodeId && onDeleteNode(selectedNodeId)}
              disabled={!selectedNodeId}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete"
              title="Delete selected file or folder"
            >
                <DeleteIcon />
            </button>
        </div>
      </div>
       <div className="relative mb-2 px-1">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
        </span>
        <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search files and folders"
        />
      </div>
      {filteredData.map(node => (
        <TreeItem 
            key={node.id} 
            node={node} 
            onFileSelect={onFileSelect} 
            level={0} 
            activeFileId={activeFileId} 
            renamingId={renamingId} 
            onStartRename={onStartRename} 
            onCancelRename={onCancelRename} 
            onRenameNode={onRenameNode} 
            onNodeSelect={onNodeSelect} 
            selectedNodeId={selectedNodeId}
            onDeleteNode={onDeleteNode}
            onCopyNode={onCopyNode}
        />
      ))}
    </div>
  );
};

export default TreeView;