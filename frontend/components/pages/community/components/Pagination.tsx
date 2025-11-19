import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const buttonClasses = "px-4 py-2 rounded-md transition-colors text-slate-700 dark:text-slate-300";
  const activeClasses = "bg-teal-500 dark:bg-teal-600 text-white font-bold";
  const inactiveClasses = "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600";
  const disabledClasses = "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed";

  return (
    <nav className="flex justify-center items-center space-x-2 mt-6">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`${buttonClasses} ${currentPage === 1 ? disabledClasses : inactiveClasses}`}
        aria-label="Go to previous page"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`${buttonClasses} ${currentPage === number ? activeClasses : inactiveClasses}`}
          aria-current={currentPage === number ? 'page' : undefined}
        >
          {number}
        </button>
      ))}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`${buttonClasses} ${currentPage === totalPages ? disabledClasses : inactiveClasses}`}
        aria-label="Go to next page"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </nav>
  );
};

export default Pagination;
