import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { cardBaseStyles } from '../styles/common';
import initialFileSystem from '../data/fileSystemData';
import type { FileSystemNode } from '../data/fileSystemData';

// Helper function to find the default file to display
const findDefaultFile = (nodes: FileSystemNode[]): FileSystemNode | null => {
    // Prioritize README.md
    for (const node of nodes) {
        if (node.type === 'file' && node.name.toLowerCase() === 'readme.md') {
            return node;
        }
        if (node.children) {
            const found = findDefaultFile(node.children);
            if (found) return found;
        }
    }
    // Fallback to the first file found if no README.md exists
    for (const node of nodes) {
        if (node.type === 'file') {
            return node;
        }
        if (node.children) {
            const found = findDefaultFile(node.children);
            if (found) return found;
        }
    }
    return null;
};

const DocumentationPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<FileSystemNode | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
        '1': true, // src
        '7': true, // public
    });

    useEffect(() => {
        const defaultFile = findDefaultFile(initialFileSystem);
        if (defaultFile) {
            setSelectedFile(defaultFile);
        }
    }, []);

    const handleFileSelect = (file: FileSystemNode) => {
        if (file.type === 'file') {
            setSelectedFile(file);
        }
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const renderFileTree = (nodes: FileSystemNode[], isSubmenu = false) => {
        return (
            <ul className={`space-y-1 ${isSubmenu ? 'pl-4 border-l border-swalang-light-border dark:border-swalang-purple ml-2 mt-1' : ''}`}>
                {nodes.map(node => (
                    <li key={node.id}>
                        {node.type === 'folder' ? (
                            <div>
                                <button
                                    onClick={() => toggleFolder(node.id)}
                                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100/50 dark:hover:bg-swalang-purple/50 text-swalang-light-subtle dark:text-swalang-light transition-colors duration-200"
                                    aria-expanded={!!expandedFolders[node.id]}
                                    aria-label={`Toggle ${node.name} section`}
                                >
                                    <span className="font-semibold uppercase tracking-wider text-xs">{node.name}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${expandedFolders[node.id] ? 'rotate-90' : 'rotate-0'}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                                {expandedFolders[node.id] && renderFileTree(node.children || [], true)}
                            </div>
                        ) : (
                             <button
                                onClick={() => handleFileSelect(node)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                                    selectedFile?.id === node.id
                                    ? 'bg-swalang-accent/10 text-swalang-accent font-semibold' 
                                    : 'text-swalang-light-subtle dark:text-swalang-light hover:bg-gray-100/50 dark:hover:bg-swalang-purple/50'
                                }`}
                            >
                                <span>{node.name.replace(/\.md$/, '')}</span>
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
                <div className={`${cardBaseStyles} p-4 sticky top-24`}>
                    <h2 className="text-lg font-bold text-swalang-light-text dark:text-white mb-4 px-2">Documentation</h2>
                    <nav>
                        {renderFileTree(initialFileSystem)}
                    </nav>
                </div>
            </aside>
            <div className="w-full md:w-3/4 lg:w-4/5">
                 <div className={`${cardBaseStyles} min-h-[60vh]`}>
                    {selectedFile ? (
                        <article className="p-6 md:p-8">
                            <MarkdownRenderer content={selectedFile.content || ''} />
                        </article>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[60vh] text-swalang-light-subtle dark:text-swalang-light">
                            <p>Select an article to view its content.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default DocumentationPage;