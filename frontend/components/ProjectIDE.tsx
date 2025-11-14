"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TreeView from '@/components/TreeView';
import Editor from '@/components/Editor';
import Console from '@/components/Console';
import EditorTabs from '@/components/EditorTabs';
import PreviewPane from '@/components/PreviewPane';
import { SWALANG_API_URL } from '@/lib/constants';
import { getFileContent, saveProject } from "@/lib/astra";
import type { File, Folder, FileSystemNode, ActiveMobileView } from '@/lib/types';
import type { FileSystemNode as ApiFileSystemNode } from "@/lib/astra";
import { MenuIcon } from '@/components/icons/MenuIcon';
import { SaveIcon } from '@/components/icons/SaveIcon';
import { PreviewIcon } from '@/components/icons/PreviewIcon';
import { EditIcon } from '@/components/icons/EditIcon';
import { FilesIcon } from '@/components/icons/FilesIcon';
import { CodeIcon } from '@/components/icons/CodeIcon';
import { TerminalIcon } from '@/components/icons/TerminalIcon';

/* --- Helper Functions --- */

const findNodeById = (nodes: FileSystemNode[], id: string): FileSystemNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.type === 'folder') {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findFileById = (nodes: FileSystemNode[], id: string): File | null => {
  const node = findNodeById(nodes, id);
  return node?.type === 'file' ? node : null;
};

const findParentId = (nodes: FileSystemNode[], childId: string): string | null => {
    for (const node of nodes) {
        if (node.type === 'folder') {
            if (node.children.some(child => child.id === childId)) return node.id;
            const found = findParentId(node.children, childId);
            if (found) return found;
        }
    }
    return null;
};

const buildTreeFromSplitList = (apiNodes: ApiFileSystemNode[]): FileSystemNode[] => {
  const root: Folder = { id: 'root', name: 'root', type: 'folder', children: [] };
  const map = new Map<string, FileSystemNode>([['', root]]);

  apiNodes.forEach(node => {
    const path = node.name;
    const parts = path.split('/');
    let currentParentPath = '';
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const newPath = currentParentPath ? `${currentParentPath}/${part}` : part;
      if (!map.has(newPath)) {
        const parentNode = map.get(currentParentPath)! as Folder;
        const newFolder: Folder = { id: newPath, name: part, type: 'folder', children: [] };
        parentNode.children.push(newFolder);
        map.set(newPath, newFolder);
      }
      currentParentPath = newPath;
    }
  });

  apiNodes.forEach(node => {
    const path = node.name;
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');
    const parentNode = map.get(parentPath)! as Folder;

    if (!map.has(path)) {
        let newNode: FileSystemNode;
        if (node.isFolder) {
            newNode = { id: path, name: fileName, type: 'folder', children: [] };
        } else {
            newNode = { id: path, name: fileName, type: 'file', content: '' };
        }
      parentNode.children.push(newNode);
      map.set(path, newNode);
    }
  });

  return root.children;
};

const flattenFilesForApi = (nodes: FileSystemNode[], contents: Record<string, string>, pathPrefix = ''): { path: string, content: string }[] => {
    return nodes.flatMap(node => {
        const newPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
        if (node.type === 'file') {
            return [{ path: newPath, content: contents[node.id] ?? node.content }];
        }
        return flattenFilesForApi(node.children, contents, newPath);
    });
};

const buildFileTreeWithContent = (nodes: FileSystemNode[], contents: Record<string, string>): FileSystemNode[] => {
    return nodes.map(node => {
        if (node.type === 'file') return { ...node, content: contents[node.id] || '' };
        if (node.type === 'folder') return { ...node, children: buildFileTreeWithContent(node.children, contents) };
        return node;
    });
};

/* --- Project IDE Client Component --- */
interface ProjectIDEProps {
  projectId: string;
  strategy: 'fat' | 'split';
  initialTree?: FileSystemNode[];
  initialFiles?: ApiFileSystemNode[];
}

