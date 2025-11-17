"use client";

import React, { useState, useEffect } from 'react';
import PlayIcon from './icons/PlayIcon';

const tutorials = [
    {
        title: 'Hello, World!',
        description: 'The classic first program. This will print a message to the console.',
        initialCode: `import { stdio } from 'std:io';

stdio.print('Hello, Swa World!');`,
        expectedOutput: 'Hello, Swa World!'
    },
    {
        title: 'Variables',
        description: 'Use `let` for immutable variables and `var` for mutable ones. Swalang has type inference, so you often don\'t need to specify the type.',
        initialCode: `import { stdio } from 'std:io';

let immutable = "You can't change me.";
var mutable = 1;
mutable = mutable + 1;

stdio.print(immutable);
stdio.print("The new value is: {mutable}");`,
        expectedOutput: `You can't change me.
The new value is: 2`
    },
    {
        title: 'Functions',
        description: 'Define functions with the `fn` keyword. You can specify parameter and return types.',
        initialCode: `import { stdio } from 'std:io';

fn add(a: Int, b: Int) -> Int {
    return a + b;
}

let result = add(5, 7);
stdio.print("5 + 7 = {result}");`,
        expectedOutput: '5 + 7 = 12'
    },
    {
        title: 'Control Flow',
        description: 'Use `if/else` for conditional logic. Conditions don\'t need parentheses.',
        initialCode: `import { stdio } from 'std:io';

let number = 10;

if number > 5 {
    stdio.print("{number} is greater than 5.");
} else {
    stdio.print("{number} is not greater than 5.");
}`,
        expectedOutput: '10 is greater than 5.'
    },
    {
        title: 'Loops',
        description: 'The `for..in` loop is a common way to iterate. Here we use a range `1..5`.',
        initialCode: `import { stdio } from 'std:io';

for i in 1..5 {
    stdio.print("Loop iteration: {i}");
}`,
        expectedOutput: `Loop iteration: 1
Loop iteration: 2
Loop iteration: 3
Loop iteration: 4
Loop iteration: 5`
    },
];

const InteractiveTutorial: React.FC = () => {
    const [activeTutorialIndex, setActiveTutorialIndex] = useState(0);
    const [currentCode, setCurrentCode] = useState(tutorials[0].initialCode);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [codeHistory, setCodeHistory] = useState(() => tutorials.map(t => t.initialCode));

    const handleTutorialSelect = (index: number) => {
        const newCodeHistory = [...codeHistory];
        newCodeHistory[activeTutorialIndex] = currentCode;
        setCodeHistory(newCodeHistory);

        setActiveTutorialIndex(index);
        setCurrentCode(codeHistory[index]);
        setOutput('');
    };

    const handleRunCode = () => {
        setIsRunning(true);
        setOutput('Running...');
        setTimeout(() => {
            setOutput(tutorials[activeTutorialIndex].expectedOutput);
            setIsRunning(false);
        }, 500);
    };
    
    // Automatically adjust textarea height
    useEffect(() => {
        const textarea = document.getElementById('code-editor') as HTMLTextAreaElement;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
        }
    }, [currentCode]);

    const activeTutorial = tutorials[activeTutorialIndex];

    return (
        <div className="bg-gray-50 dark:bg-swa-dark">
            <div className="container mx-auto px-4 py-16">
                 <header className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Try Swalang</h1>
                    <p className="text-xl text-gray-600 dark:text-swa-light-gray max-w-3xl mx-auto">
                       An interactive tour of the Swalang language. No installation required.
                    </p>
                </header>
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-1/4">
                        <div className="p-4 bg-white dark:bg-swa-gray rounded-lg shadow-md">
                            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Lessons</h3>
                            <nav className="space-y-2">
                                {tutorials.map((tutorial, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleTutorialSelect(index)}
                                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                            index === activeTutorialIndex
                                                ? 'bg-swa-green text-swa-dark'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-black'
                                        }`}
                                    >
                                       {index + 1}. {tutorial.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="bg-white dark:bg-swa-gray p-6 rounded-lg shadow-md">
                            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{activeTutorial.title}</h2>
                            <p className="mb-6 text-gray-600 dark:text-swa-light-gray">{activeTutorial.description}</p>
                            
                            <div className="bg-swa-code-bg rounded-lg shadow-inner border border-gray-700 dark:border-swa-gray overflow-hidden">
                                <textarea
                                    id="code-editor"
                                    value={currentCode}
                                    onChange={(e) => setCurrentCode(e.target.value)}
                                    className="w-full bg-transparent text-white p-4 font-mono text-sm resize-none outline-none leading-relaxed"
                                    spellCheck="false"
                                    rows={currentCode.split('\n').length}
                                />
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    className="flex items-center justify-center bg-swa-green text-swa-dark font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <PlayIcon className="h-5 w-5 mr-2" />
                                    {isRunning ? 'Running...' : 'Run'}
                                </button>
                            </div>

                             <div className="mt-6">
                                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Output</h3>
                                <pre className="bg-black text-gray-300 p-4 rounded-md min-h-[80px] font-mono text-sm whitespace-pre-wrap">
                                    {output}
                                </pre>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default InteractiveTutorial;