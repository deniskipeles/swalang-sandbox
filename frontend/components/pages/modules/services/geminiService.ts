import { type Package } from '../types';
import mockPackages from '../data/packages.json';

// Simulate a network request to the mock data
export const generatePackages = async (query: string): Promise<Package[]> => {
    console.log("Fetching packages with query:", query);

    return new Promise(resolve => {
        setTimeout(() => {
            if (!query) {
                resolve(mockPackages as Package[]);
                return;
            }

            const lowercasedQuery = query.toLowerCase();
            const filteredPackages = mockPackages.filter(pkg => {
                const searchCorpus = [
                    pkg.name,
                    pkg.description,
                    pkg.author,
                    ...pkg.keywords
                ].join(' ').toLowerCase();

                return searchCorpus.includes(lowercasedQuery);
            });

            resolve(filteredPackages as Package[]);
        }, 500); // 500ms delay to simulate network latency
    });
};