const ProjectIDE: React.FC<ProjectIDEProps> = ({ projectId, strategy, initialTree, initialFiles }) => {
  const router = useRouter();
  const [fileSystem, setFileSystem] = useState<FileSystemNode[]>(() => {
    if (strategy === 'fat' && initialTree) return initialTree;
    if (strategy === 'split' && initialFiles) return buildTreeFromSplitList(initialFiles);
    return [];
  });
  
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
    if (strategy === 'fat' && initialTree) {
        const contents: Record<string, string> = {};
        const traverse = (nodes: FileSystemNode[]) => {
            nodes.forEach(node => {
                if (node.type === 'file') contents[node.id] = node.content;
                else if (node.type === 'folder') traverse(node.children);
            });
        };
        traverse(initialTree);
        return contents;
    }
    return {};
  });

  const [openFileIds, setOpenFileIds] = useState<Set<string>>(new Set());
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([`Project ${projectId} loaded.`]);
  const [isSidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<ActiveMobileView>('editor');

  const openFiles = useMemo(() => [...openFileIds].map(id => findFileById(fileSystem, id)).filter((f): f is File => f !== null), [openFileIds, fileSystem]);
  const activeFile = useMemo(() => activeFileId ? findFileById(fileSystem, activeFileId) : null, [activeFileId, fileSystem]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    const connect = async () => {
      try {
        const res = await fetch(`${SWALANG_API_URL}/api/session/new`, { method: 'POST' });
        const data = await res.json();
        setSessionId(data.session_id);
        const url = data.ws_url.startsWith('ws:') ? data.ws_url.replace('ws:', 'wss:') : data.ws_url;
        ws = new WebSocket(url);
        setWebSocket(ws);
        ws.onopen = () => setConsoleLogs(prev => [...prev, 'Connected to execution server.']);
        ws.onmessage = e => setConsoleLogs(prev => [...prev, JSON.parse(e.data).content || e.data]);
        ws.onerror = () => setConsoleLogs(prev => [...prev, 'WebSocket error.']);
        ws.onclose = () => setWebSocket(null);
      } catch (e) { console.error(e); }
    };
    connect();
    return () => ws?.close();
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    const findPathById = (nodes: FileSystemNode[], nodeId: string, currentPath = ''): string | null => {
        for (const node of nodes) {
            const path = currentPath ? `${currentPath}/${node.name}` : node.name;
            if (node.id === nodeId) return path;
            if (node.type === 'folder') {
                const result = findPathById(node.children, nodeId, path);
                if (result) return result;
            }
        }
        return null;
    };
    const filePath = strategy === 'fat' ? findPathById(fileSystem, file.id) : file.id;

    if (isEditingMode) {
      setOpenFileIds(prev => new Set(prev).add(file.id));
      setActiveFileId(file.id);
      setSelectedNodeId(file.id);
      if (strategy === 'split' && fileContents[file.id] === undefined) {
        setIsLoadingContent(true);
        try {
          const content = await getFileContent(projectId, filePath!);
          setFileContents(prev => ({ ...prev, [file.id]: content }));
        } catch (e) {
          setFileContents(prev => ({ ...prev, [file.id]: `// Error loading file` }));
        } finally {
          setIsLoadingContent(false);
        }
      }
    } else {
      if (filePath) {
        router.push(`/project/${projectId}/file/${filePath}`);
      }
    }
  }, [isEditingMode, strategy, projectId, fileContents, router, fileSystem]);

  const handleMobileFileSelect = useCallback(async (file: File) => {
    await handleFileSelect(file);
    setActiveMobileView('editor');
  }, [handleFileSelect]);

  const handleContentChange = useCallback((content: string) => {
    if (activeFileId) {
      setFileContents(prev => ({ ...prev, [activeFileId]: content }));
      setDirtyFileIds(prev => new Set(prev).add(activeFileId));
    }
  }, [activeFileId]);

  const handleSaveProject = useCallback(async () => {
    setIsSaving(true);
    setConsoleLogs(prev => [...prev, 'Saving project...']);
    try {
      const treeToSave = buildFileTreeWithContent(fileSystem, fileContents);
      await saveProject(projectId, treeToSave);
      setDirtyFileIds(new Set());
      setConsoleLogs(prev => [...prev, 'Project saved successfully!']);
    } catch (e) {
      setConsoleLogs(prev => [...prev, `Error saving project: ${e}`]);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, fileSystem, fileContents]);

  const handleRunCode = useCallback(async () => {
    if (!webSocket || !sessionId) return;
    setIsExecuting(true);
    setConsoleLogs(['Uploading files...']);
    try {
      const filesToUpload = flattenFilesForApi(fileSystem, fileContents);
      console.log(filesToUpload)
      await Promise.all(filesToUpload.map(f => fetch(`${SWALANG_API_URL}/api/session/${sessionId}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })));
      setConsoleLogs(prev => [...prev, 'Executing...']);
      webSocket.send(JSON.stringify({ action: 'run' }));
    } catch (e) {
      setConsoleLogs(prev => [...prev, `Error: ${e}`]);
    } finally {
      setIsExecuting(false);
    }
  }, [sessionId, webSocket, fileSystem, fileContents]);

  const handleRenameNode = useCallback((nodeId: string, newName: string) => {
    const update = (nodes: FileSystemNode[]): FileSystemNode[] => nodes.map(n => {
        if (n.id === nodeId) return { ...n, name: newName.trim() };
        if (n.type === 'folder') return { ...n, children: update(n.children) };
        return n;
    });
    setFileSystem(prev => update(prev));
    setRenamingId(null);
  }, []);

  const handleCreateNode = useCallback((type: 'file' | 'folder') => {
    const parentNode = selectedNodeId ? findNodeById(fileSystem, selectedNodeId) : null;
    const parentId = parentNode?.type === 'folder' ? parentNode.id : (selectedNodeId ? findParentId(fileSystem, selectedNodeId) : null);
    const newId = `${Date.now()}`;
    const newNode: FileSystemNode = type === 'file' ? { id: newId, name: 'untitled.txt', type: 'file', content: '' } : { id: newId, name: 'NewFolder', type: 'folder', children: [] };
    
    const add = (nodes: FileSystemNode[]): FileSystemNode[] => {
        if (parentId === null) return [...nodes, newNode];
        return nodes.map(n => {
            if (n.id === parentId && n.type === 'folder') return { ...n, children: [...n.children, newNode] };
            if (n.type === 'folder') return { ...n, children: add(n.children) };
            return n;
        });
    };
    setFileSystem(prev => add(prev));
    if (newNode.type === 'file') setFileContents(prev => ({ ...prev, [newId]: '' }));
    setSelectedNodeId(newId);
    setRenamingId(newId);
  }, [fileSystem, selectedNodeId]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    const remove = (nodes: FileSystemNode[], id: string): FileSystemNode[] =>
      nodes.filter(n => n.id !== id).map(n => n.type === 'folder' ? { ...n, children: remove(n.children, id) } : n);
    setFileSystem(prev => remove(prev, nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId]);
  
  const handleTabClose = useCallback((fileId: string) => {
    setOpenFileIds(prev => { const next = new Set(prev); next.delete(fileId); return next; });
    if (activeFileId === fileId) {
      const remaining = [...openFileIds].filter(id => id !== fileId);
      setActiveFileId(remaining[remaining.length - 1] || null);
    }
  }, [activeFileId, openFileIds]);

  const MobileNavButton: React.FC<{ view: ActiveMobileView; icon: React.ReactNode; label: string; disabled?: boolean }> = ({ view, icon, label, disabled }) => (
    <button
      onClick={() => setActiveMobileView(view)}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs ${activeMobileView === view ? 'text-blue-400' : 'text-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-gray-800 flex flex-col font-sans">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className={`transition-all duration-300 ${isSidebarVisible ? 'w-64' : 'w-0'} bg-gray-50 dark:bg-gray-800 flex flex-col`}>
          <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold">Explorer</h2>
            <button
              onClick={() => setIsEditingMode(!isEditingMode)}
              title={isEditingMode ? "Switch to Navigation Mode" : "Switch to In-Place Editing Mode"}
              className={`p-1 rounded ${isEditingMode ? 'bg-blue-200 dark:bg-blue-800' : ''} hover:bg-gray-200 dark:hover:bg-gray-700`}
            >
              <EditIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TreeView data={fileSystem} onFileSelect={handleFileSelect} activeFileId={activeFileId} renamingId={renamingId} onStartRename={setRenamingId} onCancelRename={() => setRenamingId(null)} onRenameNode={handleRenameNode} onNewFile={() => handleCreateNode('file')} onNewFolder={() => handleCreateNode('folder')} onNodeSelect={setSelectedNodeId} selectedNodeId={selectedNodeId} onDeleteNode={handleDeleteNode} onCopyNode={() => {}} />
          </div>
        </div>
        <main className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center bg-gray-200 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
            <button onClick={() => setSidebarVisible(!isSidebarVisible)} className="p-2 hover:bg-gray-300 dark:hover:bg-gray-700"><MenuIcon /></button>
            <EditorTabs files={openFiles} activeFileId={activeFileId} onTabClick={setActiveFileId} onTabClose={handleTabClose} dirtyFileIds={dirtyFileIds} />
            <div className="ml-auto pr-2 flex items-center space-x-2">
              <button onClick={handleSaveProject} disabled={isSaving || dirtyFileIds.size === 0} className="p-2 rounded flex items-center space-x-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500" title="Save Project">
                <SaveIcon />
                <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save Project'}</span>
              </button>
              <button onClick={() => setPreviewVisible(!isPreviewVisible)} disabled={!activeFileId} className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50" title="Toggle Preview"><PreviewIcon /></button>
            </div>
          </header>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex-grow flex">
              <div className={`h-full ${isPreviewVisible && activeFileId ? 'w-1/2' : 'w-full'}`}>
                <Editor fileName={activeFile?.name || ''} content={isLoadingContent ? "// Loading..." : (activeFileId ? fileContents[activeFileId] ?? null : null)} onContentChange={handleContentChange} />
              </div>
              {isPreviewVisible && activeFileId && (
                <div className="w-1/2 h-full border-l"><PreviewPane fileName={activeFile?.name || ''} content={fileContents[activeFileId]} /></div>
              )}
            </div>
            <div className="h-1/3 max-h-96 border-t">
              <Console logs={consoleLogs} onCommand={()=>{}} onRun={handleRunCode} onClear={() => setConsoleLogs([])} isExecuting={isExecuting} />
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Layout */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {activeMobileView === 'explorer' && 
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Explorer</h2>
                <button
                  onClick={() => setIsEditingMode(!isEditingMode)}
                  title={isEditingMode ? "Editing Mode: Stays on page" : "Navigation Mode: Changes URL"}
                  className={`p-1 rounded ${isEditingMode ? 'bg-blue-200 dark:bg-blue-800' : ''} hover:bg-gray-200 dark:hover:bg-gray-700`}
                >
                  <EditIcon />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TreeView 
                  data={fileSystem} 
                  onFileSelect={handleMobileFileSelect} 
                  activeFileId={activeFileId}
                  renamingId={renamingId}
                  onStartRename={setRenamingId}
                  onCancelRename={() => setRenamingId(null)}
                  onRenameNode={handleRenameNode}
                  onNewFile={() => handleCreateNode('file')}
                  onNewFolder={() => handleCreateNode('folder')}
                  onNodeSelect={setSelectedNodeId}
                  selectedNodeId={selectedNodeId}
                  onDeleteNode={handleDeleteNode}
                  onCopyNode={() => {}}
                />
              </div>
            </div>
          }
          {activeMobileView === 'editor' && (
            <Editor
              fileName={activeFile?.name || ''}
              content={isLoadingContent ? "// Loading..." : (activeFileId ? fileContents[activeFileId] ?? null : null)}
              onContentChange={handleContentChange}
            />
          )}
          {activeMobileView === 'preview' && (
            <PreviewPane
              fileName={activeFile?.name || ''}
              content={activeFileId ? fileContents[activeFileId] : null}
            />
          )}
          {activeMobileView === 'console' && 
            <Console 
              logs={consoleLogs} 
              onCommand={() => {}}
              onRun={handleRunCode}
              onClear={() => setConsoleLogs([])}
              isExecuting={isExecuting}
            />
          }
        </main>
        <nav className="flex items-center bg-gray-200 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700">
          <MobileNavButton view="explorer" icon={<FilesIcon />} label="Explorer" />
          <MobileNavButton view="editor" icon={<CodeIcon />} label="Editor" />
          <MobileNavButton view="preview" icon={<PreviewIcon />} label="Preview" disabled={!activeFileId} />
          <MobileNavButton view="console" icon={<TerminalIcon />} label="Console" />
        </nav>
      </div>
    </div>
  );
};

export default ProjectIDE;