"use client";

import React, { useState, useMemo } from 'react';
import Header from '@/components/pages/modules/components/Header';
import SearchBar from '@/components/pages/modules/components/SearchBar';
import PackageList from '@/components/pages/modules/components/PackageList';
import Footer from '@/components/pages/modules/components/Footer';
import PackageDetailModal from '@/components/pages/modules/components/PackageDetailModal';
import { type Package, type VersionHistoryItem } from '@/components/pages/modules/types';
import { mockPackages } from '@/components/pages/modules/data/packages';

// Helper to generate a plausible version history for a package
const getPackageVersionHistory = (pkg: Package | null): VersionHistoryItem[] => {
    if (!pkg || !pkg.version) return [];
    
    const versionParts = pkg.version.split('.').map(Number);
    if (versionParts.length !== 3 || versionParts.some(isNaN)) {
        return [{ version: pkg.version, date: new Date().toISOString().split('T')[0] }];
    }
    const [major, minor, patch] = versionParts;
    const history: VersionHistoryItem[] = [];
    const baseDate = new Date();

    // Current version
    history.push({ version: pkg.version, date: new Date(baseDate).toISOString().split('T')[0] });

    // Previous patch versions
    if (patch > 0) {
        const patchDate = new Date(baseDate);
        patchDate.setDate(baseDate.getDate() - 7);
        history.push({ version: `${major}.${minor}.${patch - 1}`, date: patchDate.toISOString().split('T')[0] });
    }
    if (patch > 1) {
        const patchDate2 = new Date(baseDate);
        patchDate2.setDate(baseDate.getDate() - 21);
         history.push({ version: `${major}.${minor}.${patch - 2}`, date: patchDate2.toISOString().split('T')[0] });
    }

    // Previous minor version
    if (minor > 0) {
        const minorDate = new Date(baseDate);
        minorDate.setMonth(baseDate.getMonth() - 3);
        history.push({ version: `${major}.${minor - 1}.0`, date: minorDate.toISOString().split('T')[0] });
    }

    // Initial major release
    if (major > 0) {
        const majorDate = new Date(baseDate);
        majorDate.setFullYear(baseDate.getFullYear() - 1);
        history.push({ version: `${major}.0.0`, date: majorDate.toISOString().split('T')[0] });
    } else {
        const initialDate = new Date(baseDate);
        initialDate.setMonth(baseDate.getMonth() - 6);
        history.push({ version: `0.1.0`, date: initialDate.toISOString().split('T')[0] });
    }

    return history.slice(0, 5); // Return the top 5 most recent versions
};


const ModulesPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [versionHistory, setVersionHistory] = useState<VersionHistoryItem[]>([]);

    const filteredPackages = useMemo(() => {
        if (!searchQuery) {
            return mockPackages;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return mockPackages.filter(pkg => {
            const searchCorpus = [
                pkg.name,
                pkg.description,
                pkg.author,
                ...pkg.keywords
            ].join(' ').toLowerCase();
            return searchCorpus.includes(lowercasedQuery);
        });
    }, [searchQuery]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handlePackageSelect = (pkg: Package) => {
        setSelectedPackage(pkg);
        setVersionHistory(getPackageVersionHistory(pkg));
    };

    const handleCloseModal = () => {
        setSelectedPackage(null);
    };

    const handleRelatedPackageClick = (pkg: Package) => {
        setSelectedPackage(pkg);
        setVersionHistory(getPackageVersionHistory(pkg));
    };

    const getRelatedPackages = (currentPackage: Package | null, allPackages: Package[]): Package[] => {
        if (!currentPackage) return [];

        return allPackages
            .filter(pkg => pkg.name !== currentPackage.name) // Exclude the current package itself
            .map(pkg => {
                // Calculate score based on shared keywords
                const sharedKeywords = pkg.keywords.filter(k => currentPackage.keywords.includes(k));
                return { pkg, score: sharedKeywords.length };
            })
            .filter(item => item.score > 0) // Only include packages with at least one shared keyword
            .sort((a, b) => b.score - a.score) // Sort by the highest score
            .slice(0, 4) // Take the top 4 related packages
            .map(item => item.pkg);
    };

    return (
        <div className="flex flex-col min-h-screen bg-swalang-light-bg dark:bg-swalang-dark font-sans transition-colors duration-300">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-swalang-light-text dark:text-white mb-2">
                        Find your <span className="text-swalang-accent">Swalang</span> module
                    </h1>
                    <p className="text-lg text-swalang-light-subtle dark:text-swalang-light">
                        The official package registry for the Swalang ecosystem.
                    </p>
                </div>
                
                <div className="max-w-2xl mx-auto mb-12">
                    <SearchBar onSearch={handleSearch} isLoading={false} />
                </div>
                
                <PackageList packages={filteredPackages} isLoading={false} onPackageClick={handlePackageSelect} />
            </main>
            <Footer />
            {selectedPackage && (
                <PackageDetailModal 
                    pkg={selectedPackage} 
                    onClose={handleCloseModal}
                    relatedPackages={getRelatedPackages(selectedPackage, mockPackages)}
                    onRelatedPackageClick={handleRelatedPackageClick}
                    versionHistory={versionHistory}
                />
            )}
        </div>
    );
};

export default ModulesPage;