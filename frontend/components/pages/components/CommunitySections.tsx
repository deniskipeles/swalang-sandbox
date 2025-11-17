import React from 'react';
import ArrowRightIcon from './icons/ArrowRightIcon';

const CommunitySections: React.FC = () => {
  return (
    <>
      {/* Success Stories */}
      <section id="community" className="bg-gray-50 dark:bg-swa-dark py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Swalang Success Stories</h2>
          <blockquote className="max-w-3xl mx-auto text-xl italic text-gray-600 dark:text-gray-300">
            <p>"Switching our data pipeline to Swalang increased our processing speed by 200%. The simplicity of the language and the strength of its libraries made the transition seamless."</p>
            <footer className="mt-4 text-base not-italic font-semibold text-gray-500 dark:text-swa-light-gray">
              — Jane Doe, Head of Engineering at DataCorp
            </footer>
          </blockquote>
        </div>
      </section>

      {/* SwaHub */}
      <section id="swahub" className="bg-gray-100 dark:bg-swa-gray py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Discover SwaHub</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            The Swalang Hub is the package repository for Swalang. Find, install, and publish packages to accelerate your development.
          </p>
          <a href="#" className="bg-swa-green text-swa-dark font-bold py-3 px-8 rounded-md text-lg hover:bg-opacity-80 transition-colors shadow-lg flex items-center justify-center max-w-xs mx-auto">
            Explore SwaHub <ArrowRightIcon className="ml-2 h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Become a member */}
      <section id="foundation" className="bg-swa-green py-16">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-swa-dark mb-4">Become a Swa Foundation Member</h2>
            <p className="text-lg text-gray-800 max-w-3xl mx-auto mb-8">
            The Swa Foundation is the non-profit organization behind Swalang. Help support our mission to promote, protect, and advance the Swalang language.
            </p>
            <a href="#" className="bg-swa-dark text-white font-bold py-3 px-8 rounded-md text-lg hover:bg-black transition-colors shadow-lg flex items-center justify-center max-w-xs mx-auto">
            Join the Swa Foundation <ArrowRightIcon className="ml-2 h-5 w-5" />
            </a>
        </div>
      </section>
    </>
  );
};

export default CommunitySections;
