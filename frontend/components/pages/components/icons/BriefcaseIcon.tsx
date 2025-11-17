import React from 'react';

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className || "h-6 w-6"}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={1.5}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.075c0 1.313-.964 2.47-2.25 2.754-1.286.284-2.628.284-3.914 0-1.286-.284-2.25-1.441-2.25-2.754V14.15M15.75 8.12v4.032c0 .87-.534 1.643-1.32 1.935-1.048.384-2.276.384-3.324 0C10.334 13.795 9.8 13.022 9.8 12.152V8.12M15.75 8.12L12 6.375 8.25 8.12M15.75 8.12V6.375a1.5 1.5 0 00-1.5-1.5h-4.5a1.5 1.5 0 00-1.5 1.5V8.12m6.75 0l-3.75-1.755-3.75 1.755m7.5 0v-1.5a1.5 1.5 0 00-1.5-1.5h-4.5a1.5 1.5 0 00-1.5 1.5V8.12" />
    </svg>
);

export default BriefcaseIcon;
