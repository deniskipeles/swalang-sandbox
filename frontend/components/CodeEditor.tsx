import React, { useState, useCallback, useMemo, useEffect } from 'react';
import TreeView from '@/components/TreeView';
import Editor from '@/components/Editor';
import Console from '@/components/Console';
import EditorTabs from '@/components/EditorTabs';
import { initialFileSystem, SWALANG_API_URL } from '@/lib/constants';
import type { File, Folder, FileSystemNode, ActiveMobileView } from '@/lib/types';
import { FilesIcon } from '@/components/icons/FilesIcon';
import { CodeIcon } from '@/components/icons/CodeIcon';
import { TerminalIcon } from '@/components/icons/TerminalIcon';
import { MenuIcon } from '@/components/icons/MenuIcon';
import { XIcon } from '@/components/icons/XIcon';
import { SaveIcon } from '@/components/icons/SaveIcon';
import { PreviewIcon } from '@/components/icons/PreviewIcon';
import PreviewPane from '@/components/PreviewPane';


const findFileById = (nodes: FileSystemNode[], id: string): File | null => {
  for (const node of nodes) {
    if (node.type === 'file' && node.id === id) {
      return node;
    }
    if (node.type === 'folder') {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findNodeById = (nodes: FileSystemNode[], id: string): FileSystemNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.type === 'folder') {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findParentId = (nodes: FileSystemNode[], childId: string): string | null => {
    for (const node of nodes) {
        if (node.type === 'folder') {
            if (node.children.some(child => child.id === childId)) {
                return node.id;
            }
            const found = findParentId(node.children, childId);
            if (found) return found;
        }
    }
    return null;
}

const App: React.FC = () => {
  const [fileSystem, setFileSystem] = useState<FileSystemNode[]>(initialFileSystem);
  const [openFileIds, setOpenFileIds] = useState<Set<string>>(new Set(['12'])); // Open main.sw by default
  const [activeFileId, setActiveFileId] = useState<string | null>('12'); // Set main.sw active by default
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
      const contents: Record<string, string> = {};
      const traverse = (nodes: FileSystemNode[]) => {
          for (const node of nodes) {
              if (node.type === 'file') {
                  contents[node.id] = node.content;
              } else {
                  traverse(node.children);
              }
          }
      };
      traverse(initialFileSystem);
      return contents;
  });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());

  const [consoleLogs, setConsoleLogs] = useState<string[]>(['Welcome to the console!']);
  const [activeMobileView, setActiveMobileView] = useState<ActiveMobileView>('editor');
  const [isSidebarVisible, setSidebarVisible] = useState<boolean>(true);
  const [isPreviewVisible, setPreviewVisible] = useState(false);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);


  const openFiles = useMemo(() => {
    return [...openFileIds].map(id => findFileById(fileSystem, id)).filter((file): file is File => file !== null);
  }, [openFileIds, fileSystem]);

  const activeFile = useMemo(() => {
    if (!activeFileId) return null;
    return findFileById(fileSystem, activeFileId);
  }, [activeFileId, fileSystem]);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const createSessionAndConnect = async () => {
        setConsoleLogs(prev => [...prev, 'Connecting to execution server...']);
        try {
            let response: Response | undefined;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    response = await fetch(`${SWALANG_API_URL}/api/session/new`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (response.ok) break;
                    if (attempt === 3) throw new Error(`Server responded with status ${response.status}`);
                } catch (error) {
                    if (attempt === 3) throw error;
                }
                setConsoleLogs(prev => [...prev, `Attempt ${attempt} failed. Retrying in 2 seconds...`]);
                await new Promise(res => setTimeout(res, 2000));
            }

            if (!response) {
                throw new Error('Failed to connect to the server after multiple attempts.');
            }
            
            const data = await response.json();
            setSessionId(data.session_id);

            const secureWsUrl = data.ws_url.replace(/^ws:/, 'wss:');

            ws = new WebSocket(secureWsUrl);
            setWebSocket(ws);

            ws.onopen = () => {
                 setConsoleLogs(prev => [...prev.filter(log => !log.includes('Connecting') && !log.includes('Retrying')), 'Connected to execution server.']);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    let logMessage = '';
                    switch(message.type) {
                        case 'stdout':
                            logMessage = message.content;
                            break;
                        case 'stderr':
                            logMessage = `[stderr] ${message.content}`;
                            break;
                        case 'error':
                            logMessage = `[error] ${message.content}`;
                            break;
                        default:
                            logMessage = `[server] ${event.data}`;
                    }
                    setConsoleLogs(prev => [...prev, logMessage]);
                } catch(e) {
                    setConsoleLogs(prev => [...prev, event.data]);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setConsoleLogs(prev => [...prev, 'WebSocket connection error.']);
            };

            ws.onclose = () => {
                setConsoleLogs(prev => [...prev, 'Disconnected from execution server.']);
                setWebSocket(null);
            };

        } catch (error) {
            console.error('Session setup failed:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setConsoleLogs(prev => [...prev, `Error: Could not connect to execution server. ${errorMessage}`]);
        }
    };

    createSessionAndConnect();

    return () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
    };
  }, []);

  const flattenFiles = (nodes: FileSystemNode[], path: string = ''): { path: string, content: string }[] => {
    let files: { path: string, content: string }[] = [];
    for (const node of nodes) {
        const newPath = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file') {
            files.push({ path: newPath, content: fileContents[node.id] ?? node.content });
        } else {
            files = files.concat(flattenFiles(node.children, newPath));
        }
    }
    return files;
  };

  const handleRunCode = useCallback(async () => {
    if (!sessionId || !webSocket || webSocket.readyState !== WebSocket.OPEN) {
        setConsoleLogs(prev => [...prev, 'Error: Not connected to execution server. Please wait or refresh.']);
        return;
    }

    setIsExecuting(true);
    setConsoleLogs(['Uploading files...']);

    try {
        const filesToUpload = flattenFiles(fileSystem);
        const uploadPromises = filesToUpload.map(file =>
            fetch(`${SWALANG_API_URL}/api/session/${sessionId}/files`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: file.path, content: file.content }),
            }).then(res => {
                if (!res.ok) return res.text().then(text => { throw new Error(`Failed to upload ${file.path}: ${text}`) });
                return res;
            })
        );
        
        await Promise.all(uploadPromises);

        setConsoleLogs(prev => [...prev, 'Files uploaded successfully.', 'Executing code...']);
        webSocket.send(JSON.stringify({ action: 'run' }));
    } catch (error) {
        console.error('Failed to run code:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setConsoleLogs(prev => [...prev, `Error: ${errorMessage}`]);
    } finally {
        setIsExecuting(false);
    }
  }, [sessionId, webSocket, fileSystem, fileContents]);

  const handleClearConsole = useCallback(() => {
    const welcomeLog = consoleLogs.find(log => log.startsWith('Welcome'));
    const connectionLog = consoleLogs.find(log => log.includes('Connected to execution server'));
    const initialLogs = [welcomeLog, connectionLog].filter(Boolean) as string[];
    setConsoleLogs(initialLogs);
  }, [consoleLogs]);

  const handleFileSelect = useCallback((file: File) => {
    setOpenFileIds(prev => new Set(prev).add(file.id));
    setActiveFileId(file.id);
    setSelectedNodeId(file.id);
    setActiveMobileView('editor');
  }, []);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);
  
  const handleTabClick = useCallback((fileId: string) => {
    setActiveFileId(fileId);
  }, []);

  const handleTabClose = useCallback((fileId: string) => {
    setOpenFileIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    setDirtyFileIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
    });

    if (activeFileId === fileId) {
        const openIdsArray = Array.from(openFileIds);
        const remainingIds = openIdsArray.filter(id => id !== fileId);
        const newActiveFileId = remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null;
        setActiveFileId(newActiveFileId);
        if (!newActiveFileId) {
            setPreviewVisible(false); // Close preview if no files are open
            if (activeMobileView === 'preview') {
              setActiveMobileView('editor');
            }
        }
    }
  }, [activeFileId, openFileIds, activeMobileView]);

  const handleContentChange = useCallback((content: string) => {
    if (activeFileId) {
      setFileContents(prev => ({ ...prev, [activeFileId]: content }));
      setDirtyFileIds(prev => new Set(prev).add(activeFileId));
    }
  }, [activeFileId]);

  const handleSaveFile = useCallback(() => {
    if (!activeFileId || !dirtyFileIds.has(activeFileId)) return;

    const updatedContent = fileContents[activeFileId];

    const updateFileContentInTree = (nodes: FileSystemNode[]): FileSystemNode[] => {
        return nodes.map(node => {
            if (node.type === 'file' && node.id === activeFileId) {
                return { ...node, content: updatedContent };
            }
            if (node.type === 'folder') {
                return { ...node, children: updateFileContentInTree(node.children) };
            }
            return node;
        });
    };

    setFileSystem(prev => updateFileContentInTree(prev));
    setDirtyFileIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(activeFileId);
        return newSet;
    });

    if (activeFile) {
        setConsoleLogs(prev => [...prev, `File '${activeFile.name}' saved.`]);
    }
  }, [activeFileId, dirtyFileIds, fileContents, activeFile]);

  const handleCommand = useCallback((command: string) => {
    setConsoleLogs(prev => [...prev, `> ${command}`, `command '${command}' executed (mock)`]);
  }, []);

  const handleStartRename = useCallback((nodeId: string) => {
    setRenamingId(nodeId);
    setSelectedNodeId(nodeId);
  }, []);
  
  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
  }, []);

  const handleRenameNode = useCallback((nodeId: string, newName: string) => {
    const updateNodeName = (nodes: FileSystemNode[]): FileSystemNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          if (newName.trim() === '') return node;
          return { ...node, name: newName.trim() };
        }
        if (node.type === 'folder') {
          return { ...node, children: updateNodeName(node.children) };
        }
        return node;
      });
    };

    setFileSystem(prevFileSystem => updateNodeName(prevFileSystem));
    setRenamingId(null);
  }, []);

  const handleCreateNode = useCallback((type: 'file' | 'folder') => {
    let parentId: string | null = null;

    if (selectedNodeId) {
      const selectedNode = findNodeById(fileSystem, selectedNodeId);
      if (selectedNode?.type === 'folder') {
        parentId = selectedNode.id;
      } else if (selectedNode?.type === 'file') {
        parentId = findParentId(fileSystem, selectedNode.id);
      }
    }

    const newId = new Date().getTime().toString();
    const newNode: FileSystemNode = type === 'file' 
      ? { id: newId, name: 'untitled.txt', type: 'file', content: '' }
      : { id: newId, name: 'New Folder', type: 'folder', children: [] };

    const addNodeToTree = (nodes: FileSystemNode[], parentId: string | null, newNode: FileSystemNode): FileSystemNode[] => {
        if (parentId === null) {
          return [...nodes, newNode];
        }
        return nodes.map(node => {
          if (node.id === parentId && node.type === 'folder') {
            return { ...node, children: [...node.children, newNode] };
          }
          if (node.type === 'folder') {
            return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
          }
          return node;
        });
    };

    setFileSystem(prev => addNodeToTree(prev, parentId, newNode));
    if (newNode.type === 'file') {
        setFileContents(prev => ({ ...prev, [newId]: newNode.content }));
    }
    
    setSelectedNodeId(newId);
    setRenamingId(newId);
  }, [fileSystem, selectedNodeId]);

  const handleDeleteNode = useCallback((nodeIdToDelete: string) => {
    const nodeToDelete = findNodeById(fileSystem, nodeIdToDelete);
    if (!nodeToDelete) return;

    const confirmationMessage = nodeToDelete.type === 'folder'
      ? `Are you sure you want to delete the folder "${nodeToDelete.name}" and all its contents?`
      : `Are you sure you want to delete the file "${nodeToDelete.name}"?`;
      
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    const idsToDelete = new Set<string>();
    const collectIds = (node: FileSystemNode) => {
        idsToDelete.add(node.id);
        if (node.type === 'folder') {
            node.children.forEach(collectIds);
        }
    };
    collectIds(nodeToDelete);

    const newOpenFileIds = new Set(openFileIds);
    const newDirtyFileIds = new Set(dirtyFileIds);
    const newFileContents = { ...fileContents };
    
    idsToDelete.forEach(id => {
        newOpenFileIds.delete(id);
        newDirtyFileIds.delete(id);
        delete newFileContents[id];
    });

    setOpenFileIds(newOpenFileIds);
    setDirtyFileIds(newDirtyFileIds);
    setFileContents(newFileContents);

    if (activeFileId && idsToDelete.has(activeFileId)) {
        const remainingIds = Array.from(newOpenFileIds);
        setActiveFileId(remainingIds.length > 0 ? remainingIds[remainingIds.length - 1] : null);
    }
    
    const removeNodeFromTree = (nodes: FileSystemNode[], id: string): FileSystemNode[] => {
      return nodes
        .filter(node => node.id !== id)
        .map(node => {
          if (node.type === 'folder') {
            return { ...node, children: removeNodeFromTree(node.children, id) };
          }
          return node;
        });
    };

    setFileSystem(prev => removeNodeFromTree(prev, nodeIdToDelete));
    
    if (selectedNodeId === nodeIdToDelete) {
      setSelectedNodeId(null);
    }
    setConsoleLogs(prev => [...prev, `Deleted "${nodeToDelete.name}".`]);

  }, [fileSystem, openFileIds, dirtyFileIds, fileContents, activeFileId, selectedNodeId]);

  const handleCopyNode = useCallback((nodeIdToCopy: string) => {
    const nodeToCopy = findNodeById(fileSystem, nodeIdToCopy);
    if (!nodeToCopy) return;

    const parentId = findParentId(fileSystem, nodeIdToCopy);

    const getCopyName = (name: string, isFolder: boolean): string => {
        if (isFolder) {
            return `${name} (copy)`;
        }
        const parts = name.split('.');
        if (parts.length > 1) {
            const extension = parts.pop();
            const baseName = parts.join('.');
            return `${baseName} (copy).${extension}`;
        }
        return `${name} (copy)`;
    };
    
    const newFileContents: Record<string, string> = {};

    const deepCopyAndGenerateIds = (node: FileSystemNode): FileSystemNode => {
        const newId = `${Date.now()}-${Math.random()}`;
        if (node.type === 'file') {
            const newFile: File = { 
                ...node, 
                id: newId, 
                name: getCopyName(node.name, false)
            };
            newFileContents[newId] = node.content;
            return newFile;
        } else {
            const newFolder: Folder = {
                ...node,
                id: newId,
                name: getCopyName(node.name, true),
                children: node.children.map(deepCopyAndGenerateIds)
            };
            return newFolder;
        }
    };
    
    const newNode = deepCopyAndGenerateIds(nodeToCopy);
    setFileContents(prev => ({...prev, ...newFileContents}));

    const addNodeToTree = (nodes: FileSystemNode[], parentId: string | null, originalId: string, newNode: FileSystemNode): FileSystemNode[] => {
        if (parentId === null) {
            const index = nodes.findIndex(n => n.id === originalId);
            if (index === -1) return [...nodes, newNode];
            const newNodes = [...nodes];
            newNodes.splice(index + 1, 0, newNode);
            return newNodes;
        }
        return nodes.map(node => {
            if (node.id === parentId && node.type === 'folder') {
                const index = node.children.findIndex(n => n.id === originalId);
                const newChildren = [...node.children];
                if (index > -1) {
                    newChildren.splice(index + 1, 0, newNode);
                } else {
                    newChildren.push(newNode);
                }
                return { ...node, children: newChildren };
            }
            if (node.type === 'folder') {
                return { ...node, children: addNodeToTree(node.children, parentId, originalId, newNode) };
            }
            return node;
        });
    };

    setFileSystem(prev => addNodeToTree(prev, parentId, nodeIdToCopy, newNode));
    setConsoleLogs(prev => [...prev, `Copied "${nodeToCopy.name}" to "${newNode.name}".`]);
}, [fileSystem]);

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
            <div className={`transition-all duration-300 ${isSidebarVisible ? 'w-64' : 'w-0'} flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800`}>
                <div className="flex-1 overflow-y-auto">
                    <TreeView 
                        data={fileSystem} 
                        onFileSelect={handleFileSelect} 
                        activeFileId={activeFileId} 
                        renamingId={renamingId}
                        onStartRename={handleStartRename}
                        onCancelRename={handleCancelRename}
                        onRenameNode={handleRenameNode}
                        onNewFile={() => handleCreateNode('file')}
                        onNewFolder={() => handleCreateNode('folder')}
                        onNodeSelect={handleNodeSelect}
                        selectedNodeId={selectedNodeId}
                        onDeleteNode={handleDeleteNode}
                        onCopyNode={handleCopyNode}
                    />
                </div>
            </div>
            <main className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center bg-gray-200 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                    <button onClick={() => setSidebarVisible(!isSidebarVisible)} className="p-2 hover:bg-gray-300 dark:hover:bg-gray-700 focus:outline-none">
                        {isSidebarVisible ? <XIcon /> : <MenuIcon />}
                    </button>
                    <EditorTabs
                        files={openFiles}
                        activeFileId={activeFileId}
                        onTabClick={handleTabClick}
                        onTabClose={handleTabClose}
                        dirtyFileIds={dirtyFileIds}
                    />
                    <div className="ml-auto pr-2 flex items-center">
                      <button
                        onClick={handleSaveFile}
                        disabled={!activeFileId || !dirtyFileIds.has(activeFileId)}
                        className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Save File"
                        title="Save File"
                      >
                        <SaveIcon />
                      </button>
                       <button
                        onClick={() => setPreviewVisible(!isPreviewVisible)}
                        disabled={!activeFileId}
                        className={`p-2 rounded ${isPreviewVisible ? 'bg-blue-200 dark:bg-blue-800' : ''} hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Toggle Preview"
                        title="Toggle Preview"
                      >
                        <PreviewIcon />
                      </button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <div className="flex-grow flex">
                         <div className={`h-full ${isPreviewVisible && activeFileId ? 'w-1/2' : 'w-full'}`}>
                             <Editor
                                fileName={activeFile?.name || ''}
                                content={activeFileId ? fileContents[activeFileId] : null}
                                onContentChange={handleContentChange}
                            />
                         </div>
                         {isPreviewVisible && activeFileId && (
                            <div className="w-1/2 h-full border-l border-gray-300 dark:border-gray-700">
                                <PreviewPane
                                    fileName={activeFile?.name || ''}
                                    content={fileContents[activeFileId]}
                                />
                            </div>
                         )}
                    </div>
                    <div className="h-1/3 max-h-96 border-t border-gray-300 dark:border-gray-700">
                        <Console 
                            logs={consoleLogs} 
                            onCommand={handleCommand}
                            onRun={handleRunCode}
                            onClear={handleClearConsole}
                            isExecuting={isExecuting}
                        />
                    </div>
                </div>
            </main>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
                {activeMobileView === 'explorer' && 
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            <TreeView 
                                data={fileSystem} 
                                onFileSelect={handleFileSelect} 
                                activeFileId={activeFileId}
                                renamingId={renamingId}
                                onStartRename={handleStartRename}
                                onCancelRename={handleCancelRename}
                                onRenameNode={handleRenameNode}
                                onNewFile={() => handleCreateNode('file')}
                                onNewFolder={() => handleCreateNode('folder')}
                                onNodeSelect={handleNodeSelect}
                                selectedNodeId={selectedNodeId}
                                onDeleteNode={(id) => id && handleDeleteNode(id)}
                                onCopyNode={handleCopyNode}
                            />
                        </div>
                    </div>
                }
                {activeMobileView === 'editor' && (
                    <Editor
                        fileName={activeFile?.name || ''}
                        content={activeFileId ? fileContents[activeFileId] : null}
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
                        onCommand={handleCommand}
                        onRun={handleRunCode}
                        onClear={handleClearConsole}
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

export default App;