
import React from 'react';

interface DownloadButtonProps {
  content: string;
  filename: string;
  disabled?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ content, filename, disabled = false }) => {
  const handleDownload = () => {
    if (disabled) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className="px-6 py-3 rounded-lg font-semibold btn-theme-primary text-white focus:ring-2 focus:ring-theme-accent focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      <span>Download markdown</span>
    </button>
  );
};

export default DownloadButton;
