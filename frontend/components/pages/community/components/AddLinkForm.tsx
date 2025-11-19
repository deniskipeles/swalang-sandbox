import React, { useState } from 'react';
import { PLATFORM_ICONS } from '../constants';
import type { SocialLink } from '../types';

interface AddLinkFormProps {
  onAddLink: (link: SocialLink) => void;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ onAddLink }) => {
  const [platform, setPlatform] = useState(Object.keys(PLATFORM_ICONS)[0]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!name.trim() || !url.trim() || !description.trim()) {
      setError('All fields are required.');
      return;
    }

    const allowedDomains = [
        'github.com', 'x.com', 'twitter.com', 'reddit.com', 'facebook.com', 
        'instagram.com', 'whatsapp.com', 'chat.whatsapp.com', 'discord.gg', 'discord.com', 't.me', 
        'telegram.org', 'slack.com', 'linkedin.com', 'youtube.com', 'medium.com',
        'dev.to', 'meetup.com'
    ];

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_) {
      setError('Please enter a valid URL format (e.g., https://example.com).');
      return;
    }

    const isValidDomain = allowedDomains.some(domain => parsedUrl.hostname.endsWith(domain));

    if (!isValidDomain) {
        setError('Please provide a link to a known community platform like GitHub, Discord, or Facebook.');
        return;
    }

    onAddLink({ platform, name, url, description });
    
    // Reset form
    setPlatform(Object.keys(PLATFORM_ICONS)[0]);
    setName('');
    setUrl('');
    setDescription('');
  };

  const formInputClasses = "w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent transition-all text-slate-900 dark:text-white";

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label htmlFor="platform" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform</label>
            <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={formInputClasses}
            >
                {Object.keys(PLATFORM_ICONS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            </div>
            <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group/Page Name</label>
            <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={formInputClasses}
                placeholder="e.g., Swalang Nairobi Coders"
            />
            </div>
        </div>
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL</label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={formInputClasses}
            placeholder="https://..."
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Short Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${formInputClasses} min-h-[80px]`}
            placeholder="A brief description of your community."
          />
        </div>
        {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
        <div>
          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-bold rounded-md py-2 px-4 transition-all"
          >
            Submit Link
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLinkForm;
