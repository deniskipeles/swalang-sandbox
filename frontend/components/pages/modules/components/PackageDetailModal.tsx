import React, { useEffect, useMemo, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { type Package, type VersionHistoryItem } from '../types';
import CloseIcon from './icons/CloseIcon';
import PackageIcon from './icons/PackageIcon';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import { cardBaseStyles, insetContainerStyles } from '../styles/common';

interface PackageDetailModalProps {
    pkg: Package;
    onClose: () => void;
    relatedPackages: Package[];
    onRelatedPackageClick: (pkg: Package) => void;
    versionHistory: VersionHistoryItem[];
}

const ReadmeRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Helper for inline elements like links
    const parseInline = useCallback((text: string): React.ReactNode => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(text)) !== null) {
            // Text before the link
            if (match.index > lastIndex) {
                parts.push(<span key={`${lastIndex}-text`}>{text.substring(lastIndex, match.index)}</span>);
            }
            // The link
            const [fullMatch, linkText, url] = match;
            parts.push(
                <a href={url} key={`${lastIndex}-link`} target="_blank" rel="noopener noreferrer" className="text-swalang-accent hover:underline transition-all duration-200 ease-in-out">
                    {linkText}
                </a>
            );
            lastIndex = match.index + fullMatch.length;
        }

        // Text after the last link
        if (lastIndex < text.length) {
            parts.push(<span key={`${lastIndex}-end`}>{text.substring(lastIndex)}</span>);
        }
        
        return parts.length > 0 ? <>{parts}</> : text;
    }, []);

    const renderedContent = useMemo(() => {
        const elements: React.ReactNode[] = [];
        if (!content) return elements;

        const lines = content.split('\n');
        
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            // Headings (Supports # and ##)
            if (line.startsWith('## ')) {
                elements.push(<h2 key={i} className="text-xl font-bold text-swalang-light-text dark:text-white mt-4 mb-2 border-b border-swalang-light-border dark:border-swalang-purple pb-1">{parseInline(line.substring(3))}</h2>);
                i++;
                continue;
            }
            if (line.startsWith('# ')) {
                elements.push(<h1 key={i} className="text-2xl font-bold text-swalang-light-text dark:text-white mt-6 mb-3 border-b-2 border-swalang-light-border dark:border-swalang-purple pb-2">{parseInline(line.substring(2))}</h1>);
                i++;
                continue;
            }

            // Code blocks (```swalang)
            if (line.startsWith('```swalang')) {
                const codeLines = [];
                i++;
                while (i < lines.length && !lines[i].startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                elements.push(
                    <pre key={`code-${i}`} className="bg-swalang-light-bg dark:bg-swalang-dark p-4 rounded-md overflow-x-auto text-sm my-4 border border-swalang-light-border dark:border-swalang-purple">
                        <code className="text-swalang-light-text dark:text-swalang-light font-mono whitespace-pre">{codeLines.join('\n')}</code>
                    </pre>
                );
                i++; // Skip the closing ```
                continue;
            }
            
            // Unordered Lists (*, -)
            if (line.startsWith('* ') || line.startsWith('- ')) {
                const listItems = [];
                while (i < lines.length && (lines[i].startsWith('* ') || lines[i].startsWith('- '))) {
                    listItems.push(<li key={`li-${i}`} className="mb-2">{parseInline(lines[i].substring(2))}</li>);
                    i++;
                }
                elements.push(<ul key={`ul-${i}`} className="list-disc list-outside text-swalang-light-subtle dark:text-swalang-light pl-5 my-3">{listItems}</ul>);
                continue;
            }

            // Ordered Lists (1., 2.)
            if (/^\d+\.\s/.test(line)) {
                const listItems = [];
                while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                     listItems.push(<li key={`li-${i}`} className="mb-2">{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
                    i++;
                }
                 elements.push(<ol key={`ol-${i}`} className="list-decimal list-outside text-swalang-light-subtle dark:text-swalang-light pl-5 my-3">{listItems}</ol>);
                continue;
            }

            // Paragraphs - group consecutive lines
            const paraLines: string[] = [];
            while (
                i < lines.length &&
                lines[i].trim() !== '' &&
                !lines[i].startsWith('#') &&
                !lines[i].startsWith('```') &&
                !lines[i].startsWith('* ') &&
                !lines[i].startsWith('- ') &&
                !/^\d+\.\s/.test(lines[i])
            ) {
                paraLines.push(lines[i]);
                i++;
            }

            if (paraLines.length > 0) {
                elements.push(
                    <p key={`p-${i}`} className="text-swalang-light-subtle dark:text-swalang-light my-2 whitespace-pre-wrap">
                        {parseInline(paraLines.join('\n'))}
                    </p>
                );
            }

            // Skip empty lines between blocks
            if (i < lines.length && lines[i].trim() === '') {
                i++;
            }
        }
        
        return elements;
    }, [content, parseInline]);

    return <div>{renderedContent}</div>;
};


