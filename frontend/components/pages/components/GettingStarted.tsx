import React from 'react';
import Link from 'next/link';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-swa-code-bg text-white p-4 rounded-md my-4 overflow-x-auto"><code className="font-mono">{children}</code></pre>
);

const Section: React.FC<{ title: string, children: React.ReactNode, step: number }> = ({ title, children, step }) => (
    <section className="mb-16">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            <span className="text-swa-green">{step}.</span> {title}
        </h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
            {children}
        </div>
    </section>
);

const GettingStarted: React.FC = () => {
    return (
        <div className="bg-gray-50 dark:bg-swa-dark">
            <div className="container mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">Getting Started with Swalang</h1>
                    <p className="text-xl text-gray-600 dark:text-swa-light-gray max-w-3xl mx-auto">
                        Welcome! This guide will walk you through installing Swalang, writing your first program, and learning the fundamentals of the language.
                    </p>
                </header>

                <main className="max-w-4xl mx-auto">
                    <Section step={1} title="Installation">
                        <p>
                            Getting Swalang on your machine is straightforward. We provide installers for all major operating systems.
                            Choose your OS below and follow the instructions.
                        </p>
                        <h3 className="text-2xl font-bold mt-8 mb-3">macOS (via Homebrew)</h3>
                        <p>If you're on macOS and have <a href="https://brew.sh/" target="_blank" rel="noopener noreferrer" className="text-swa-green hover:underline">Homebrew</a>, you can install Swalang with a single command:</p>
                        <CodeBlock>{`brew install swalang`}</CodeBlock>

                        <h3 className="text-2xl font-bold mt-8 mb-3">Linux (via script)</h3>
                        <p>You can use the following shell script to install the latest version:</p>
                        <CodeBlock>{`curl -fsSL https://swalang.org/install.sh | sh`}</CodeBlock>

                        <h3 className="text-2xl font-bold mt-8 mb-3">Windows (via Scoop)</h3>
                        <p>For Windows users, we recommend using the <a href="https://scoop.sh/" target="_blank" rel="noopener noreferrer" className="text-swa-green hover:underline">Scoop</a> package manager:</p>
                        <CodeBlock>{`scoop install swalang`}</CodeBlock>
                        
                        <p>
                            After installation, open a new terminal and verify it's working by checking the version:
                        </p>
                        <CodeBlock>{`$ swa --version
swalang 1.0.0`}</CodeBlock>
                    </Section>

                    <Section step={2} title="Your First Program">
                        <p>It's tradition to start with a "Hello, World!" program. Create a new file named <code>main.swa</code> and open it in your favorite text editor.</p>
                        <p>Type or paste the following code into the file:</p>
                        <CodeBlock>{`import { stdio } from 'std:io';

stdio.print('Hello, Swa World!');
`}</CodeBlock>
                        <p>This code imports the standard I/O library and uses the <code>print</code> function to display a message in your console.</p>
                        <p>Now, run the program from your terminal in the same directory where you saved <code>main.swa</code>:</p>
                        <CodeBlock>{`$ swa run main.swa
Hello, Swa World!`}</CodeBlock>
                        <p>
                            Fantastic! You've successfully written and executed your first Swalang program.
                        </p>
                    </Section>

                    <Section step={3} title="Learning the Basics">
                        <p>Swalang's syntax is designed to be clean and intuitive. Here are a few core concepts to get you going.</p>
                        
                        <h4 className="text-xl font-bold mt-6 mb-2">Variables</h4>
                        <p>Declare immutable variables with <code>let</code> and mutable ones with <code>var</code>.</p>
                        <CodeBlock>{`let name = "Swalang"; // immutable
var version = 1.0;   // mutable
version = 1.0.1;`}</CodeBlock>
                        
                        <h4 className="text-xl font-bold mt-6 mb-2">Functions</h4>
                        <p>Define functions using the <code>fn</code> keyword.</p>
                        <CodeBlock>{`fn greet(name: String) -> String {
    return "Hello, {name}!";
}

stdio.print(greet("Developer"));`}</CodeBlock>

                        <h4 className="text-xl font-bold mt-6 mb-2">Control Flow</h4>
                        <p>Use <code>if/else</code> for conditional logic.</p>
                        <CodeBlock>{`let number = 7;

if number % 2 == 0 {
    stdio.print("Even");
} else {
    stdio.print("Odd");
}`}</CodeBlock>
                        <p>This is just a small taste. To explore the language in more detail, head over to our comprehensive <Link href="/docs" className="text-swa-green hover:underline">Language Tour</Link> in the documentation.</p>
                    </Section>

                    <Section step={4} title="What's Next?">
                        <p>You're off to a great start! Here are some resources to continue your journey with Swalang:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Dive into the <Link href="/docs" className="text-swa-green hover:underline">Official Documentation</Link></strong> for in-depth guides and API references.</li>
                            <li><strong>Explore <Link href="/#swahub" className="text-swa-green hover:underline">SwaHub</Link></strong> to discover packages that can accelerate your development.</li>
                            <li><strong>Join the <Link href="/#community" className="text-swa-green hover:underline">Community</Link></strong> to ask questions and connect with other Swalang developers.</li>
                            <li><strong>Contribute to Swalang</strong> on <a href="#" className="text-swa-green hover:underline">GitHub</a> and help shape the future of the language.</li>
                        </ul>
                    </Section>
                </main>
            </div>
        </div>
    );
};

export default GettingStarted;