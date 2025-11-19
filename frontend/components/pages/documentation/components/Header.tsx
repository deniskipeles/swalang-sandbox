
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-swalang-light-surface/80 dark:bg-swalang-blue/30 backdrop-blur-sm sticky top-0 z-10 border-b border-swalang-light-border dark:border-swalang-purple transition-colors duration-300">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-swalang-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-10v10M8 7v10m8-10v10M5 7h14M5 17h14" />
                    </svg>
                    <h1 className="text-2xl font-bold text-swalang-light-text dark:text-white tracking-wider">
                        Swalang Documentations
                    </h1>
                </div>
            </div>
        </header>
    );
};

export default Header;