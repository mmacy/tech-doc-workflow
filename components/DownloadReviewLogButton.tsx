
import React from 'react';
import { ReviewFeedbackEntry } from '../types';

interface DownloadReviewLogButtonProps {
  feedbackLog: ReviewFeedbackEntry[];
  filename?: string;
  disabled?: boolean;
}

const DownloadReviewLogButton: React.FC<DownloadReviewLogButtonProps> = ({
  feedbackLog,
  filename = "review_feedback_log.txt",
  disabled = false,
}) => {
  const formatLogContent = (): string => {
    if (feedbackLog.length === 0) return "No review feedback was provided during this workflow run.";
    return feedbackLog
      .map(entry =>
        `Role: ${entry.agentName}\nTimestamp: ${entry.timestamp}\nFeedback:\n${entry.feedback}\n\n------------------------------------\n`
      )
      .join('');
  };

  const handleDownload = () => {
    if (disabled || feedbackLog.length === 0) return;
    const content = formatLogContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
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
      disabled={disabled || feedbackLog.length === 0}
      className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all
                  bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                  disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
      aria-label="Download review feedback log"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
      <span>Download review log</span>
    </button>
  );
};

export default DownloadReviewLogButton;