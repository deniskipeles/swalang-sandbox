import React, { useState } from 'react';
import { Suggestion } from '../types';

interface SuggestionFormProps {
  onSubmit: (newSuggestionData: Omit<Suggestion, 'id' | 'votes'>) => void;
  onCancel: () => void;
}

const SuggestionForm: React.FC<SuggestionFormProps> = ({ onSubmit, onCancel }) => {
  const [swahiliTerm, setSwahiliTerm] = useState('');
  const [description, setDescription] = useState('');
  const [useCaseCode, setUseCaseCode] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swahiliTerm || !description || !useCaseCode || !author) {
      alert('Please fill out all fields.');
      return;
    }
    onSubmit({ swahiliTerm, description, useCaseCode, author });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Add Your Suggestion</h3>
      <div>
        <label htmlFor="author" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Your Name</label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
          placeholder="Amani"
        />
      </div>
      <div>
        <label htmlFor="swahiliTerm" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Swahili Term</label>
        <input
          id="swahiliTerm"
          type="text"
          value={swahiliTerm}
          onChange={(e) => setSwahiliTerm(e.target.value)}
          className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
          placeholder="e.g., chapisha"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
          placeholder="Explain why this is a good term."
        />
      </div>
      <div>
        <label htmlFor="useCaseCode" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Use Case Code</label>
        <textarea
          id="useCaseCode"
          value={useCaseCode}
          onChange={(e) => setUseCaseCode(e.target.value)}
          rows={4}
          className="mt-1 block w-full bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 font-mono text-slate-900 dark:text-white"
          placeholder="chapisha('Mambo, Dunia!')"
        />
      </div>
      <div className="flex items-center justify-end space-x-2">
        <button type="button" onClick={onCancel} className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" className="bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Submit
        </button>
      </div>
    </form>
  );
};

export default SuggestionForm;