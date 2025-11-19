"use client";

import React, { useState } from 'react';
import SearchIcon from './icons/SearchIcon';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-swalang-light-subtle dark:text-gray-400" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a module..."
                className="w-full pl-12 pr-4 py-4 bg-swalang-light-surface dark:bg-swalang-blue border border-swalang-light-border dark:border-swalang-purple rounded-full text-swalang-light-text dark:text-white placeholder-swalang-light-subtle dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-swalang-accent transition-all duration-300"
                disabled={isLoading}
            />
             {isLoading && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <svg className="animate-spin h-5 w-5 text-swalang-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
        </form>
    );
};

export default SearchBar;