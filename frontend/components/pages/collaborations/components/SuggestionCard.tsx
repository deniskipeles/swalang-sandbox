import React, { useState } from 'react';
import { Suggestion } from '../types';
import VoteButtons from './VoteButtons';
import CodeBlock from './CodeBlock';
import ConfirmationDialog from './ConfirmationDialog';

interface SuggestionCardProps {
  suggestion: Suggestion;
  isTopSuggestion: boolean;
  isStandardized: boolean;
  isKeywordStandardized: boolean;
  currentUser: string;
  onVote: (voteType: 'up' | 'down') => void;
  onEdit: (updatedData: Omit<Suggestion, 'id' | 'votes' | 'author'>) => void;
  onDelete: () => void;
  onStandardize: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, isTopSuggestion, isStandardized, isKeywordStandardized, currentUser, onVote, onEdit, onDelete, onStandardize }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editedTerm, setEditedTerm] = useState(suggestion.swahiliTerm);
  const [editedDesc, setEditedDesc] = useState(suggestion.description);
  const [editedCode, setEditedCode] = useState(suggestion.useCaseCode);
  
  const isAuthor = currentUser.trim().toLowerCase() === suggestion.author.trim().toLowerCase();
  const isAdmin = currentUser.trim() === 'Admin';

  const handleDelete = () => {
    setIsConfirmingDelete(true);
  };
  
  const confirmDelete = () => {
    onDelete();
    setIsConfirmingDelete(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTerm || !editedDesc || !editedCode) {
      alert('Please fill out all fields.');
      return;
    }
    onEdit({
      swahiliTerm: editedTerm,
      description: editedDesc,
      useCaseCode: editedCode,
    });
    setIsEditing(false);
  };

  const handleVote = (voteType: 'up' | 'down') => {
    setIsVoting(true);
    // Simulate network latency for better UX
    setTimeout(() => {
      onVote(voteType);
      setIsVoting(false);
    }, 500);
  };

  if (isEditing) {
    return (
       <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-4 ring-2 ring-cyan-500">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label htmlFor={`swahiliTerm-${suggestion.id}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300">Swahili Term</label>
            <input
              id={`swahiliTerm-${suggestion.id}`}
              type="text"
              value={editedTerm}
              onChange={(e) => setEditedTerm(e.target.value)}
              className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor={`description-${suggestion.id}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
            <textarea
              id={`description-${suggestion.id}`}
              value={editedDesc}
              onChange={(e) => setEditedDesc(e.target.value)}
              rows={3}
              className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor={`useCaseCode-${suggestion.id}`} className="block text-sm font-medium text-slate-600 dark:text-slate-300">Use Case Code</label>
            <textarea
              id={`useCaseCode-${suggestion.id}`}
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              rows={4}
              className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 font-mono text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors">
              Save
            </button>
          </div>
        </form>
       </div>
    );
  }

  const cardClasses = isStandardized 
    ? 'ring-2 ring-amber-500 dark:ring-amber-400 shadow-lg shadow-amber-500/10 dark:shadow-amber-900/50'
    : isTopSuggestion 
    ? 'ring-2 ring-green-500 dark:ring-green-400 shadow-lg shadow-green-500/10' 
    : 'ring-1 ring-slate-200 dark:ring-slate-600';

  return (
    <>
      <div className={`bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 transition-all duration-300 relative ${cardClasses}`}>
        {isStandardized && (
          <div className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Standard
          </div>
        )}
        {isTopSuggestion && (
          <div className="text-xs font-bold uppercase text-green-700 dark:text-green-300 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Top Suggestion
          </div>
        )}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-300">{suggestion.swahiliTerm}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">by {suggestion.author}</p>
          </div>
          <VoteButtons 
            votes={suggestion.votes} 
            onVote={handleVote} 
            disabled={isKeywordStandardized}
            isLoading={isVoting}
          />
        </div>
        <p className="text-slate-600 dark:text-slate-300 my-3 text-sm">{suggestion.description}</p>
        <div>
          <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Use Case:</h4>
          <CodeBlock code={suggestion.useCaseCode} />
        </div>
        {(isAuthor || isAdmin) && !isKeywordStandardized && (
          <div className="absolute top-2 right-2 flex space-x-1">
            {isAdmin && !isStandardized && (
              <button 
                onClick={onStandardize}
                className="p-1.5 text-amber-500 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-200 bg-slate-200/50 dark:bg-slate-800/50 rounded-full hover:bg-slate-300/50 dark:hover:bg-slate-700 transition-colors"
                aria-label="Make standard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            )}
            {isAuthor && (
              <>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 bg-slate-200/50 dark:bg-slate-800/50 rounded-full hover:bg-slate-300/50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Edit suggestion"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                  </svg>
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-200/50 dark:bg-slate-800/50 rounded-full hover:bg-slate-300/50 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Delete suggestion"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog 
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this suggestion? This action cannot be undone."
      />
    </>
  );
};

export default SuggestionCard;
