import React from 'react';

const SwalangLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <a href="/" className={`flex items-center group ${className}`} aria-label="Swalang Homepage">
        <div className="text-swa-green font-hand text-4xl">
            SW
        </div>
        <span className="text-gray-900 dark:text-white text-2xl font-bold ml-2 group-hover:text-swa-green transition-colors">Swalang</span>
    </a>
);

export default SwalangLogoIcon;
