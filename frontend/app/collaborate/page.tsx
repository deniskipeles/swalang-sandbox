"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Keyword, Suggestion } from '@/components/pages/collaborations/types';
import { data } from '@/components/pages/collaborations/data/keywords';
import Header from '@/components/pages/collaborations/components/Header';
import KeywordCard from '@/components/pages/collaborations/components/KeywordCard';
import AddKeywordModal from '@/components/pages/collaborations/components/AddKeywordModal';

const VOTE_THRESHOLD_FOR_STANDARD = 50;

const ColabPage: React.FC = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState('Amani'); // Default user for demo
  const [isAddKeywordModalOpen, setIsAddKeywordModalOpen] = useState(false);
  
  // Fix: Initialize with a static value to avoid accessing 'document' on the server
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Sync theme state with document class on client mount
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const handleToggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        // In a real app, you would fetch from an API here
        // const response = await fetch('/api/keywords');
        // const data = await response.json();
        setKeywords(data);
      } catch (err) {
        setError('Failed to load keywords data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeywords();
  }, []);

  const handleVote = useCallback((keywordId: number, suggestionId: number, voteType: 'up' | 'down') => {
    setKeywords(prevKeywords => 
      prevKeywords.map(keyword => {
        if (keyword.id === keywordId) {
          let updatedKeyword = { ...keyword };
          const newSuggestions = keyword.suggestions.map(suggestion => {
            if (suggestion.id === suggestionId) {
              const newVotes = voteType === 'up' ? suggestion.votes + 1 : suggestion.votes - 1;
              if (newVotes >= VOTE_THRESHOLD_FOR_STANDARD) {
                updatedKeyword.standardizedSuggestionId = suggestion.id;
              }
              return { ...suggestion, votes: newVotes };
            }
            return suggestion;
          });
          updatedKeyword.suggestions = newSuggestions;
          return updatedKeyword;
        }
        return keyword;
      })
    );
  }, []);

  const addSuggestion = useCallback((keywordId: number, newSuggestionData: Omit<Suggestion, 'id' | 'votes'>) => {
    const newSuggestion: Suggestion = {
      ...newSuggestionData,
      id: Date.now(),
      votes: 1, // Start with one vote from the author
    };

    setKeywords(prevKeywords => 
      prevKeywords.map(keyword => {
        if (keyword.id === keywordId) {
          return {
            ...keyword,
            suggestions: [...keyword.suggestions, newSuggestion],
          };
        }
        return keyword;
      })
    );
  }, []);

  const handleAddKeyword = useCallback((data: { englishTerm: string; swahiliTerm: string; author: string; description: string; useCaseCode: string; }) => {
    const newSuggestion: Suggestion = {
      id: Date.now() + 1,
      swahiliTerm: data.swahiliTerm,
      author: data.author,
      description: data.description,
      useCaseCode: data.useCaseCode,
      votes: 1,
    };

    const newKeyword: Keyword = {
      id: Date.now(),
      englishTerm: data.englishTerm,
      suggestions: [newSuggestion],
      standardizedSuggestionId: null,
    };

    setKeywords(prevKeywords => [newKeyword, ...prevKeywords]);
    setIsAddKeywordModalOpen(false);
  }, []);

  const handleEditSuggestion = useCallback((keywordId: number, suggestionId: number, updatedData: Omit<Suggestion, 'id' | 'votes' | 'author'>) => {
    setKeywords(prevKeywords =>
      prevKeywords.map(keyword => {
        if (keyword.id === keywordId) {
          return {
            ...keyword,
            suggestions: keyword.suggestions.map(suggestion => {
              if (suggestion.id === suggestionId) {
                return { ...suggestion, ...updatedData };
              }
              return suggestion;
            }),
          };
        }
        return keyword;
      })
    );
  }, []);

  const handleDeleteSuggestion = useCallback((keywordId: number, suggestionId: number) => {
    setKeywords(prevKeywords =>
      prevKeywords.map(keyword => {
        if (keyword.id === keywordId) {
          return {
            ...keyword,
            suggestions: keyword.suggestions.filter(suggestion => suggestion.id !== suggestionId),
          };
        }
        return keyword;
      })
    );
  }, []);

  const handleStandardize = useCallback((keywordId: number, suggestionId: number) => {
     setKeywords(prevKeywords =>
      prevKeywords.map(keyword => {
        if (keyword.id === keywordId) {
          return { ...keyword, standardizedSuggestionId: suggestionId };
        }
        return keyword;
      })
    );
  }, []);

  const filteredKeywords = useMemo(() => {
    if (!searchQuery) {
      return keywords;
    }
    const query = searchQuery.toLowerCase();
    return keywords.filter(keyword => {
      const matchInKeyword = keyword.englishTerm.toLowerCase().includes(query);
      const matchInSuggestion = keyword.suggestions.some(suggestion =>
        suggestion.swahiliTerm.toLowerCase().includes(query) ||
        suggestion.author.toLowerCase().includes(query) ||
        suggestion.description.toLowerCase().includes(query)
      );
      return matchInKeyword || matchInSuggestion;
    });
  }, [keywords, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Loading Terms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="text-2xl font-semibold text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
        <Header 
          currentUser={currentUser} 
          onUserChange={setCurrentUser} 
          theme={theme} 
          onToggleTheme={handleToggleTheme} 
        />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setIsAddKeywordModalOpen(true)}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 dark:hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                + Add New Keyword
              </button>
            </div>
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg py-3 pl-10 pr-3 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-colors"
                placeholder="Search keywords, Swahili terms, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search keywords and suggestions"
              />
            </div>
          </div>
          
          {filteredKeywords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredKeywords.map(keyword => (
                <KeywordCard 
                  key={keyword.id} 
                  keyword={keyword}
                  currentUser={currentUser}
                  onVote={handleVote} 
                  onAddSuggestion={addSuggestion}
                  onEditSuggestion={handleEditSuggestion}
                  onDeleteSuggestion={handleDeleteSuggestion}
                  onStandardize={handleStandardize}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-slate-600 dark:text-slate-300">No Results Found</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search query to find what you're looking for.</p>
            </div>
          )}
        </main>
      </div>

      <AddKeywordModal 
        isOpen={isAddKeywordModalOpen}
        onClose={() => setIsAddKeywordModalOpen(false)}
        onSubmit={handleAddKeyword}
      />
    </>
  );
};

export default ColabPage;