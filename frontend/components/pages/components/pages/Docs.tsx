import React from 'react';

const DocSidebarLink: React.FC<{ href: string; children: React.ReactNode; active?: boolean }> = ({ href, children, active }) => (
  <a
    href={href}
    className={`block py-2 px-4 text-sm rounded-md transition-colors ${
      active
        ? 'bg-swa-green/20 text-swa-green font-semibold'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-swa-gray'
    }`}
  >
    {children}
  </a>
);

const DocContent: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div id={title.toLowerCase().replace(/\s+/g, '-')} className="mb-16 scroll-mt-24">
        <h2 className="text-3xl font-bold mb-4 pb-2 border-b border-gray-200 dark:border-swa-gray text-gray-900 dark:text-white">{title}</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
            {children}
        </div>
    </div>
);

const Docs: React.FC = () => {
    const sidebarNav = [
        { name: 'Introduction', href: '#introduction' },
        { name: 'Getting Started', href: '#getting-started', subItems: [
            { name: 'Installation', href: '#installation' },
            { name: 'Your First Program', href: '#your-first-program' },
        ]},
        { name: 'Language Tour', href: '#language-tour', subItems: [
            { name: 'Variables & Types', href: '#variables-types' },
            { name: 'Control Flow', href: '#control-flow' },
            { name: 'Functions', href: '#functions' },
        ]},
        { name: 'Standard Library', href: '#standard-library' },
        { name: 'Advanced Topics', href: '#advanced-topics' },
    ];

    return (
        <div className="bg-white dark:bg-swa-dark">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 lg:flex-shrink-0 lg:mr-8 mb-8 lg:mb-0">
                        <div className="lg:sticky top-24">
                            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Documentation</h3>
                            <nav className="space-y-1">
                                {sidebarNav.map(item => (
                                    <React.Fragment key={item.name}>
                                        <DocSidebarLink href={item.href}>{item.name}</DocSidebarLink>
                                        {item.subItems && (
                                            <div className="pl-4 border-l-2 border-gray-200 dark:border-swa-gray ml-2 mt-1 space-y-1">
                                                {item.subItems.map(subItem => (
                                                     <DocSidebarLink key={subItem.name} href={subItem.href}>{subItem.name}</DocSidebarLink>
                                                ))}
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <DocContent title="Introduction">
                            <p>Welcome to the official documentation for the Swalang programming language. Swalang is designed to be elegant, fast, and productive. Whether you're a seasoned developer or just starting your coding journey, we hope you'll find Swalang both powerful and enjoyable to use.</p>
                            <p>This documentation will guide you through installing Swalang, learning the language, and exploring its rich standard library and ecosystem.</p>
                        </DocContent>

                        <DocContent title="Getting Started">
                            <h3 id="installation" className="text-2xl font-bold mb-3 mt-8 scroll-mt-24">Installation</h3>
                            <p>You can download the latest version of Swalang from the official downloads page. We provide pre-compiled binaries for Windows, macOS, and Linux.</p>
                            <pre className="bg-swa-code-bg text-white p-4 rounded-md my-4 overflow-x-auto"><code className="font-mono">{`# Example for macOS using Homebrew
brew install swalang`}</code></pre>
                            <p>Once installed, you can verify the installation by running:</p>
                            <pre className="bg-swa-code-bg text-white p-4 rounded-md my-4 overflow-x-auto"><code className="font-mono">swa --version</code></pre>
                            
                            <h3 id="your-first-program" className="text-2xl font-bold mb-3 mt-8 scroll-mt-24">Your First Program</h3>
                            <p>Let's write a classic "Hello, World!" program. Create a file named <code>hello.swa</code> and add the following code:</p>
                            <pre className="bg-swa-code-bg text-white p-4 rounded-md my-4 overflow-x-auto"><code className="font-mono">{`import { stdio } from 'std:io';

stdio.print('Hello, Swa World!');`}
</code></pre>
                            <p>Run it from your terminal:</p>
                             <pre className="bg-swa-code-bg text-white p-4 rounded-md my-4 overflow-x-auto"><code className="font-mono">{`$ swa run hello.swa
Hello, Swa World!`}</code></pre>
                            <p>Congratulations! You've just run your first Swalang program.</p>
                        </DocContent>
                        
                        <DocContent title="Language Tour">
                            <p>This tour provides a high-level overview of Swalang's key features. Dive into the sections below to learn more about variables, control flow, functions, and more.</p>
                            <h3 id="variables-types" className="text-2xl font-bold mb-3 mt-8 scroll-mt-24">Variables & Types</h3>
                            <p>Swalang is a statically typed language with type inference. You can declare variables using <code>let</code> for immutable bindings and <code>var</code> for mutable ones.</p>
                            
                            <h3 id="control-flow" className="text-2xl font-bold mb-3 mt-8 scroll-mt-24">Control Flow</h3>
                            <p>Swalang supports standard control flow statements like <code>if/else</code>, <code>for</code> loops, and <code>while</code> loops, with a clean and intuitive syntax.</p>

                             <h3 id="functions" className="text-2xl font-bold mb-3 mt-8 scroll-mt-24">Functions</h3>
                            <p>Functions are first-class citizens in Swalang. They can be passed as arguments, returned from other functions, and assigned to variables.</p>
                        </DocContent>
                         <DocContent title="Standard Library">
                            <p>Swalang comes with a comprehensive standard library that provides modules for I/O, networking, data structures, and much more, enabling you to build powerful applications without relying on third-party packages for common tasks.</p>
                        </DocContent>
                        <DocContent title="Advanced Topics">
                            <p>Ready to go deeper? Explore advanced topics like concurrency, metaprogramming, and interfacing with C libraries to unlock the full potential of Swalang.</p>
                        </DocContent>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Docs;
