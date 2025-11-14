
import React from 'react';
import type { File } from '@/lib/types';
import { XIcon } from './icons/XIcon';
import { FileIcon } from './icons/FileIcon';


interface EditorTabsProps {
  files: File[];
  activeFileId: string | null;
  onTabClick: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
  dirtyFileIds: Set<string>;
}

const EditorTabs: React.FC<EditorTabsProps> = ({ files, activeFileId, onTabClick, onTabClose, dirtyFileIds }) => {
  if (files.length === 0) {
    return null;
  }
  
  return (
    <div className="flex-shrink-0 flex items-center overflow-x-auto">
      {files.map(file => (
        <div
          key={file.id}
          onClick={() => onTabClick(file.id)}
          className={`flex items-center cursor-pointer px-4 py-2 text-sm border-r border-gray-300 dark:border-gray-700 ${
            activeFileId === file.id
              ? 'bg-white dark:bg-gray-800'
              : 'bg-gray-200 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <FileIcon className="mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">{file.name}</span>
          {dirtyFileIds.has(file.id) && (
            <span className="w-2 h-2 block ml-2 bg-blue-500 rounded-full" title="Unsaved changes"></span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file.id);
            }}
            className="ml-3 p-0.5 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600"
            aria-label={`Close ${file.name}`}
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default EditorTabs;