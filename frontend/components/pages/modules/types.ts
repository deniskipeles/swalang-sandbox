export interface Package {
    name: string;
    version: string;
    description: string;
    author: string;
    keywords: string[];
    readme: string;
}

export interface VersionHistoryItem {
    version: string;
    date: string;
}
