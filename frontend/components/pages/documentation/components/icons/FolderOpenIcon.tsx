import React from 'react';

const FolderOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75v6.125A2.625 2.625 0 006.375 18.5h11.25a2.625 2.625 0 002.625-2.625V9.75m-16.5 0v-2.625A2.625 2.625 0 016.375 4.5h11.25a2.625 2.625 0 012.625 2.625v2.625m-16.5 0h16.5" />
    </svg>
);

export default FolderOpenIcon;
