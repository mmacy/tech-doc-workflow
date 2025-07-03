import React, { useState } from 'react';
import { DocumentTypeProfile } from '../types';

interface DocumentInputFormProps {
  profiles: DocumentTypeProfile[];
  selectedProfileId: string | null;
  onProfileChange: (profileId: string) => void;
  sourceContent: string;
  onSourceContentChange: (content: string) => void;
  supportingContent: string;
  onSupportingContentChange: (content: string) => void;
  onSubmit: () => void; // Simplified onSubmit
  isProcessing: boolean;
}

const DocumentInputForm: React.FC<DocumentInputFormProps> = ({
  profiles,
  selectedProfileId,
  onProfileChange,
  sourceContent,
  onSourceContentChange,
  supportingContent,
  onSupportingContentChange,
  onSubmit,
  isProcessing,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceContent.trim()) {
      alert("Source content cannot be empty.");
      return;
    }
    if (!selectedProfileId) {
      alert("Please select a document type profile.");
      return;
    }
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-6 rounded-lg shadow-lg">
      <div>
        <label htmlFor="documentTypeProfile" className="block text-sm font-medium text-slate-300 mb-1">
          Document type profile
        </label>
        <select
          id="documentTypeProfile"
          name="documentTypeProfile"
          value={selectedProfileId || ''}
          onChange={(e) => onProfileChange(e.target.value)}
          disabled={isProcessing || profiles.length === 0}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50"
        >
          <option value="" disabled>
            {profiles.length === 0 ? "No profiles available (Go to Settings)" : "Select a profile..."}
          </option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
         {profiles.length === 0 && <p className="text-xs text-amber-400 mt-1">Please add document type profiles in Settings.</p>}
         {selectedProfileId && profiles.find(p => p.id === selectedProfileId) && (
            <p className="text-xs text-slate-400 mt-1">{profiles.find(p => p.id === selectedProfileId)?.description}</p>
         )}
      </div>

      <div>
        <label htmlFor="sourceContent" className="block text-sm font-medium text-slate-300 mb-1">
          Draft content <span className="text-red-400">*</span>
        </label>
        <textarea
          id="sourceContent"
          name="sourceContent"
          rows={8}
          placeholder="Paste your rough draft, design doc, Slack thread, etc."
          value={sourceContent}
          onChange={(e) => onSourceContentChange(e.target.value)}
          disabled={isProcessing}
          required
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 placeholder-slate-500"
        />
        <p className="text-xs text-slate-400 mt-1">This is the primary material the document will be based on.</p>
      </div>

      <div>
        <label htmlFor="supportingContent" className="block text-sm font-medium text-slate-300 mb-1">
          Supporting content (optional)
        </label>
        <textarea
          id="supportingContent"
          name="supportingContent"
          rows={6}
          placeholder="Paste source code, existing documentation, etc."
          value={supportingContent}
          onChange={(e) => onSupportingContentChange(e.target.value)}
          disabled={isProcessing}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 placeholder-slate-500"
        />
        <p className="text-xs text-slate-400 mt-1">Additional context to help the workflow roles.</p>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !sourceContent.trim() || !selectedProfileId || profiles.length === 0}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          'Start authoring workflow'
        )}
      </button>
    </form>
  );
};

export default DocumentInputForm;
