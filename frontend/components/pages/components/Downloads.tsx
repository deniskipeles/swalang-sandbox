import React from 'react';
import AppleIcon from './icons/AppleIcon';
import WindowsIcon from './icons/WindowsIcon';
import LinuxIcon from './icons/LinuxIcon';

const DownloadCard: React.FC<{
    icon: React.ReactNode;
    os: string;
    children: React.ReactNode;
    primaryLink: string;
    primaryText: string;
}> = ({ icon, os, children, primaryLink, primaryText }) => (
    <div className="bg-white dark:bg-swa-gray p-8 border-t-4 border-swa-green shadow-lg hover:shadow-2xl hover:shadow-swa-green/10 hover:-translate-y-1 transition-all duration-300 flex flex-col">
        <div className="flex items-center mb-4">
            {icon}
            <h3 className="text-2xl font-bold ml-3 text-gray-900 dark:text-white">{os}</h3>
        </div>
        <div className="flex-grow text-gray-600 dark:text-swa-light-gray mb-6">
            {children}
        </div>
        <a href={primaryLink} className="w-full text-center bg-swa-green text-swa-dark font-bold py-3 px-6 rounded-md hover:bg-opacity-80 transition-colors shadow-md shadow-swa-green/20">
            {primaryText}
        </a>
    </div>
);

const Checksum: React.FC<{ file: string; hash: string }> = ({ file, hash }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-swa-gray last:border-b-0 flex-wrap">
        <span className="font-semibold text-gray-700 dark:text-gray-300 mr-4">{file}</span>
        <code className="text-sm text-gray-500 dark:text-swa-light-gray bg-gray-100 dark:bg-swa-dark px-2 py-1 rounded break-all">{hash}</code>
    </div>
)

const Downloads: React.FC = () => {
    const LATEST_VERSION = "1.0.0";
    const RELEASE_DATE = "July 20, 2024";

    return (
        <div className="bg-gray-50 dark:bg-swa-dark">
            <div className="container mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">Download Swalang</h1>
                    <p className="text-xl text-gray-600 dark:text-swa-light-gray max-w-3xl mx-auto">
                        Get the latest version of Swalang for your system. Current version: <span className="font-bold text-swa-green">{LATEST_VERSION}</span> ({RELEASE_DATE})
                    </p>
                </header>

                <main>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        <DownloadCard
                            icon={<AppleIcon className="h-8 w-8 text-gray-800 dark:text-white" />}
                            os="macOS"
                            primaryLink="#"
                            primaryText="Download for macOS (Universal)"
                        >
                            <p>Requires macOS 11 (Big Sur) or newer. Universal binary for both Apple Silicon and Intel-based Macs.</p>
                            <a href="#" className="text-sm text-swa-green hover:underline mt-4 inline-block">.pkg Installer</a>
                        </DownloadCard>
                        <DownloadCard
                             icon={<WindowsIcon className="h-8 w-8 text-gray-800 dark:text-white" />}
                             os="Windows"
                             primaryLink="#"
                             primaryText="Download for Windows (x64)"
                        >
                            <p>Requires Windows 10 or newer. Installer for 64-bit systems.</p>
                             <div className="mt-4">
                                <a href="#" className="text-sm text-swa-green hover:underline mr-4">ARM64 Installer</a>
                                <a href="#" className="text-sm text-swa-green hover:underline">.zip Archive</a>
                            </div>
                        </DownloadCard>
                        <DownloadCard
                             icon={<LinuxIcon className="h-8 w-8 text-gray-800 dark:text-white" />}
                             os="Linux"
                             primaryLink="#"
                             primaryText="Download for Linux (x64)"
                        >
                            <p>Binaries for 64-bit Linux distributions. Requires glibc 2.28 or newer.</p>
                            <div className="mt-4">
                                <a href="#" className="text-sm text-swa-green hover:underline mr-4">ARM64 Binary</a>
                                <a href="#" className="text-sm text-swa-green hover:underline">Source Tarball</a>
                            </div>
                        </DownloadCard>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Verify Your Download</h2>
                        <p className="text-center text-gray-600 dark:text-swa-light-gray mb-8">
                            For security, we recommend verifying the SHA-256 checksum of your download.
                        </p>
                        <div className="bg-white dark:bg-swa-gray p-6 rounded-lg shadow-md">
                            <Checksum file="swalang-1.0.0-macos-universal.pkg" hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" />
                            <Checksum file="swalang-1.0.0-windows-x64.msi" hash="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" />
                            <Checksum file="swalang-1.0.0-linux-x64.tar.gz" hash="f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5" />
                        </div>

                         <div className="text-center mt-12">
                            <a href="#" className="text-swa-green hover:underline font-semibold">
                                View Release Notes for v1.0.0
                            </a>
                             <span className="mx-2 text-gray-400 dark:text-gray-600">|</span>
                             <a href="#" className="text-swa-green hover:underline font-semibold">
                                Archive of all versions
                            </a>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default Downloads;