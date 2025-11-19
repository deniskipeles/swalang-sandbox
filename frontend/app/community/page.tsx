"use client"


import React, { useState, useEffect } from 'react';
import Header from '@/components/pages/community/components/Header';
import SocialLinkCard from '@/components/pages/community/components/SocialLinkCard';
import Chatbot from '@/components/pages/community/components/Chatbot';
import ThemeToggle from '@/components/pages/community/components/ThemeToggle';
import AddLinkForm from '@/components/pages/community/components/AddLinkForm';
import Pagination from '@/components/pages/community/components/Pagination';
import ContributionChatbot from '@/components/pages/community/components/ContributionChatbot';
import { OFFICIAL_LINKS, UNOFFICIAL_LINKS, GET_INVOLVED_LINKS, USER_SUBMITTED_LINKS } from '@/components/pages/community/constants';
import type { SocialLink } from '@/components/pages/community/types';

type Theme = 'light' | 'dark';
const USER_LINKS_PER_PAGE = 4;

const CommunityPage: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userLinks, setUserLinks] = useState<SocialLink[]>(USER_SUBMITTED_LINKS);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleAddLink = (newLink: SocialLink) => {
    setUserLinks(prevLinks => [newLink, ...prevLinks]);
  };

  const filterLinks = (links: SocialLink[]) => {
    if (!searchQuery) return links;
    return links.filter(link => 
      link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const filteredOfficialLinks = filterLinks(OFFICIAL_LINKS);
  const filteredUnofficialLinks = filterLinks(UNOFFICIAL_LINKS);
  const filteredGetInvolvedLinks = filterLinks(GET_INVOLVED_LINKS);
  const filteredUserLinks = filterLinks(userLinks);

  const totalUserLinkPages = Math.ceil(filteredUserLinks.length / USER_LINKS_PER_PAGE);

  useEffect(() => {
      if (currentPage > totalUserLinkPages && totalUserLinkPages > 0) {
          setCurrentPage(1);
      }
  }, [searchQuery, userLinks, currentPage, totalUserLinkPages]);

  const paginatedUserLinks = filteredUserLinks.slice(
    (currentPage - 1) * USER_LINKS_PER_PAGE,
    currentPage * USER_LINKS_PER_PAGE
  );


  const allLinksCount = filteredOfficialLinks.length + filteredUnofficialLinks.length + filteredGetInvolvedLinks.length + filteredUserLinks.length;

  const Section: React.FC<{ title: string; children: React.ReactNode, count: number }> = ({ title, children, count }) => (
    count > 0 ? (
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-l-4 border-teal-500 dark:border-teal-400 pl-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 relative">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <Header />
        
        <main className="max-w-4xl mx-auto">
          <div className="mb-12 relative">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Search all links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent transition-all text-slate-900 dark:text-white"
            />
          </div>
          
          {allLinksCount > 0 ? (
            <>
              <Section title="Official Channels" count={filteredOfficialLinks.length}>
                {filteredOfficialLinks.map((link) => (
                  <SocialLinkCard key={link.name} {...link} />
                ))}
              </Section>

              <Section title="Community Hubs" count={filteredUnofficialLinks.length}>
                {filteredUnofficialLinks.map((link) => (
                  <SocialLinkCard key={link.name} {...link} />
                ))}
              </Section>
              
              <Section title="User Submitted Hubs" count={filteredUserLinks.length}>
                {paginatedUserLinks.map((link, index) => (
                  <SocialLinkCard key={`${link.name}-${index}`} {...link} />
                ))}
                {totalUserLinkPages > 1 && (
                  <div className="md:col-span-2">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalUserLinkPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </Section>

              <Section title="Get Involved" count={filteredGetInvolvedLinks.length}>
                {filteredGetInvolvedLinks.map((link) => (
                  <SocialLinkCard key={link.name} {...link} />
                ))}
              </Section>

              <div className="mb-16">
                 <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-l-4 border-teal-500 dark:border-teal-400 pl-4">Contribution AI Assistant</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6">Want to contribute but not sure where to start? Ask our specialized AI assistant about our contribution process, how to report bugs, or community etiquette.</p>
                <ContributionChatbot />
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <i className="fa-solid fa-ghost text-5xl text-slate-400 dark:text-slate-600 mb-4"></i>
              <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">No links found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Try clearing your search or contributing a new link!</p>
            </div>
          )}

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-l-4 border-teal-500 dark:border-teal-400 pl-4">Contribute Your Link</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Run a Swalang community group? Add it to our list! Submissions are displayed in the "User Submitted Hubs" section.</p>
            <AddLinkForm onAddLink={handleAddLink} />
          </div>

          <div className="mb-16">
             <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-l-4 border-teal-500 dark:border-teal-400 pl-4">Ask our Community Helper</h2>
             <p className="text-slate-600 dark:text-slate-400 mb-6">Have general questions about the community? Our AI helper, powered by Gemini, can assist you. Ask about the best place to share your project, find collaborators, or learn about community events.</p>
            <Chatbot />
          </div>
        </main>
        
        <footer className="text-center text-slate-500 py-8">
            <p>&copy; {new Date().getFullYear()} Swalang Project. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default CommunityPage;