const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ pkg, onClose, relatedPackages, onRelatedPackageClick, versionHistory }) => {
    const modalRoot = document.getElementById('modal-root');
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyCommand = useCallback(() => {
        const command = `swalang install ${pkg.name}`;
        navigator.clipboard.writeText(command).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500); // Reset after 2.5 seconds
        }).catch(err => {
            console.error('Failed to copy command: ', err);
        });
    }, [pkg.name]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    // Reset copied state when package changes
    useEffect(() => {
        setIsCopied(false);
    }, [pkg]);


    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="package-title"
        >
            <div 
                className={`${cardBaseStyles} w-full max-w-3xl max-h-[90vh] flex flex-col transition-all duration-300`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-6 border-b border-swalang-light-border dark:border-swalang-purple flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 id="package-title" className="text-2xl font-bold text-swalang-light-text dark:text-white flex items-center gap-3">
                            <PackageIcon className="h-6 w-6 text-swalang-accent" />
                            {pkg.name}
                        </h2>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">by {pkg.author}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors" aria-label="Close package details">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </header>

                <main className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-swalang-light-text dark:text-white mb-2">Description</h3>
                            <p className="text-swalang-light-subtle dark:text-swalang-light">{pkg.description}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-swalang-light-text dark:text-white mb-2">Installation</h3>
                            <div className="relative bg-swalang-light-bg dark:bg-swalang-dark p-3 rounded-md border border-swalang-light-border dark:border-swalang-purple flex items-center justify-between">
                                <pre className="text-sm text-swalang-light-text dark:text-swalang-light font-mono overflow-x-auto">
                                    <code>
                                        <span className="select-none text-gray-500 mr-2">$</span>swalang install {pkg.name}
                                    </code>
                                </pre>
                                <button
                                    onClick={handleCopyCommand}
                                    className="p-2 rounded-md hover:bg-swalang-light-border dark:hover:bg-swalang-purple transition-colors flex-shrink-0"
                                    aria-label="Copy installation command"
                                >
                                    {isCopied ? (
                                        <CheckIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <CopyIcon className="h-5 w-5 text-swalang-light-subtle dark:text-swalang-light" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-swalang-light-text dark:text-white mb-2">Version</h3>
                            <span className="text-sm bg-gray-100 dark:bg-swalang-purple text-swalang-light-subtle dark:text-swalang-light px-2 py-1 rounded-full">{pkg.version}</span>
                        </div>
                         <div>
                            <h3 className="font-semibold text-swalang-light-text dark:text-white mb-2">Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                                {pkg.keywords.map(keyword => (
                                    <span key={keyword} className="bg-swalang-accent/10 text-swalang-accent dark:bg-swalang-dark dark:text-swalang-accent text-xs font-semibold px-3 py-1 rounded-full">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-swalang-light-text dark:text-white mb-2">README</h3>
                            <div className={insetContainerStyles}>
                                <ReadmeRenderer content={pkg.readme} />
                            </div>
                        </div>

                        {relatedPackages.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-swalang-light-text dark:text-white mb-2">Related Packages</h3>
                                <div className={insetContainerStyles}>
                                    <ul className="space-y-2">
                                        {relatedPackages.map(relatedPkg => (
                                            <li key={relatedPkg.name}>
                                                <button 
                                                    onClick={() => onRelatedPackageClick(relatedPkg)}
                                                    className="flex items-center gap-2 text-swalang-light-subtle dark:text-swalang-light hover:text-swalang-accent transition-colors w-full text-left p-1 rounded"
                                                >
                                                    <PackageIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span className="font-medium">{relatedPkg.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {versionHistory.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-swalang-light-text dark:text-white mb-2">Version History</h3>
                                <div className={insetContainerStyles}>
                                    <ul className="space-y-2">
                                        {versionHistory.map(item => (
                                            <li 
                                                key={item.version} 
                                                className={`flex justify-between items-center text-sm p-2 rounded-md transition-colors ${item.version === pkg.version ? 'bg-swalang-accent/10 dark:bg-swalang-purple/50' : ''}`}
                                            >
                                                <div className="flex items-center">
                                                    <span className="font-mono bg-gray-200 dark:bg-swalang-dark text-swalang-light-text dark:text-swalang-light px-2 py-1 rounded">
                                                        v{item.version}
                                                    </span>
                                                    {item.version === pkg.version && (
                                                        <span className="ml-2 text-xs bg-swalang-accent text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                            latest
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-500 dark:text-gray-400">{item.date}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>,
        modalRoot
    );
};

export default PackageDetailModal;