import React from 'react';
import type { SocialLink } from './types';

const iconClasses = "w-8 h-8";

export const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Website: <i className={`fa-solid fa-globe ${iconClasses} text-sky-400`}></i>,
  Discord: <i className={`fa-brands fa-discord ${iconClasses} text-indigo-400`}></i>,
  GitHub: <i className={`fa-brands fa-github ${iconClasses} text-slate-300`}></i>,
  Twitter: <i className={`fa-brands fa-twitter ${iconClasses} text-blue-400`}></i>,
  Reddit: <i className={`fa-brands fa-reddit-alien ${iconClasses} text-orange-500`}></i>,
  Facebook: <i className={`fa-brands fa-facebook ${iconClasses} text-blue-600`}></i>,
  Instagram: <i className={`fa-brands fa-instagram ${iconClasses} text-pink-500`}></i>,
  WhatsApp: <i className={`fa-brands fa-whatsapp ${iconClasses} text-green-500`}></i>,
  Guidelines: <i className={`fa-solid fa-book-open ${iconClasses} text-amber-400`}></i>,
  Discussions: <i className={`fa-solid fa-comments ${iconClasses} text-lime-400`}></i>,
  Bug: <i className={`fa-solid fa-bug ${iconClasses} text-red-400`}></i>,
  Telegram: <i className={`fa-brands fa-telegram ${iconClasses} text-sky-500`}></i>,
  Slack: <i className={`fa-brands fa-slack ${iconClasses} text-purple-500`}></i>,
  Other: <i className={`fa-solid fa-users ${iconClasses} text-slate-400`}></i>,
};

export const PLATFORM_COLORS: Record<string, { border: string; name: string }> = {
    Website: { border: 'hover:border-sky-400 dark:hover:border-sky-400', name: 'group-hover:text-sky-400 dark:group-hover:text-sky-300' },
    Discord: { border: 'hover:border-indigo-400 dark:hover:border-indigo-400', name: 'group-hover:text-indigo-400 dark:group-hover:text-indigo-300' },
    GitHub: { border: 'hover:border-slate-400 dark:hover:border-slate-400', name: 'group-hover:text-slate-400 dark:group-hover:text-slate-300' },
    Twitter: { border: 'hover:border-blue-400 dark:hover:border-blue-400', name: 'group-hover:text-blue-400 dark:group-hover:text-blue-300' },
    Reddit: { border: 'hover:border-orange-500 dark:hover:border-orange-500', name: 'group-hover:text-orange-500 dark:group-hover:text-orange-400' },
    Facebook: { border: 'hover:border-blue-600 dark:hover:border-blue-600', name: 'group-hover:text-blue-600 dark:group-hover:text-blue-500' },
    Instagram: { border: 'hover:border-pink-500 dark:hover:border-pink-500', name: 'group-hover:text-pink-500 dark:group-hover:text-pink-400' },
    WhatsApp: { border: 'hover:border-green-500 dark:hover:border-green-500', name: 'group-hover:text-green-500 dark:group-hover:text-green-400' },
    Guidelines: { border: 'hover:border-amber-400 dark:hover:border-amber-400', name: 'group-hover:text-amber-400 dark:group-hover:text-amber-300' },
    Discussions: { border: 'hover:border-lime-400 dark:hover:border-lime-400', name: 'group-hover:text-lime-400 dark:group-hover:text-lime-300' },
    Bug: { border: 'hover:border-red-400 dark:hover:border-red-400', name: 'group-hover:text-red-400 dark:group-hover:text-red-300' },
    Telegram: { border: 'hover:border-sky-500 dark:hover:border-sky-500', name: 'group-hover:text-sky-500 dark:group-hover:text-sky-400' },
    Slack: { border: 'hover:border-purple-500 dark:hover:border-purple-500', name: 'group-hover:text-purple-500 dark:group-hover:text-purple-400' },
    Other: { border: 'hover:border-slate-400 dark:hover:border-slate-400', name: 'group-hover:text-slate-400 dark:group-hover:text-slate-300' },
};

export const OFFICIAL_LINKS: SocialLink[] = [
  {
    name: 'Official Website',
    url: '#',
    description: 'The primary source for documentation, news, and updates.',
    platform: 'Website',
  },
  {
    name: 'Discord',
    url: '#',
    description: 'Join real-time conversations with the core team and community.',
    platform: 'Discord',
  },
  {
    name: 'GitHub',
    url: '#',
    description: 'Contribute to the source code, report issues, and collaborate.',
    platform: 'GitHub',
  },
  {
    name: 'X (Twitter)',
    url: '#',
    description: 'Follow for the latest announcements and highlights.',
    platform: 'Twitter',
  },
];

export const UNOFFICIAL_LINKS: SocialLink[] = [
  {
    name: 'Reddit Community',
    url: '#',
    description: 'Share projects, ask questions, and discuss Swalang.',
    platform: 'Reddit',
  },
  {
    name: 'Facebook Group',
    url: '#',
    description: 'Connect with other Swalang developers on Facebook.',
    platform: 'Facebook',
  },
  {
    name: 'Instagram',
    url: '#',
    description: 'Visual updates, event photos, and community spotlights.',
    platform: 'Instagram',
  },
  {
    name: 'WhatsApp Channel',
    url: '#',
    description: 'Get instant updates and join quick discussions on WhatsApp.',
    platform: 'WhatsApp',
  },
];

export const GET_INVOLVED_LINKS: SocialLink[] = [
  {
    name: 'Contribute on GitHub',
    url: '#',
    description: 'Fork the repository, submit pull requests, and help build the future of Swalang.',
    platform: 'GitHub',
  },
  {
    name: 'Read Contribution Guidelines',
    url: '#',
    description: 'Find out how you can contribute by reading our guidelines and code of conduct.',
    platform: 'Guidelines',
  },
  {
    name: 'Join Developer Discussions',
    url: '#',
    description: 'Ask questions, propose new features, and connect with other contributors.',
    platform: 'Discussions',
  },
  {
    name: 'Report a Bug',
    url: '#',
    description: 'Found an issue? Open a ticket on GitHub and help us improve Swalang for everyone.',
    platform: 'Bug',
  },
];

export const USER_SUBMITTED_LINKS: SocialLink[] = [
    {
        name: 'Swalang Kenya Developers',
        url: '#',
        description: 'A WhatsApp group for Swalang developers based in Kenya to collaborate and share.',
        platform: 'WhatsApp',
    },
    {
        name: 'Swalang Learning Resources',
        url: '#',
        description: 'A Telegram channel sharing tutorials, articles, and videos for learning Swalang.',
        platform: 'Telegram',
    },
];
