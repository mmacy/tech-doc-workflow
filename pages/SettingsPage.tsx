
import React, { useState, useRef } from 'react';
import { AgentSettings, DocumentTypeProfile } from '../types';
import AgentSettingsTab from '../components/settings/AgentSettingsTab';
import DocumentTypeProfilesTab from '../components/settings/DocumentTypeProfilesTab';
import GlobalStyleGuideTab from '../components/settings/GlobalStyleGuideTab';
import { LLMProviderTab } from '../components/settings/LLMProviderTab';
import { INITIAL_AGENT_SETTINGS } from '../constants';
import ConfirmModal from '../components/ConfirmModal';

interface SettingsPageProps {
  agentSettings: AgentSettings;
  onAgentSettingsChange: (newSettings: AgentSettings) => void;
  documentTypeProfiles: DocumentTypeProfile[];
  onDocumentTypeProfilesChange: (newProfiles: DocumentTypeProfile[]) => void;
  onBackToMain: () => void;
  disabled: boolean; // True if main workflow is processing
}

type SettingsTab = 'agents' | 'profiles' | 'globalStyle' | 'llmProvider';

const SettingsPage: React.FC<SettingsPageProps> = ({
  agentSettings,
  onAgentSettingsChange,
  documentTypeProfiles,
  onDocumentTypeProfilesChange,
  onBackToMain,
  disabled
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('llmProvider');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
  });


  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalProps({ title, message, onConfirm });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const handleConfirm = () => {
    confirmModalProps.onConfirm();
    closeConfirmModal();
  };


  const handleSaveToFile = () => {
    // Remove API keys from agentSettings before saving for security
    const { llmProvider, ...agentSettingsWithoutKeys } = agentSettings;
    const providerWithoutApiKey = {
      ...llmProvider,
      apiKey: '', // Never save API keys to file
    };
    
    const settingsToSave = {
        documentTypeProfiles: documentTypeProfiles,
        agentSettings: {
          ...agentSettingsWithoutKeys,
          llmProvider: providerWithoutApiKey,
        },
    };
    const jsonString = JSON.stringify(settingsToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "doc_authoring_settings.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const loadedData = JSON.parse(json);

          const normalizeProfiles = (loadedProfiles: any): DocumentTypeProfile[] => {
             if (!Array.isArray(loadedProfiles)) return [];
             return loadedProfiles.map((p: any) => ({
                id: p.id || `profile_${Date.now()}_${Math.random()}`,
                name: p.name || 'Untitled Profile',
                description: p.description || '',
                docTypeDescription: p.docTypeDescription || '',
                template: p.template || ''
            }));
          }

          // New format: { documentTypeProfiles: [], agentSettings: {} }
          if (loadedData.documentTypeProfiles && loadedData.agentSettings) {
             if (Array.isArray(loadedData.documentTypeProfiles) && typeof loadedData.agentSettings === 'object' && loadedData.agentSettings !== null) {
                openConfirmModal(
                    "Really load settings?",
                    "Loading from file will replace all current profiles and settings. Are you sure?",
                    () => {
                        onDocumentTypeProfilesChange(normalizeProfiles(loadedData.documentTypeProfiles));

                        const newAgentSettings: AgentSettings = {
                            ...INITIAL_AGENT_SETTINGS,
                            ...agentSettings,
                            ...loadedData.agentSettings,
                            maxLoopsPerReviewer: {
                                ...agentSettings.maxLoopsPerReviewer,
                                ...(loadedData.agentSettings.maxLoopsPerReviewer || {}),
                            },
                            reviewerGuidance: {
                                ...agentSettings.reviewerGuidance,
                                ...(loadedData.agentSettings.reviewerGuidance || {}),
                            },
                        };
                        onAgentSettingsChange(newAgentSettings);
                    }
                );
             } else {
                alert("Invalid file format. Ensure the file contains a 'documentTypeProfiles' array and an 'agentSettings' object.");
             }
          }
          // Old format: [ ...profiles ]
          else if (Array.isArray(loadedData)) {
            openConfirmModal(
                "Really load profile?",
                "This appears to be an older settings file that only contains profiles. Loading it will replace all current profiles. Global style guidance and role settings will not be changed. Are you sure?",
                () => {
                     onDocumentTypeProfilesChange(normalizeProfiles(loadedData));
                }
            );
          } else {
            alert("Invalid file format. Ensure the file contains a valid array of document type profiles or the new settings structure.");
          }
        } catch (error) {
          console.error("Error loading settings:", error);
          alert("Failed to load settings. The file might be corrupted or not in the correct JSON format.");
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsText(file);
    }
  };


  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary p-4 md:p-8 flex flex-col items-center">
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirm}
        title={confirmModalProps.title}
        confirmText="OK"
        cancelText="Cancel"
      >
        <p className="whitespace-pre-wrap">{confirmModalProps.message}</p>
      </ConfirmModal>

      <header className="w-full max-w-4xl mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-theme-accent">Settings</h1>
          <button
            onClick={onBackToMain}
            className="px-4 py-2 text-sm btn-theme-primary rounded-md text-white"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline mr-1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Back to Main App
          </button>
        </div>
        {disabled && (
            <p className="text-xs text-theme-warning mt-2 bg-theme-warning/10 p-2 rounded-md border border-theme-warning/30">Some settings are disabled while the authoring workflow is processing in the main app.</p>
        )}
      </header>

      <div className="w-full max-w-4xl mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={handleSaveToFile}
          disabled={disabled || documentTypeProfiles.length === 0}
          className="px-4 py-2 bg-theme-success hover:bg-theme-success/80 text-white rounded-md font-medium text-sm disabled:opacity-50 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Save settings to file
        </button>
        <label className="px-4 py-2 btn-theme-primary rounded-md font-medium text-sm disabled:opacity-50 cursor-pointer flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Load settings from file
          <input type="file" ref={fileInputRef} onChange={handleLoadFromFile} disabled={disabled} className="hidden" accept=".json" />
        </label>
      </div>

      <main className="w-full max-w-4xl card-theme p-6 md:p-8">
        <div className="mb-6 border-b border-theme">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('llmProvider')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'llmProvider'
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-theme-secondary hover:text-theme-primary hover:border-theme'
                }`}
            >
              LLM providers
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'agents'
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-theme-secondary hover:text-theme-primary hover:border-theme'
                }`}
            >
              Role settings
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'profiles'
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-theme-secondary hover:text-theme-primary hover:border-theme'
                }`}
            >
              Doc type profiles
            </button>
             <button
              onClick={() => setActiveTab('globalStyle')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'globalStyle'
                  ? 'border-theme-accent text-theme-accent'
                  : 'border-transparent text-theme-secondary hover:text-theme-primary hover:border-theme'
                }`}
            >
              Global style guidance
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'llmProvider' && (
            <LLMProviderTab
              provider={agentSettings.llmProvider}
              onProviderChange={(provider) =>
                onAgentSettingsChange({ ...agentSettings, llmProvider: provider })
              }
            />
          )}
          {activeTab === 'agents' && (
            <AgentSettingsTab
              settings={agentSettings}
              onSettingsChange={onAgentSettingsChange}
              disabled={disabled}
            />
          )}
          {activeTab === 'profiles' && (
            <DocumentTypeProfilesTab
              profiles={documentTypeProfiles}
              onProfilesChange={onDocumentTypeProfilesChange}
              disabled={disabled}
            />
          )}
           {activeTab === 'globalStyle' && (
            <GlobalStyleGuideTab
                settings={agentSettings}
                onSettingsChange={onAgentSettingsChange}
                disabled={disabled}
            />
          )}
        </div>
      </main>
       <footer className="w-full max-w-6xl mt-12 text-center text-xs text-theme-muted">
        <p>Changes made here will be applied to subsequent workflow runs.</p>
      </footer>
    </div>
  );
};

export default SettingsPage;
