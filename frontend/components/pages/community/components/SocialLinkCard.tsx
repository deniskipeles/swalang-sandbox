import React from 'react';
import type { SocialLink } from '../types';
import { PLATFORM_ICONS, PLATFORM_COLORS } from '../constants';

const SocialLinkCard: React.FC<SocialLink> = ({ name, url, description, platform }) => {
  const icon = PLATFORM_ICONS[platform] || PLATFORM_ICONS['Other'];
  const colors = PLATFORM_COLORS[platform] || { 
      border: 'hover:border-teal-500 dark:hover:border-teal-400', 
      name: 'group-hover:text-teal-500 dark:group-hover:text-teal-300' 
  };
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-white/50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 ${colors.border} transition-all duration-300 group`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <h3 className={`text-lg font-semibold text-slate-800 dark:text-slate-100 ${colors.name} transition-colors`}>
            {name}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{description}</p>
        </div>
      </div>
    </a>
  );
};

export default SocialLinkCard;
