import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-12 px-4">
      <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-sky-500">
        Swalang
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-4 text-lg md:text-xl">Community & Social Hub</p>
    </header>
  );
};

export default Header;