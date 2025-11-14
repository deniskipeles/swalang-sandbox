import React from 'react';

interface PreviewPaneProps {
  fileName: string;
  content: string | null;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ fileName, content }) => {
  if (content === null) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500">
        No content to preview.
      </div>
    );
  }

  const isHtml = fileName.toLowerCase().endsWith('.html');

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate" title={fileName}>
          Preview: {fileName}
        </h3>
      </div>
      <div className="flex-1 overflow-auto">
        {isHtml ? (
          <iframe
            srcDoc={content}
            title={`Preview of ${fileName}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
          />
        ) : (
          <pre className="text-sm p-4 text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            <code>{content}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default PreviewPane;
