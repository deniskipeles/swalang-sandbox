import React from 'react';

interface HeaderProps {
  currentUser: string;
  onUserChange: (name: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onUserChange, theme, onToggleTheme }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm shadow-md sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 transition-colors">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-cyan-500 dark:text-cyan-400">
              Swalang <span className="text-slate-600 dark:text-slate-300 font-light">Collaborate</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Suggest & Vote on Swahili Keywords for a New Programming Language
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="currentUser" className="text-sm font-medium text-slate-600 dark:text-slate-300">Viewing as:</label>
              <input
                id="currentUser"
                type="text"
                value={currentUser}
                onChange={(e) => onUserChange(e.target.value)}
                className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 w-32 text-slate-900 dark:text-white transition-colors"
                placeholder="Your Name"
                aria-label="Set current user name"
              />
            </div>
             <button
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;