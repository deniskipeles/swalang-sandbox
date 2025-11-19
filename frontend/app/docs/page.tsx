"use client"

import React from 'react';
import Header from '@/components/pages/documentation/components/Header';
import Footer from '@/components/pages/documentation/components/Footer';
import DocumentationPage from '@/components/pages/documentation/components/DocumentationPage';

const DocsPage: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen bg-swalang-light-bg dark:bg-swalang-dark font-sans transition-colors duration-300">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <DocumentationPage />
            </main>
            <Footer />
        </div>
    );
};

export default DocsPage;
