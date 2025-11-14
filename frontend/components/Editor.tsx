'use client';

import React, { useEffect, useRef } from 'react';
// FIX: Import lineNumbers and highlightActiveLineGutter from @codemirror/view
import { EditorView, keymap, highlightActiveLine, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
// REMOVE: This import is no longer needed
// import { lineNumbers, highlightActiveLineGutter } from '@codemirror/gutter';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';

interface EditorProps {
  fileName: string;
  content: string | null;
  onContentChange: (content: string) => void;
}

const getLanguageExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'json':
      return javascript({ jsx: true, typescript: true });
    case 'html':
      return html();
    case 'css':
      return css();
    case 'md':
      return markdown();
    default:
      return null;
  }
};

const basicExtensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  highlightActiveLine(),
  syntaxHighlighting(defaultHighlightStyle),
  EditorView.lineWrapping
];

const Editor: React.FC<EditorProps> = ({ fileName, content, onContentChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (content === null || !editorRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const language = getLanguageExtension(fileName);

    const extensions = [
      ...basicExtensions,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          if (newValue !== content) {
            onContentChange(newValue);
          }
        }
      }),
    ];

    if (language) {
      extensions.push(language);
    }

    const state = EditorState.create({
      doc: content,
      extensions: extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [fileName, content, onContentChange]);

  if (content === null) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome to the Editor</h1>
          <p>Select a file from the explorer to begin editing.</p>
        </div>
      </div>
    );
  }

  return <div ref={editorRef} className="h-full w-full" />;
};

export default Editor;