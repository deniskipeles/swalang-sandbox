import React, { useState } from 'react';

interface AddKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { englishTerm: string; swahiliTerm: string; author: string; description: string; useCaseCode: string; }) => void;
}

const AddKeywordModal: React.FC<AddKeywordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [englishTerm, setEnglishTerm] = useState('');
  const [swahiliTerm, setSwahiliTerm] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [useCaseCode, setUseCaseCode] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!englishTerm || !swahiliTerm || !author || !description || !useCaseCode) {
      alert('Please fill out all fields.');
      return;
    }
    onSubmit({ englishTerm, swahiliTerm, author, description, useCaseCode });
    // Reset form for next time
    setEnglishTerm('');
    setSwahiliTerm('');
    setAuthor('');
    setDescription('');
    setUseCaseCode('');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add a New Keyword</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Propose a new Python keyword and provide its first Swahili suggestion.
            </p>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="englishTerm" className="block text-sm font-medium text-slate-600 dark:text-slate-300">English / Python Keyword</label>
              <input
                id="englishTerm"
                type="text"
                value={englishTerm}
                onChange={(e) => setEnglishTerm(e.target.value)}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
                placeholder="e.g., class"
                required
              />
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Your First Suggestion</h3>
            </div>
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Your Name</label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
                placeholder="Amani"
                required
              />
            </div>
            <div>
              <label htmlFor="swahiliTerm" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Swahili Term</label>
              <input
                id="swahiliTerm"
                type="text"
                value={swahiliTerm}
                onChange={(e) => setSwahiliTerm(e.target.value)}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
                placeholder="e.g., darasa"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 text-slate-900 dark:text-white"
                placeholder="Explain why this is a good term for the keyword."
                required
              />
            </div>
            <div>
              <label htmlFor="useCaseCode" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Use Case Code</label>
              <textarea
                id="useCaseCode"
                value={useCaseCode}
                onChange={(e) => setUseCaseCode(e.target.value)}
                rows={4}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-2 font-mono text-slate-900 dark:text-white"
                placeholder={'darasa Gari:\n  fafanua __init__(weka, modeli):\n    weka.modeli = modeli'}
                required
              />
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-800 transition-colors"
            >
              Submit Keyword
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddKeywordModal;