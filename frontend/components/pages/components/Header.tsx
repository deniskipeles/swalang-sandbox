"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import SwalangLogoIcon from './icons/SwalangLogoIcon';
import SearchIcon from './icons/SearchIcon';
import MenuIcon from './icons/MenuIcon';
import CloseIcon from './icons/CloseIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { useTheme } from '../contexts/ThemeContext';

const NavLink: React.FC<{ href: string; children: React.ReactNode; className?: string; onClick?: () => void }> = ({ href, children, className, onClick }) => (
  <Link 
    href={href} 
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-swa-green transition-colors ${className}`}
  >
    {children}
  </Link>
);

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.refresh();
    router.push('/auth/login');
  };

  const navItems = [
    { name: 'Try Online', href: '/try' },
    { name: 'My Projects', href: '/projects' },
    { name: 'Collaborate', href: '/collaborate' },
    { name: 'Docs', href: '/docs' },
    { name: 'Modules', href: '/modules' },
    { name: 'News', href: '/news' },
    { name: 'Community', href: '/community' },
  ];

  return (
    <header className="bg-white/80 dark:bg-swa-dark/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-swa-gray transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo Area */}
          <div className="flex-shrink-0 flex items-center">
            <SwalangLogoIcon className="scale-90 sm:scale-100" />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink key={item.name} href={item.href}>{item.name}</NavLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search */}
            <div className="hidden xl:flex relative items-center group">
              <input
                type="search"
                placeholder="Search"
                className="bg-gray-100 dark:bg-black/50 border border-transparent focus:border-swa-green text-gray-800 dark:text-white placeholder-gray-500 rounded-full py-1.5 pl-9 pr-4 text-sm w-32 focus:w-48 transition-all duration-300 outline-none"
              />
              <div className="absolute left-3 pointer-events-none text-gray-400 group-focus-within:text-swa-green transition-colors">
                <SearchIcon className="h-4 w-4" />
              </div>
            </div>

            {/* Theme Toggle */}
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>

            {/* Desktop Auth & Downloads */}
            <div className="hidden lg:flex items-center space-x-2">
              {session ? (
                <>
                  <Link href="/profile" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-swa-green px-3 py-2">
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-red-500 px-3 py-2">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-swa-green px-3 py-2">
                    Login
                  </Link>
                  <Link href="/auth/register" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors">
                    Register
                  </Link>
                </>
              )}
              
              <Link
                href="/downloads"
                className="bg-swa-green text-swa-dark font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-all shadow-sm hover:shadow-md ml-2"
              >
                Downloads
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <CloseIcon className="h-6 w-6" /> 
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[calc(100vh-4rem)] opacity-100 border-b border-gray-200 dark:border-swa-gray overflow-y-auto' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white dark:bg-swa-dark px-4 pb-8 pt-2 space-y-4 shadow-lg flex flex-col">
          {/* Mobile Search */}
          <div className="relative flex items-center">
            <input
              type="search"
              placeholder="Search..."
              className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-500 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-swa-green"
            />
            <div className="absolute left-3 text-gray-400">
              <SearchIcon className="h-4 w-4" />
            </div>
          </div>

          {/* Mobile Nav Links */}
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.name} 
                href={item.href} 
                className="text-base py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Auth Links */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
            {session ? (
               <>
                 <Link 
                   href="/profile" 
                   onClick={() => setIsMenuOpen(false)}
                   className="block text-center w-full py-2 text-gray-700 dark:text-gray-200 font-semibold bg-gray-100 dark:bg-gray-800 rounded-md"
                 >
                   My Profile
                 </Link>
                 <button 
                   onClick={handleLogout} 
                   className="block w-full py-2 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                 >
                   Logout
                 </button>
               </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-center py-2 rounded-md text-gray-700 dark:text-gray-200 font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-center py-2 rounded-md text-white bg-blue-600 font-semibold hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
            
            <Link
              href="/downloads"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-center bg-swa-green text-swa-dark font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-colors mt-2"
            >
              Download Swalang
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;