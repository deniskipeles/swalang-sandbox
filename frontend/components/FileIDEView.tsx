"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TreeView from '@/components/TreeView';
import Editor from '@/components/Editor';
import Console from '@/components/Console';
import EditorTabs from '@/components/EditorTabs';
import { getFileContent } from '@/lib/astra';
import { SWALANG_API_URL } from '@/lib/constants';
import type { File, FileSystemNode, ActiveMobileView } from '@/lib/types';
import type { GetProjectResponse } from '@/lib/types';
import { FilesIcon } from '@/components/icons/FilesIcon';
import { CodeIcon } from '@/components/icons/CodeIcon';
import { TerminalIcon } from '@/components/icons/TerminalIcon';
import { AlertTriangle } from 'lucide-react';

// Helper to build a tree from the flat list returned by the 'split' strategy
const buildTreeFromSplitList = (apiNodes: any[]): FileSystemNode[] => {
    const fileTree: FileSystemNode[] = [];
    const map = new Map<string, FileSystemNode>();
    
    // Ensure nodes are sorted by path depth to build parent directories first
    const sortedNodes = (apiNodes || []).sort((a, b) => (a.id || a.name).localeCompare(b.id || b.name));
    
    sortedNodes.forEach(node => {
        const path = node.id || node.name;
        const parts = path.split('/');
        const fileName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');

        let newNode: FileSystemNode;
        if (node.isFolder) {
            newNode = { id: path, name: fileName, type: 'folder', children: [] };
        } else {
            newNode = { id: path, name: fileName, type: 'file', content: '' };
        }
        
        map.set(path, newNode);

        if (parentPath) {
            const parent = map.get(parentPath);
            if (parent?.type === 'folder') {
                parent.children.push(newNode);
            }
        } else {
            fileTree.push(newNode);
        }
    });
    return fileTree;
};

