import React from 'react';

interface VoteButtonsProps {
  votes: number;
  onVote: (voteType: 'up' | 'down') => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({ votes, onVote, disabled = false, isLoading = false }) => {
  return (
    <div className="flex flex-col items-center">
      <button 
        onClick={() => onVote('up')} 
        className="p-1 text-slate-500 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-500 dark:disabled:hover:text-slate-400 disabled:hover:bg-transparent"
        disabled={disabled || isLoading}
        aria-label="Upvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <div className="h-7 w-7 flex items-center justify-center">
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-slate-500 dark:text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <span className={`text-lg font-bold text-slate-800 dark:text-white tabular-nums ${disabled ? 'opacity-50' : ''}`}>{votes}</span>
        )}
      </div>
      <button 
        onClick={() => onVote('down')} 
        className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-red-500 dark:disabled:hover:text-red-400 disabled:hover:bg-transparent"
        disabled={disabled || isLoading}
        aria-label="Downvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
};

export default VoteButtons;