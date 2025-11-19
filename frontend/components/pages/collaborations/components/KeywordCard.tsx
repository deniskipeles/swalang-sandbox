import React, { useState, useMemo } from 'react';
import { Keyword, Suggestion } from '../types';
import SuggestionCard from './SuggestionCard';
import SuggestionForm from './SuggestionForm';

interface KeywordCardProps {
  keyword: Keyword;
  currentUser: string;
  onVote: (keywordId: number, suggestionId: number, voteType: 'up' | 'down') => void;
  onAddSuggestion: (keywordId: number, newSuggestionData: Omit<Suggestion, 'id' | 'votes'>) => void;
  onEditSuggestion: (keywordId: number, suggestionId: number, updatedData: Omit<Suggestion, 'id' | 'votes' | 'author'>) => void;
  onDeleteSuggestion: (keywordId: number, suggestionId: number) => void;
  onStandardize: (keywordId: number, suggestionId: number) => void;
}

const KeywordCard: React.FC<KeywordCardProps> = ({ keyword, currentUser, onVote, onAddSuggestion, onEditSuggestion, onDeleteSuggestion, onStandardize }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const isStandardized = !!keyword.standardizedSuggestionId;

  const sortedSuggestions = useMemo(() => {
    return [...keyword.suggestions].sort((a, b) => b.votes - a.votes);
  }, [keyword.suggestions]);

  const handleAddSuggestion = (newSuggestionData: Omit<Suggestion, 'id' | 'votes'>) => {
    onAddSuggestion(keyword.id, newSuggestionData);
    setIsFormVisible(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-2xl overflow-hidden flex flex-col h-full ring-1 ${isStandardized ? 'ring-amber-400/50' : 'ring-slate-200 dark:ring-slate-700'} transition-shadow`}>
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-mono font-bold text-slate-800 dark:text-white">
            <span className="text-slate-500 dark:text-slate-400">Keyword:</span> {keyword.englishTerm}
          </h2>
          {isStandardized && (
             <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/50 px-2 py-1 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Standardized
            </span>
          )}
        </div>
      </div>
      <div className="p-6 space-y-4 flex-grow overflow-y-auto">
        {sortedSuggestions.length > 0 ? (
          sortedSuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isTopSuggestion={!isStandardized && index === 0}
              isStandardized={suggestion.id === keyword.standardizedSuggestionId}
              isKeywordStandardized={isStandardized}
              currentUser={currentUser}
              onVote={(voteType) => onVote(keyword.id, suggestion.id, voteType)}
              onEdit={(updatedData) => onEditSuggestion(keyword.id, suggestion.id, updatedData)}
              onDelete={() => onDeleteSuggestion(keyword.id, suggestion.id)}
              onStandardize={() => onStandardize(keyword.id, suggestion.id)}
            />
          ))
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-4">No suggestions yet. Be the first!</p>
        )}
      </div>
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {isStandardized ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">This keyword has been standardized.</p>
        ) : isFormVisible ? (
          <SuggestionForm onSubmit={handleAddSuggestion} onCancel={() => setIsFormVisible(false)} />
        ) : (
          <button
            onClick={() => setIsFormVisible(true)}
            className="w-full bg-cyan-600 hover:bg-cyan-700 dark:hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            Suggest a Term for "{keyword.englishTerm}"
          </button>
        )}
      </div>
    </div>
  );
};

export default KeywordCard;