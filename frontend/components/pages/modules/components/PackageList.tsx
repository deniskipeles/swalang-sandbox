"use client";

import React from 'react';
import { type Package } from '../types';
import PackageCard from './PackageCard';
import { cardBaseStyles } from '../styles/common';

interface PackageListProps {
    packages: Package[];
    isLoading: boolean;
    onPackageClick: (pkg: Package) => void;
}

const SkeletonCard: React.FC = () => (
    <div className={`${cardBaseStyles} p-6 animate-pulse`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-4"></div>
        <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
        </div>
    </div>
);

const PackageList: React.FC<PackageListProps> = ({ packages, isLoading, onPackageClick }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, index) => (
                    <SkeletonCard key={index} />
                ))}
            </div>
        );
    }
    
    if (packages.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-xl text-swalang-light-subtle dark:text-swalang-light">No packages found.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
                <PackageCard key={pkg.name} pkg={pkg} onClick={onPackageClick} />
            ))}
        </div>
    );
};

export default PackageList;
