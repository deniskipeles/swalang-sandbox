import React, { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { PlayIcon } from './icons/PlayIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface ConsoleProps {
  logs: string[];
  onCommand: (command: string) => void;
  onRun: () => void;
  onClear: () => void;
  isExecuting: boolean;
}

const Console: React.FC<ConsoleProps> = ({ logs, onCommand, onRun, onClear, isExecuting }) => {
  const [input, setInput] = useState('');
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommand(input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full w-full bg-gray-900 text-gray-200 flex flex-col font-mono text-sm">
      <div className="flex items-center justify-between p-1 border-b border-gray-700 bg-gray-800 flex-shrink-0">
        <span className="font-semibold px-2">CONSOLE</span>
        <div className="flex items-center space-x-2">
            <button
                onClick={onRun}
                disabled={isExecuting}
                className="flex items-center px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-wait"
                title="Run Code"
            >
                <PlayIcon className="mr-1 h-4 w-4" />
                <span>Run</span>
            </button>
            <button
                onClick={onClear}
                className="p-1 rounded-full hover:bg-gray-700"
                title="Clear Console"
            >
                <XCircleIcon />
            </button>
        </div>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap break-all">{log}</div>
        ))}
        <div ref={endOfLogsRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-center border-t border-gray-700 p-1 flex-shrink-0">
        <ChevronRightIcon className="text-green-400"/>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent focus:outline-none px-2"
          placeholder="Type a command..."
        />
      </form>
    </div>
  );
};

export default Console;