const findFileById = (nodes: FileSystemNode[], id: string): File | null => {
    for (const node of nodes) {
        if (node.type === 'file' && node.id === id) return node;
        if (node.type === 'folder') {
            const found = findFileById(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

const flattenFilesForApi = (nodes: FileSystemNode[], contents: Record<string, string>, pathPrefix = ''): { path: string, content: string }[] => {
    return nodes.flatMap(node => {
        const newPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
        if (node.type === 'file') {
            return [{ path: newPath, content: contents[node.id] ?? node.content ?? '' }];
        }
        if (node.type === 'folder') {
            return flattenFilesForApi(node.children, contents, newPath);
        }
        return [];
    });
};

interface FileIDEViewProps {
    projectId: string;
    initialProject: GetProjectResponse;
    activeFilePath: string;
    initialContent: string;
    currentVersion?: string;
}

export default function FileIDEView({ projectId, initialProject, activeFilePath, initialContent, currentVersion }: FileIDEViewProps) {
    const router = useRouter();
    const [isReadOnly] = useState(!!currentVersion);

    const [fileSystem, setFileSystem] = useState<FileSystemNode[]>(() => 
        initialProject.strategy === 'fat' && initialProject.tree 
        ? initialProject.tree as unknown as FileSystemNode[]
        : buildTreeFromSplitList(initialProject.files || [])
    );
    
    const findNodeByPath = (nodes: FileSystemNode[], path: string, currentPath = ''): FileSystemNode | null => {
        for (const node of nodes) {
            const newPath = currentPath ? `${currentPath}/${node.name}` : node.name;
            if (newPath === path) return node;
            if (node.type === 'folder') {
                const found = findNodeByPath(node.children, path, newPath);
                if (found) return found;
            }
        }
        return null;
    }

    const initialNode = findNodeByPath(fileSystem, activeFilePath);
    const initialActiveFileId = initialNode?.id || activeFilePath;

    const [fileContents, setFileContents] = useState<Record<string, string>>({ [initialActiveFileId]: initialContent });
    const [openFileIds, setOpenFileIds] = useState<Set<string>>(new Set([initialActiveFileId]));
    const [activeFileId, setActiveFileId] = useState<string | null>(initialActiveFileId);
    const [consoleLogs, setConsoleLogs] = useState<string[]>([`File loaded: ${activeFilePath}`]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
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
                ws.onopen = () => setConsoleLogs(p => [...p, 'Connected to execution server.']);
            } catch (e) { console.error(e); }
        };
        connect();
        return () => ws?.close();
    }, []);

    // CORRECTED LOGIC IS HERE
    const handleFileSelect = useCallback(async (file: File) => {
        // Re-introduce the robust path finding helper function
        const findPathById = (nodes: FileSystemNode[], nodeId: string, currentPath = ''): string | null => {
            for (const node of nodes) {
                const newPath = currentPath ? `${currentPath}/${node.name}` : node.name;
                if (node.id === nodeId) return newPath;
                if (node.type === 'folder') {
                    const result = findPathById(node.children, nodeId, newPath);
                    if (result) return result;
                }
            }
            return null;
        };
        
        // Always derive the filePath from the tree structure to handle "fat" loads correctly
        const filePath = findPathById(fileSystem, file.id);
        if (!filePath) {
            console.error("Could not determine file path for navigation.");
            return;
        }

        if (fileContents[file.id] === undefined) {
            try {
                const content = await getFileContent(projectId, filePath, currentVersion);
                setFileContents(prev => ({ ...prev, [file.id]: content }));
            } catch (error) {
                setFileContents(prev => ({ ...prev, [file.id]: "// Error loading content" }));
            }
        }
        setOpenFileIds(prev => new Set(prev).add(file.id));
        setActiveFileId(file.id);

        const url = currentVersion 
            ? `/project/${projectId}/file/${filePath}?version=${currentVersion}`
            : `/project/${projectId}/file/${filePath}`;
        router.push(url, { scroll: false });
    }, [projectId, fileContents, router, currentVersion, fileSystem]);

    const handleMobileFileSelect = useCallback(async (file: File) => {
        await handleFileSelect(file);
        setActiveMobileView('editor');
    }, [handleFileSelect]);
    
    const handleRunCode = useCallback(async () => {
        if (!webSocket || !sessionId) {
            setConsoleLogs(p => [...p, "Error: Not connected to execution server."]);
            return;
        }
        setIsExecuting(true);
        setConsoleLogs(['Uploading all project files...']);
        try {
            const filesToUpload = flattenFilesForApi(fileSystem, fileContents);
            
            await Promise.all(
                filesToUpload.map(file => 
                    fetch(`${SWALANG_API_URL}/api/session/${sessionId}/files`, {
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(file)
                    })
                )
            );

            setConsoleLogs(prev => [...prev, 'Files uploaded. Executing main.sw...']);
            webSocket.send(JSON.stringify({ action: 'run' }));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setConsoleLogs(p => [...p, `Error during execution: ${errorMessage}`]);
        } finally {
            setIsExecuting(false);
        }
    }, [sessionId, webSocket, fileSystem, fileContents]);

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
            {isReadOnly && (
                <div className="bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 flex items-center justify-center text-center py-1.5 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    You are viewing a historical version. Editing is disabled.
                </div>
            )}
            <div className="hidden md:flex flex-1 overflow-hidden">
                <aside className="w-64 bg-gray-50 dark:bg-gray-800 flex flex-col h-full">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold truncate">Project: {projectId}</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <TreeView
                            data={fileSystem}
                            onFileSelect={handleFileSelect}
                            activeFileId={activeFileId}
                            renamingId={null} onStartRename={()=>{}} onCancelRename={()=>{}}
                            onRenameNode={()=>{}} onNewFile={()=>{}} onNewFolder={()=>{}}
                            onNodeSelect={(id) => {
                                const file = findFileById(fileSystem, id);
                                if (file) handleFileSelect(file);
                            }}
                            selectedNodeId={activeFileId}
                            onDeleteNode={()=>{}} onCopyNode={()=>{}}
                            readOnly={isReadOnly}
                        />
                    </div>
                </aside>
                <main className="flex-1 flex flex-col min-w-0 h-full">
                    <header className="flex-shrink-0">
                        <EditorTabs
                            files={openFiles}
                            activeFileId={activeFileId}
                            onTabClick={(id) => {
                                const file = findFileById(fileSystem, id);
                                if (file) handleFileSelect(file);
                            }}
                            onTabClose={(id) => setOpenFileIds(p => { const n = new Set(p); n.delete(id); return n; })}
                            dirtyFileIds={new Set()}
                        />
                    </header>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <div className="flex-grow">
                            <Editor
                                fileName={activeFile?.name || ''}
                                content={activeFileId ? fileContents[activeFileId] ?? null : null}
                                onContentChange={(content) => {
                                    if (!isReadOnly) {
                                      setFileContents(p => ({...p, [activeFileId!]: content}))
                                    }
                                }}
                                readOnly={isReadOnly}
                            />
                        </div>
                        <div className="h-1/3 max-h-96 border-t border-gray-300 dark:border-gray-700">
                            <Console
                                logs={consoleLogs}
                                onCommand={() => {}}
                                onRun={handleRunCode}
                                onClear={() => setConsoleLogs([])}
                                isExecuting={isExecuting}
                            />
                        </div>
                    </div>
                </main>
            </div>

            <div className="flex md:hidden flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {activeMobileView === 'explorer' && 
                        <TreeView
                            data={fileSystem}
                            onFileSelect={handleMobileFileSelect}
                            activeFileId={activeFileId}
                            renamingId={null} onStartRename={()=>{}} onCancelRename={()=>{}}
                            onRenameNode={()=>{}} onNewFile={()=>{}} onNewFolder={()=>{}}
                            onNodeSelect={(id) => {
                                const file = findFileById(fileSystem, id);
                                if (file) handleMobileFileSelect(file);
                            }}
                            selectedNodeId={activeFileId}
                            onDeleteNode={()=>{}} onCopyNode={()=>{}}
                            readOnly={isReadOnly}
                        />
                    }
                    {activeMobileView === 'editor' &&
                        <Editor
                            fileName={activeFile?.name || ''}
                            content={activeFileId ? fileContents[activeFileId] ?? null : null}
                            onContentChange={(content) => {
                                if (!isReadOnly) {
                                  setFileContents(p => ({...p, [activeFileId!]: content}))
                                }
                            }}
                            readOnly={isReadOnly}
                        />
                    }
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
                    <MobileNavButton view="console" icon={<TerminalIcon />} label="Console" />
                </nav>
            </div>
        </div>
    );
}
