import React from 'react';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className || "h-6 w-6"}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.964A4.5 4.5 0 1112 5.25v.162A4.5 4.5 0 119.75 11.25m-3.75 2.25a4.5 4.5 0 017.5 0m3.75-2.25a4.5 4.5 0 017.5 0m-15-2.25a3 3 0 00-3-3m12 3a3 3 0 00-3-3m-3.75 2.25A4.5 4.5 0 0112 11.25v.162A4.5 4.5 0 019.75 17.25m-3.75-2.25a3 3 0 00-3-3m12 3a3 3 0 00-3-3" />
    </svg>
);

export default UsersIcon;