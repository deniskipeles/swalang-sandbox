import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import LightningIcon from './icons/LightningIcon';
import PackageIcon from './icons/PackageIcon';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, children }) => (
  <div className="text-center p-6 bg-white dark:bg-swa-gray rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-swa-green/10 dark:bg-swa-green/20 mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-swa-light-gray">{children}</p>
  </div>
);

const WhySwalang: React.FC = () => {
  return (
    <section className="bg-gray-50 dark:bg-swa-dark py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Why Swalang?</h2>
        <p className="text-lg text-gray-600 dark:text-swa-light-gray mb-12 max-w-3xl mx-auto">
          Discover the advantages that make Swalang a powerful and delightful language for developers of all levels.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<SparklesIcon className="h-8 w-8 text-swa-green" />}
            title="Elegant Syntax"
          >
            A clean, readable syntax that feels natural, making your code easy to write and maintain, whether you're a solo developer or part of a large team.
          </FeatureCard>
          <FeatureCard
            icon={<LightningIcon className="h-8 w-8 text-swa-green" />}
            title="Blazing Fast"
          >
            Built on a high-performance runtime with an intelligent compiler, Swalang delivers impressive speed for everything from web servers to data analysis.
          </FeatureCard>
          <FeatureCard
            icon={<PackageIcon className="h-8 w-8 text-swa-green" />}
            title="Rich Ecosystem"
          >
            Tap into a vast collection of libraries and tools through SwaHub. The comprehensive standard library has you covered for common tasks out of the box.
          </FeatureCard>
        </div>
      </div>
    </section>
  );
};

export default WhySwalang;
