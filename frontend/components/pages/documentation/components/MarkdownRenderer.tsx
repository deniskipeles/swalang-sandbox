import React, { useMemo, useCallback } from 'react';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
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
                elements.push(<h2 key={i} className="text-2xl font-bold text-swalang-light-text dark:text-white mt-6 mb-3 border-b border-swalang-light-border dark:border-swalang-purple pb-2">{parseInline(line.substring(3))}</h2>);
                i++;
                continue;
            }
            if (line.startsWith('# ')) {
                elements.push(<h1 key={i} className="text-3xl font-bold text-swalang-light-text dark:text-white mt-8 mb-4 border-b-2 border-swalang-light-border dark:border-swalang-purple pb-3">{parseInline(line.substring(2))}</h1>);
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
                elements.push(<ul key={`ul-${i}`} className="list-disc list-outside text-swalang-light-subtle dark:text-swalang-light pl-5 my-4">{listItems}</ul>);
                continue;
            }

            // Ordered Lists (1., 2.)
            if (/^\d+\.\s/.test(line)) {
                const listItems = [];
                while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                     listItems.push(<li key={`li-${i}`} className="mb-2">{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
                    i++;
                }
                 elements.push(<ol key={`ol-${i}`} className="list-decimal list-outside text-swalang-light-subtle dark:text-swalang-light pl-5 my-4">{listItems}</ol>);
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
                    <p key={`p-${i}`} className="text-swalang-light-subtle dark:text-swalang-light my-4 whitespace-pre-wrap leading-relaxed">
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

export default MarkdownRenderer;
