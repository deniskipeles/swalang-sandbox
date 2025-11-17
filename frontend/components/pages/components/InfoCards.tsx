import React from 'react';
import Link from 'next/link';
import ArrowRightIcon from './icons/ArrowRightIcon';
import CodeIcon from './icons/CodeIcon';

interface InfoCardProps {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  link: string;
  linkText?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ id, icon, title, description, link, linkText = "Learn More" }) => (
  <div id={id} className="bg-white dark:bg-swa-gray p-6 border-t-4 border-swa-green shadow-lg hover:shadow-2xl hover:shadow-swa-green/10 hover:-translate-y-1 transition-all duration-300">
    {icon && <div className="mb-3">{icon}</div>}
    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
    <p className="mb-4 text-gray-600 dark:text-swa-light-gray">{description}</p>
    <Link href={link} className="text-swa-green font-bold flex items-center hover:underline">
      {linkText} <ArrowRightIcon className="ml-2 h-5 w-5" />
    </Link>
  </div>
);

const InfoCards: React.FC = () => {
  return (
    <section className="bg-gray-100 dark:bg-black py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <InfoCard
            icon={<CodeIcon className="h-8 w-8 text-swa-green" />}
            title="Try Swalang"
            description="Experiment with Swalang code directly in your browser with our interactive tutorial."
            link="/try"
            linkText="Start Coding"
          />
          <InfoCard
            title="Download"
            description="Get the latest version of Swalang for your operating system."
            link="/downloads"
          />
          <InfoCard
            id="docs"
            title="Docs"
            description="Dive into the official documentation for comprehensive guides and tutorials."
            link="/docs"
          />
          <InfoCard
            title="Careers"
            description="Join the Swa Foundation and help build the future of programming."
            link="/careers"
          />
        </div>
      </div>
    </section>
  );
};

export default InfoCards;