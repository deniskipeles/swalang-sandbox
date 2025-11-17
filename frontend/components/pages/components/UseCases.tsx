import React from 'react';

interface UseCaseProps {
    title: string;
    description: string;
}

const UseCase: React.FC<UseCaseProps> = ({ title, description }) => (
    <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-swa-light-gray mt-1">{description}</p>
    </div>
);


const UseCases: React.FC = () => {
  return (
    <section className="bg-white dark:bg-black py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Use Swalang for...</h2>
        <p className="text-lg text-gray-600 dark:text-swa-light-gray mb-10 max-w-3xl mx-auto">Swalang is a versatile language, used for everything from web development to data science and machine learning. Discover its power.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            <UseCase 
                title="Web Development"
                description="Build scalable and secure web applications with Swalang's powerful standard library and rich ecosystem of frameworks."
            />
            <UseCase 
                title="AI & Machine Learning"
                description="Leverage state-of-the-art libraries for numerical computation, data analysis, and machine learning to build intelligent systems."
            />
             <UseCase 
                title="Data Science"
                description="From data wrangling and exploration to visualization and modeling, Swalang is the language of choice for data scientists."
            />
             <UseCase 
                title="Automation & Scripting"
                description="Automate repetitive tasks and write powerful scripts to streamline your workflows with Swalang's simple and readable syntax."
            />
            <UseCase 
                title="GUI Development"
                description="Create beautiful and responsive desktop applications for all major platforms using Swalang's cross-platform GUI toolkits."
            />
            <UseCase 
                title="System Administration"
                description="Manage infrastructure, orchestrate services, and automate DevOps tasks with a language that is both powerful and easy to use."
            />
        </div>
      </div>
    </section>
  );
};

export default UseCases;
