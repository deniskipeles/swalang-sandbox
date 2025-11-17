import React from 'react';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <section className="bg-gray-50 dark:bg-swa-dark text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-16 md:py-24 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">Swalang</h1>
        <p className="text-xl md:text-2xl text-swa-green mb-10 max-w-2xl font-semibold">
          The elegant language for modern development. Simple, powerful, and fun.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
          <Link href="/downloads" className="bg-swa-green text-swa-dark font-bold py-3 px-8 rounded-md text-lg hover:bg-opacity-80 transition-colors shadow-lg shadow-swa-green/20">
            Download Swalang 1.0.0
          </Link>
          <Link href="/try" className="border-2 border-gray-400 dark:border-swa-light-gray text-gray-500 dark:text-swa-light-gray font-bold py-3 px-8 rounded-md text-lg hover:bg-gray-400 dark:hover:bg-swa-light-gray hover:text-swa-dark transition-colors">
            &gt;&gt;&gt; Try Online
          </Link>
        </div>
        <div className="w-full max-w-3xl bg-swa-code-bg rounded-lg shadow-2xl text-left font-mono text-sm overflow-hidden border border-gray-700 dark:border-swa-gray">
          <div className="bg-swa-gray p-3 flex items-center">
            <div className="flex space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <span className="flex-grow text-center text-gray-400">main.swa</span>
          </div>
          <pre className="p-4 overflow-x-auto">
            {/* <code className="text-white">
              <span className="text-gray-500">1 </span><span className="text-purple-400">import</span> {'{ http }'} <span className="text-purple-400">from</span> <span className="text-green-400">'std:net'</span>;
              <br />
              <span className="text-gray-500">2 </span>
              <br />
              <span className="text-gray-500">3 </span><span className="text-blue-400">const</span> server = http.<span className="text-yellow-400">createServer</span>((req, res) => {'{'}
              <br />
              <span className="text-gray-500">4 </span>  res.<span className="text-yellow-400">statusCode</span> = <span className="text-indigo-400">200</span>;
              <br />
              <span className="text-gray-500">5 </span>  res.<span className="text-yellow-400">setHeader</span>(<span className="text-green-400">'Content-Type'</span>, <span className="text-green-400">'text/plain'</span>);
              <br />
              <span className="text-gray-500">6 </span>  res.<span className="text-yellow-400">end</span>(<span className="text-green-400">'Hello, Swa World!\n'</span>);
              <br />
              <span className="text-gray-500">7 </span>{'}'});
              <br />
              <span className="text-gray-500">8 </span>
              <br />
              <span className="text-gray-500">9 </span>server.<span className="text-yellow-400">listen</span>(<span className="text-indigo-400">3000</span>, <span className="text-green-400">'127.0.0.1'</span>, () => {'{'}
              <br />
              <span className="text-gray-500">10</span>  <span className="text-cyan-400">print</span>(<span className="text-green-400">`Server running at http://127.0.0.1:3000/`</span>);
              <br />
              <span className="text-gray-500">11</span>{'}'});
            </code> */}
          </pre>
        </div>
      </div>
    </section>
  );
};

export default Hero;