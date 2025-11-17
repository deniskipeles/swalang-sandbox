import React from 'react';
import BriefcaseIcon from './icons/BriefcaseIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const JobOpening: React.FC<{ title: string; location: string; department: string; link: string }> = ({ title, location, department, link }) => (
    <a href={link} className="block bg-white dark:bg-swa-gray p-6 hover:bg-gray-50 dark:hover:bg-swa-gray/70 border border-gray-200 dark:border-swa-gray rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group">
        <div className="flex justify-between items-start">
            <div>
                <span className="text-sm font-semibold text-swa-green">{department}</span>
                <h3 className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-500 dark:text-swa-light-gray mt-2">{location}</p>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 group-hover:text-swa-green group-hover:translate-x-1 transition-transform duration-300 mt-1" />
        </div>
    </a>
);


const Careers: React.FC = () => {
    const jobs = {
        Engineering: [
            { title: 'Senior Backend Engineer (Compiler)', location: 'Remote, Global', link: '#' },
            { title: 'Frontend Engineer (Tooling)', location: 'Remote, US/EU Timezones', link: '#' },
            { title: 'DevOps & Infrastructure Engineer', location: 'Remote, Global', link: '#' },
        ],
        Design: [
            { title: 'Product Designer (UI/UX)', location: 'Remote, Global', link: '#' },
        ],
        Community: [
             { title: 'Developer Advocate', location: 'Remote, Global', link: '#' },
             { title: 'Technical Writer', location: 'Remote, Global', link: '#' },
        ]
    };

    return (
        <div className="bg-gray-50 dark:bg-swa-dark">
            <div className="container mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">Work with Us</h1>
                    <p className="text-xl text-gray-600 dark:text-swa-light-gray max-w-3xl mx-auto">
                        Join the Swa Foundation and help us build the future of programming. We're a passionate, distributed team dedicated to making Swalang the most elegant and powerful language for modern development.
                    </p>
                </header>

                <main className="max-w-4xl mx-auto">
                    {Object.entries(jobs).map(([department, openings]) => (
                        <section key={department} className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                                <BriefcaseIcon className="h-7 w-7 mr-3 text-swa-green" />
                                {department}
                            </h2>
                            <div className="space-y-4">
                                {openings.map(job => (
                                    <JobOpening key={job.title} {...job} department={department} />
                                ))}
                            </div>
                        </section>
                    ))}

                    <div className="text-center mt-16 bg-white dark:bg-swa-gray p-8 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Don't see a role for you?</h3>
                        <p className="mt-4 text-gray-600 dark:text-swa-light-gray">
                            We're always looking for talented people. If you're passionate about our mission, send us your resume and tell us how you can contribute.
                        </p>
                        <a href="mailto:careers@swalang.org" className="mt-6 inline-block bg-swa-green text-swa-dark font-bold py-3 px-8 rounded-md text-lg hover:bg-opacity-80 transition-colors shadow-lg shadow-swa-green/20">
                            Contact Us
                        </a>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Careers;