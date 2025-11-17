import React from 'react';

const WindowsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || "h-6 w-6"}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M2.385 6.462l8.23-1.424v8.324H2.385V6.462zm9.155-1.56L22.115 3v10.322h-10.575V4.902zM2.385 17.538l8.23 1.424V10.64H2.385v6.898zm9.155 1.56L22.115 21V11.68h-10.575v7.418z"></path>
  </svg>
);

export default WindowsIcon;