import React from 'react';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  return (
    <pre className="bg-slate-200 dark:bg-slate-900/70 text-slate-800 dark:text-cyan-300 text-sm p-3 rounded-md overflow-x-auto font-mono ring-1 ring-slate-300 dark:ring-slate-600">
      <code>{code}</code>
    </pre>
  );
};

export default CodeBlock;