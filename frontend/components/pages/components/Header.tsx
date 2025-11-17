"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import SwalangLogoIcon from './icons/SwalangLogoIcon';
import SearchIcon from './icons/SearchIcon';
import MenuIcon from './icons/MenuIcon';
import CloseIcon from './icons/CloseIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { useTheme } from '../contexts/ThemeContext';

const NavLink: React.FC<{ href: string; children: React.ReactNode; className?: string }> = ({ href, children, className }) => (
  <Link href={href} className={`px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-swa-green transition-colors ${className}`}>
    {children}
  </Link>
);

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { name: 'Try Online', href: '/try' },
    { name: 'My Projects', href: '/projects' },
    { name: 'Docs', href: '/docs' },
    { name: 'News', href: '/news' },
    { name: 'About', href: '/about' },
    { name: 'Community', href: '/#community' },
    { name: 'Foundation', href: '/#foundation' },
    { name: 'Careers', href: '/careers' },
  ];

  return (
    <header className="bg-white/80 dark:bg-swa-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-swa-gray">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <SwalangLogoIcon />
          
          <nav className="hidden lg:flex items-center">
            {navItems.map((item) => (
              <NavLink key={item.name} href={item.href}>{item.name}</NavLink>
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex relative items-center">
              <input
                type="search"
                placeholder="Search"
                className="bg-gray-100 dark:bg-swa-gray border border-transparent focus:border-swa-green text-gray-800 dark:text-white placeholder-gray-500 rounded-md py-1.5 pl-8 pr-2 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-swa-green transition-all"
              />
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-swa-gray"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>
            <Link
              href="/downloads"
              className="hidden sm:inline-block bg-swa-green text-swa-dark font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
            >
              Downloads
            </Link>
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <CloseIcon className="text-gray-800 dark:text-white" /> : <MenuIcon className="text-gray-800 dark:text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-swa-dark absolute top-full left-0 w-full border-t border-gray-200 dark:border-swa-gray">
          <nav className="flex flex-col items-center py-4">
            {navItems.map((item) => (
              <NavLink key={item.name} href={item.href} className="py-3 text-lg">{item.name}</NavLink>
            ))}
            <Link
              href="/downloads"
              className="mt-4 bg-swa-green text-swa-dark font-bold py-3 px-6 rounded-md hover:bg-opacity-80 transition-colors"
            >
              Downloads
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;