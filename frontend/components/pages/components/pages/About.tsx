import React from 'react';
import FlagIcon from '../icons/FlagIcon';
import UsersIcon from '../icons/UsersIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <section className="mb-16">
        <div className="flex items-center mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-swa-green/10 dark:bg-swa-green/20 flex items-center justify-center mr-4">
                {icon}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
            {children}
        </div>
    </section>
);

const About: React.FC = () => {
    return (
        <div className="bg-gray-50 dark:bg-swa-dark">
            <div className="container mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">About Swalang</h1>
                    <p className="text-xl text-gray-600 dark:text-swa-light-gray max-w-3xl mx-auto">
                        Learn about our mission to create an elegant, fast, and productive programming language for everyone.
                    </p>
                </header>

                <main className="max-w-4xl mx-auto">
                    <Section icon={<FlagIcon className="h-7 w-7 text-swa-green" />} title="Our Mission">
                        <p>
                            Our mission is to empower developers to build reliable and efficient software with joy and creativity. We believe that a programming language should be a tool that gets out of the way, allowing ideas to flow from mind to machine seamlessly. Swalang was born from this belief—a language designed with simplicity, performance, and developer ergonomics at its core.
                        </p>
                    </Section>

                    <Section icon={<UsersIcon className="h-7 w-7 text-swa-green" />} title="The Swa Foundation">
                        <p>
                            Swalang is an open-source project governed by the Swa Foundation, an independent non-profit organization. The Foundation's purpose is to promote, protect, and advance the Swalang programming language and to support and facilitate the growth of a diverse and international community of Swalang programmers.
                        </p>
                        <p>
                            We are funded by donations from our corporate sponsors and individual members. This model allows us to focus on the long-term health of the language and ecosystem without being beholden to any single corporate interest.
                        </p>
                    </Section>
                    
                    <div className="text-center mt-16 bg-white dark:bg-swa-gray p-8 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Get Involved</h3>
                        <p className="mt-4 text-gray-600 dark:text-swa-light-gray">
                            Swalang is built by the community, for the community. Whether you're a seasoned developer, a writer, or a designer, there are many ways to contribute.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                            <a href="/getting-started" className="bg-swa-green text-swa-dark font-bold py-3 px-8 rounded-md text-lg hover:bg-opacity-80 transition-colors shadow-lg shadow-swa-green/20">
                                Get Started
                            </a>
                            <a href="#" className="border-2 border-gray-400 dark:border-swa-light-gray text-gray-500 dark:text-swa-light-gray font-bold py-3 px-8 rounded-md text-lg hover:bg-gray-400 dark:hover:bg-swa-light-gray hover:text-swa-dark transition-colors flex items-center justify-center">
                                See Contribution Guide <ArrowRightIcon className="ml-2 h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default About;