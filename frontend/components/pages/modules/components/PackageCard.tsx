import React from 'react';
import { type Package } from '../types';
import PackageIcon from './icons/PackageIcon';
import { cardBaseStyles } from '../styles/common';

interface PackageCardProps {
    pkg: Package;
    onClick: (pkg: Package) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, onClick }) => {
    const keywordsToShow = pkg.keywords.slice(0, 2);
    const hiddenKeywordsCount = pkg.keywords.length - keywordsToShow.length;

    return (
        <div 
            className={`${cardBaseStyles} p-6 flex flex-col hover:border-swalang-accent hover:shadow-lg hover:shadow-swalang-accent/10 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
            onClick={() => onClick(pkg)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(pkg)}
        >
            <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-swalang-light-text dark:text-white flex items-center gap-2">
                        <PackageIcon className="h-5 w-5 text-swalang-accent" />
                        {pkg.name}
                    </h2>
                    <span className="text-sm bg-gray-100 dark:bg-swalang-purple text-swalang-light-subtle dark:text-swalang-light px-2 py-1 rounded-full">{pkg.version}</span>
                </div>
                <p className="text-swalang-light-subtle dark:text-swalang-light mb-4">{pkg.description}</p>
            </div>
            <div className="mt-auto">
                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    by{' '}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            // In a real app, this would navigate to the author's page.
                        }}
                        className="hover:text-swalang-accent hover:underline transition-colors duration-200"
                        aria-label={`View profile for ${pkg.author}`}
                    >
                        {pkg.author}
                    </a>
                </div>
                <div className="relative group">
                    <div className="flex flex-wrap gap-2 items-center">
                        {keywordsToShow.map(keyword => (
                            <span key={keyword} className="bg-swalang-accent/10 text-swalang-accent dark:bg-swalang-dark dark:text-swalang-accent text-xs font-semibold px-3 py-1 rounded-full">
                                {keyword}
                            </span>
                        ))}
                        {hiddenKeywordsCount > 0 && (
                            <span className="bg-gray-200 dark:bg-swalang-purple text-gray-600 dark:text-swalang-light text-xs font-semibold px-3 py-1 rounded-full">
                                +{hiddenKeywordsCount}
                            </span>
                        )}
                    </div>
                    <div className="absolute bottom-full mb-2 w-max max-w-xs bg-swalang-dark text-white text-sm rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 invisible group-hover:visible">
                        {pkg.keywords.join(', ')}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-swalang-dark"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageCard;
