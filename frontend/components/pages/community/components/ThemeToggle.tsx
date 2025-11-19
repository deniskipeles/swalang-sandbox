import React from 'react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="absolute top-6 right-6 p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-teal-500"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <i className="fa-solid fa-moon w-6 h-6"></i>
      ) : (
        <i className="fa-solid fa-sun w-6 h-6"></i>
      )}
    </button>
  );
};

export default ThemeToggle;
