import React from 'react';
import RoadmapIcon from './icons/RoadmapIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface RoadmapItemProps {
    children: React.ReactNode;
}

const RoadmapItem: React.FC<RoadmapItemProps> = ({ children }) => (
    <li className="flex items-start">
        <CheckCircleIcon className="h-5 w-5 text-swa-green mr-3 mt-1 flex-shrink-0" />
        <span>{children}</span>
    </li>
);

interface RoadmapCardProps {
    title: string;
    timeline: string;
    children: React.ReactNode;
}

const RoadmapCard: React.FC<RoadmapCardProps> = ({ title, timeline, children }) => (
    <div className="bg-white dark:bg-swa-gray p-6 rounded-lg shadow-md border-t-4 border-swa-green/50">
        <p className="text-sm font-semibold text-swa-green mb-1">{timeline}</p>
        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <ul className="space-y-3 text-gray-600 dark:text-swa-light-gray">
            {children}
        </ul>
    </div>
);

const Roadmap: React.FC = () => {
    return (
        <section className="bg-white dark:bg-black py-16">
            <div className="container mx-auto px-4 text-center">
                <div className="flex justify-center items-center mb-4">
                    <RoadmapIcon className="h-10 w-10 text-swa-green" />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">The Road Ahead</h2>
                <p className="text-lg text-gray-600 dark:text-swa-light-gray mb-12 max-w-3xl mx-auto">
                    Swalang is constantly evolving. Here’s a look at our plans for the future to make the language even more powerful and productive.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    <RoadmapCard title="Short Term" timeline="Next 6-12 Months">
                        <RoadmapItem>Performance tuning the compiler and runtime.</RoadmapItem>
                        <RoadmapItem>Official v1.0 of the SwaHub package manager.</RoadmapItem>
                        <RoadmapItem>Expanding the standard library with an async HTTP client.</RoadmapItem>
                        <RoadmapItem>Improved error messages for a better developer experience.</RoadmapItem>
                    </RoadmapCard>
                    <RoadmapCard title="Mid Term" timeline="1-2 Years">
                        <RoadmapItem>First-class WebAssembly (WASM) compilation target.</RoadmapItem>
                        <RoadmapItem>Mature Language Server Protocol (LSP) for enhanced IDE support.</RoadmapItem>
                        <RoadmapItem>Advanced concurrency model with structured concurrency.</RoadmapItem>
                        <RoadmapItem>Initial work on a foreign function interface (FFI) for C.</RoadmapItem>
                    </RoadmapCard>
                    <RoadmapCard title="Long Term" timeline="2+ Years">
                        <RoadmapItem>Self-hosting compiler written entirely in Swalang.</RoadmapItem>
                        <RoadmapItem>Powerful metaprogramming and macro system.</RoadmapItem>
                        <RoadmapItem>An official, cross-platform GUI framework.</RoadmapItem>
                        <RoadmapItem>Exploring Just-In-Time (JIT) compilation for dynamic workloads.</RoadmapItem>
                    </RoadmapCard>
                </div>
            </div>
        </section>
    );
};

export default Roadmap;