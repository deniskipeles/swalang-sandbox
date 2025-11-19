import React from 'react';

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5m8.25 3v-3A2.25 2.25 0 0016.5 5.25H7.5A2.25 2.25 0 005.25 7.5v3m13.5 0v10.5A2.25 2.25 0 0116.5 24H7.5A2.25 2.25 0 015.25 21V10.5m13.5 0h-13.5" />
    </svg>
);

export default CopyIcon;
