import React, { useRef } from 'react';
import { AgentSettings } from '../../types';

interface GlobalStyleGuideTabProps {
  settings: AgentSettings;
  onSettingsChange: (newSettings: AgentSettings) => void;
  disabled: boolean;
}

const GlobalStyleGuideTab: React.FC<GlobalStyleGuideTabProps> = ({ settings, onSettingsChange, disabled }) => {
  const writingFileInputRef = useRef<HTMLInputElement>(null);
  const markdownFileInputRef = useRef<HTMLInputElement>(null);

  const handleWritingStyleChange = (value: string) => {
    onSettingsChange({ ...settings, writingStyleGuide: value });
  };

  const handleMarkdownStyleChange = (value: string) => {
    onSettingsChange({ ...settings, markdownStyleGuide: value });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setter(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        alert('Select a .txt or .md file.');
      }
    }
    // Reset file input to allow selecting the same file again
    if (event.target) {
        event.target.value = '';
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-1">Global style guidance</h3>
        <p className="text-sm text-slate-400">
          Define overarching style rules that apply to all document types. This guidance will be provided to all roles except the Technical Reviewer.
        </p>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="writingStyleGuide" className="block text-sm font-medium text-slate-300">
              Writing Style Guide
            </label>
            <button
                type="button"
                onClick={() => writingFileInputRef.current?.click()}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-md text-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Load content from a file"
            >
                Load from file
            </button>
            <input
                type="file"
                ref={writingFileInputRef}
                onChange={(e) => handleFileSelect(e, handleWritingStyleChange)}
                accept=".txt,.md"
                className="hidden"
            />
          </div>
          <textarea
            id="writingStyleGuide"
            value={settings.writingStyleGuide || ''}
            onChange={(e) => handleWritingStyleChange(e.target.value)}
            disabled={disabled}
            rows={10}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 placeholder-slate-400 text-sm"
            placeholder="e.g., Use active voice. Be concise. Define acronyms on first use..."
          />
          <p className="text-xs text-slate-400 mt-1">General rules for voice, tone, grammar, and terminology.</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="markdownStyleGuide" className="block text-sm font-medium text-slate-300">
              Markdown Style Guide
            </label>
             <button
                type="button"
                onClick={() => markdownFileInputRef.current?.click()}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-md text-sky-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Load content from a file"
            >
                Load from file
            </button>
            <input
                type="file"
                ref={markdownFileInputRef}
                onChange={(e) => handleFileSelect(e, handleMarkdownStyleChange)}
                accept=".txt,.md"
                className="hidden"
            />
          </div>
          <textarea
            id="markdownStyleGuide"
            value={settings.markdownStyleGuide || ''}
            onChange={(e) => handleMarkdownStyleChange(e.target.value)}
            disabled={disabled}
            rows={10}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 placeholder-slate-400 text-sm"
            placeholder="e.g., Use ATX-style headers (##). Use --- for horizontal rules. Wrap code snippets in triple backticks with a language identifier."
          />
          <p className="text-xs text-slate-400 mt-1">Specific rules for formatting Markdown content.</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalStyleGuideTab;
