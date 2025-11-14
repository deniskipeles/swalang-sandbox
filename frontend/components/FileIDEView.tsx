"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TreeView from '@/components/TreeView';
import Editor from '@/components/Editor';
import Console from '@/components/Console';
import EditorTabs from '@/components/EditorTabs';
import { getFileContent } from '@/lib/astra';
import { SWALANG_API_URL } from '@/lib/constants';
import type { File, FileSystemNode } from '@/lib/types';
import type { GetProjectResponse } from '@/lib/types'; // Assuming you create this type

// Helper to build a tree from the flat list returned by the 'split' strategy
const buildTreeFromSplitList = (apiNodes: any[]): FileSystemNode[] => {
    const fileTree: FileSystemNode[] = [];
    const map = new Map<string, FileSystemNode>();
    apiNodes.sort((a, b) => a.name.localeCompare(b.name)).forEach(node => {
        const path = node.name;
        const parts = path.split('/');
        const fileName = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');
        let newNode: FileSystemNode;
        if (node.isFolder) {
            newNode = {
                id: path,
                name: fileName,
                type: 'folder', // Type is explicitly 'folder'
                children: []
            };
        } else {
            newNode = {
                id: path,
                name: fileName,
                type: 'file', // Type is explicitly 'file'
                content: ''  // Content is an empty string, to be loaded on demand
            };
        }
        map.set(path, newNode);
        if (parentPath) {
            const parent = map.get(parentPath);
            if (parent?.type === 'folder') parent.children.push(newNode);
        } else {
            fileTree.push(newNode);
        }
    });
    return fileTree;
};

const findFileByPath = (nodes: FileSystemNode[], path: string): File | null => {
    for (const node of nodes) {
        if (node.type === 'file' && node.id === path) return node;
        if (node.type === 'folder') {
            const found = findFileByPath(node.children, path);
            if (found) return found;
        }
    }
    return null;
}

interface FileIDEViewProps {
    projectId: string;
    initialProject: GetProjectResponse;
    activeFilePath: string;
    initialContent: string;
}

export default function FileIDEView({ projectId, initialProject, activeFilePath, initialContent }: FileIDEViewProps) {
    const router = useRouter();

    const [fileSystem, setFileSystem] = useState<FileSystemNode[]>(() => 
        initialProject.strategy === 'fat' && initialProject.tree 
        ? initialProject.tree as unknown as FileSystemNode[]
        : buildTreeFromSplitList(initialProject.files || [])
    );
    
    const [fileContents, setFileContents] = useState<Record<string, string>>({ [activeFilePath]: initialContent });
    const [openFileIds, setOpenFileIds] = useState<Set<string>>(new Set([activeFilePath]));
    const [activeFileId, setActiveFileId] = useState<string | null>(activeFilePath);
    const [consoleLogs, setConsoleLogs] = useState<string[]>([`File loaded: ${activeFilePath}`]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

    const openFiles = useMemo(() => [...openFileIds].map(id => findFileByPath(fileSystem, id)).filter((f): f is File => f !== null), [openFileIds, fileSystem]);
    const activeFile = useMemo(() => activeFileId ? findFileByPath(fileSystem, activeFileId) : null, [activeFileId, fileSystem]);

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

    const handleFileSelect = useCallback(async (file: File) => {
        const filePath = file.id; // The ID in this context is the full path
        if (fileContents[filePath] === undefined) {
            try {
                const content = await getFileContent(projectId, filePath);
                setFileContents(prev => ({ ...prev, [filePath]: content }));
            } catch (error) {
                setFileContents(prev => ({ ...prev, [filePath]: "// Error loading content" }));
            }
        }
        setOpenFileIds(prev => new Set(prev).add(filePath));
        setActiveFileId(filePath);
        // Update the browser's URL without a full page reload
        router.push(`/project/${projectId}/file/${filePath}`, { scroll: false });
    }, [projectId, fileContents, router]);

    const handleRunCode = useCallback(async () => {
        // This logic can be expanded, but for now, it runs the *active* file.
        // A more complex implementation might run a designated "main" file.
        if (!webSocket || !sessionId || !activeFile) return;
        setIsExecuting(true);
        setConsoleLogs(['Uploading and running...']);
        try {
            const fileToRun = { path: activeFile.name, content: fileContents[activeFile.id] };
            await fetch(`${SWALANG_API_URL}/api/session/${sessionId}/files`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fileToRun)
            });
            webSocket.send(JSON.stringify({ action: 'run' }));
        } catch (e) {
            setConsoleLogs(p => [...p, `Error: ${e}`]);
        } finally {
            setIsExecuting(false);
        }
    }, [sessionId, webSocket, activeFile, fileContents]);

    return (
        <div className="flex h-screen w-screen bg-gray-100 dark:bg-gray-800 font-sans">
            <aside className="w-64 bg-gray-50 dark:bg-gray-800 flex flex-col h-full">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold truncate">Project: {projectId}</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <TreeView
                        data={fileSystem}
                        onFileSelect={handleFileSelect}
                        activeFileId={activeFileId}
                        // Other props can be set to disable functionality not needed in this view
                        renamingId={null} onStartRename={()=>{}} onCancelRename={()=>{}}
                        onRenameNode={()=>{}} onNewFile={()=>{}} onNewFolder={()=>{}}
                        onNodeSelect={(id) => setActiveFileId(id)} selectedNodeId={activeFileId}
                        onDeleteNode={()=>{}} onCopyNode={()=>{}}
                    />
                </div>
            </aside>
            <main className="flex-1 flex flex-col min-w-0 h-full">
                <header className="flex-shrink-0">
                    <EditorTabs
                        files={openFiles}
                        activeFileId={activeFileId}
                        onTabClick={(id) => handleFileSelect(findFileByPath(fileSystem, id)!)}
                        onTabClose={(id) => setOpenFileIds(p => { const n = new Set(p); n.delete(id); return n; })}
                        dirtyFileIds={new Set()}
                    />
                </header>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <div className="flex-grow">
                        <Editor
                            fileName={activeFile?.name || ''}
                            content={activeFileId ? fileContents[activeFileId] ?? null : null}
                            onContentChange={(content) => setFileContents(p => ({...p, [activeFileId!]: content}))}
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
    );
}