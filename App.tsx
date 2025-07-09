import React, { useState, useCallback, useEffect } from 'react';
import { AgentName, AgentRole, AgentStatus, WorkflowLog, AgentSettings, AgentRuntimeState, ReviewDecision, ReviewFeedbackEntry, DocumentTypeProfile, View } from './types';
import { AGENT_CONFIGURATIONS, INITIAL_AGENT_SETTINGS, INITIAL_DOCUMENT_TYPE_PROFILES, getTechnicalWriterInitialPrompt, getTechnicalWriterRevisionPrompt, getInformationArchitectReviewPrompt, getTechnicalEditorReviewPrompt, getTechnicalReviewerReviewPrompt } from './constants';
import { callLLMTextGeneration, callLLMReview, initializeProvider, getProviderDisplayInfo } from './services/llmService';
import DocumentInputForm from './components/DocumentInputForm';
import WorkflowStatusLog from './components/WorkflowStatusLog';
import DownloadButton from './components/DownloadButton';
import AgentCard from './components/AgentCard';
import Spinner from './components/Spinner';
import DownloadReviewLogButton from './components/DownloadReviewLogButton';
import SettingsPage from './pages/SettingsPage'; // New Settings Page
import { useTheme } from './contexts/ThemeContext';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<View>('main');

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [sourceContent, setSourceContent] = useState<string>('');
  const [supportingContent, setSupportingContent] = useState<string>('');

  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [currentDocument, setCurrentDocument] = useState<string>('');
  const [finalDocument, setFinalDocument] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [agentSettings, setAgentSettings] = useState<AgentSettings>(INITIAL_AGENT_SETTINGS);
   const [documentTypeProfiles, setDocumentTypeProfiles] = useState<DocumentTypeProfile[]>(INITIAL_DOCUMENT_TYPE_PROFILES);

  const [agentStates, setAgentStates] = useState<AgentRuntimeState[]>(
    AGENT_CONFIGURATIONS.map(config => ({
        ...config,
        status: AgentStatus.PENDING,
        defaultMaxLoops: config.role === AgentRole.REVIEWER
            ? agentSettings.maxLoopsPerReviewer[config.id as keyof AgentSettings['maxLoopsPerReviewer']]
            : config.defaultMaxLoops
    }))
  );
  const [reviewFeedbackLog, setReviewFeedbackLog] = useState<ReviewFeedbackEntry[]>([]);

  const addLog = useCallback((message: string, type: WorkflowLog['type'] = "INFO", agent?: AgentName) => {
    setWorkflowLogs(prevLogs => [
      ...prevLogs,
      { id: Date.now().toString() + Math.random().toString(), timestamp: new Date().toLocaleTimeString(), message, type, agent },
    ]);
  }, []);

  const updateAgentStatus = useCallback((agentId: AgentName, status: AgentStatus, feedbackGiven?: string, loops?: number) => {
    setAgentStates(prevStates =>
      prevStates.map(agent =>
        agent.id === agentId ? {
            ...agent,
            status,
            feedbackGiven: feedbackGiven !== undefined ? feedbackGiven : agent.feedbackGiven,
            loops: loops !== undefined ? loops : agent.loops,
            defaultMaxLoops: agent.role === AgentRole.REVIEWER
                ? agentSettings.maxLoopsPerReviewer[agent.id as keyof AgentSettings['maxLoopsPerReviewer']]
                : agent.defaultMaxLoops
        } : agent
      )
    );
  }, [agentSettings.maxLoopsPerReviewer]);

  const resetWorkflow = (keepInputs = false) => {
    if (!keepInputs) {
        setSelectedProfileId(null);
        setSourceContent('');
        setSupportingContent('');
    }
    setWorkflowLogs([]);
    setCurrentDocument('');
    setFinalDocument(null);
    setIsProcessing(false);
    setErrorMessage(null);
    setAgentStates(AGENT_CONFIGURATIONS.map(config => ({
        ...config,
        status: AgentStatus.PENDING,
        defaultMaxLoops: config.role === AgentRole.REVIEWER
            ? agentSettings.maxLoopsPerReviewer[config.id as keyof AgentSettings['maxLoopsPerReviewer']]
            : config.defaultMaxLoops
     })));
    setReviewFeedbackLog([]);
  };

 useEffect(() => {
    setAgentStates(prevStates =>
        prevStates.map(agent => ({
            ...agent,
            defaultMaxLoops: agent.role === AgentRole.REVIEWER
                ? agentSettings.maxLoopsPerReviewer[agent.id as keyof AgentSettings['maxLoopsPerReviewer']]
                : agent.defaultMaxLoops
        }))
    );
  }, [agentSettings.maxLoopsPerReviewer]);

  // Initialize LLM provider when settings change
  useEffect(() => {
    try {
      initializeProvider(agentSettings.llmProvider);
    } catch (error) {
      console.warn('Failed to initialize LLM provider:', error);
      setErrorMessage(`Failed to initialize LLM provider: ${(error as Error).message}`);
    }
  }, [agentSettings.llmProvider]);


  const handleFormSubmit = async () => {
    if (!selectedProfileId) {
        addLog("Error: No document type profile selected.", "ERROR");
        setErrorMessage("Select a document type profile.");
        return;
    }
    const profile = documentTypeProfiles.find(p => p.id === selectedProfileId);
    if (!profile) {
        addLog(`Error: Selected profile with ID ${selectedProfileId} not found.`, "ERROR");
        setErrorMessage("Selected profile not found. Check settings or re-select.");
        return;
    }

    resetWorkflow(true); // Keep inputs for this run
    setIsProcessing(true);
    setErrorMessage(null);

    // Add workflow metadata log entry
    const providerInfo = getProviderDisplayInfo(agentSettings.llmProvider);
    addLog(`Workflow started for profile: "${profile.name}" | Provider: ${providerInfo.providerName} | Model: ${providerInfo.modelName}`, "INFO");

    let currentIterationDocument = '';

    try {
      const writer = AGENT_CONFIGURATIONS.find(a => a.id === AgentName.TECHNICAL_WRITER)!;
      updateAgentStatus(writer.id, AgentStatus.WORKING);
      addLog("Generating initial draft...", "AGENT_ACTION", writer.id);
      const writerPrompt = getTechnicalWriterInitialPrompt(profile, sourceContent, supportingContent, agentSettings);
      currentIterationDocument = await callLLMTextGeneration(writerPrompt);
      setCurrentDocument(currentIterationDocument);
      updateAgentStatus(writer.id, AgentStatus.COMPLETED);
      addLog("Initial draft generated.", "SUCCESS", writer.id);

      const reviewerAgents = AGENT_CONFIGURATIONS.filter(a => a.role === AgentRole.REVIEWER);
      for (const reviewerConfig of reviewerAgents) {
        let loopCount = 0;
        const maxLoops = agentSettings.maxLoopsPerReviewer[reviewerConfig.id as keyof AgentSettings['maxLoopsPerReviewer']];
        updateAgentStatus(reviewerConfig.id, AgentStatus.REVIEWING, undefined, loopCount);

        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (loopCount >= maxLoops) {
            addLog(`Max revision loops (${maxLoops}) reached for ${reviewerConfig.id}. Proceeding to next role.`, "INFO", reviewerConfig.id);
            updateAgentStatus(reviewerConfig.id, AgentStatus.SKIPPED_MAX_LOOPS, undefined, loopCount);
            break;
          }

          addLog(`Reviewing document (Loop ${loopCount + 1}/${maxLoops})...`, "AGENT_ACTION", reviewerConfig.id);
          let reviewPrompt = '';

          if (reviewerConfig.id === AgentName.INFORMATION_ARCHITECT) {
            reviewPrompt = getInformationArchitectReviewPrompt(profile, currentIterationDocument, agentSettings);
          } else if (reviewerConfig.id === AgentName.TECHNICAL_EDITOR) {
            reviewPrompt = getTechnicalEditorReviewPrompt(profile, currentIterationDocument, agentSettings);
          } else if (reviewerConfig.id === AgentName.TECHNICAL_REVIEWER) {
            reviewPrompt = getTechnicalReviewerReviewPrompt(profile, currentIterationDocument, sourceContent, supportingContent, agentSettings);
          }

          const reviewDecision: ReviewDecision = await callLLMReview(reviewPrompt);

          if (reviewDecision.type === "CONTINUE") {
            addLog("Document approved.", "SUCCESS", reviewerConfig.id);
            updateAgentStatus(reviewerConfig.id, AgentStatus.APPROVED, undefined, loopCount);
            break;
          } else if (reviewDecision.type === "REVISE") {
            addLog(`Revisions requested: "${reviewDecision.feedback.substring(0,100)}..."`, "AGENT_ACTION", reviewerConfig.id);
            updateAgentStatus(reviewerConfig.id, AgentStatus.WAITING, reviewDecision.feedback, loopCount);
            setReviewFeedbackLog(prev => [...prev, {
                agentName: reviewerConfig.id,
                feedback: reviewDecision.feedback,
                timestamp: new Date().toLocaleTimeString()
            }]);

            updateAgentStatus(AgentName.TECHNICAL_WRITER, AgentStatus.WORKING);
            addLog("Applying revisions...", "AGENT_ACTION", AgentName.TECHNICAL_WRITER);
            const revisionPrompt = getTechnicalWriterRevisionPrompt(profile, currentIterationDocument, reviewDecision.feedback, agentSettings);
            currentIterationDocument = await callLLMTextGeneration(revisionPrompt);
            setCurrentDocument(currentIterationDocument);
            updateAgentStatus(AgentName.TECHNICAL_WRITER, AgentStatus.COMPLETED);
            addLog("Revisions applied by Technical Writer.", "SUCCESS", AgentName.TECHNICAL_WRITER);

            loopCount++;
            updateAgentStatus(reviewerConfig.id, AgentStatus.REVIEWING, undefined, loopCount);
          } else {
             addLog(`Error during review by ${reviewerConfig.id}: ${reviewDecision.message}. Proceeding with current document.`, "ERROR", reviewerConfig.id);
             updateAgentStatus(reviewerConfig.id, AgentStatus.FAILED, reviewDecision.message, loopCount);
             break;
          }
        }
      }

      setFinalDocument(currentIterationDocument);
      addLog("Workflow completed! Document is ready for download.", "SUCCESS");
       setAgentStates(prevStates => prevStates.map(agent => {
        if (agent.status !== AgentStatus.FAILED && agent.status !== AgentStatus.SKIPPED_MAX_LOOPS) {
          if (agent.role === AgentRole.WRITER) return {...agent, status: AgentStatus.COMPLETED};
        }
        return agent;
      }));
      if (agentStates.find(a => a.id === AgentName.TECHNICAL_WRITER && a.status !== AgentStatus.FAILED)) {
         updateAgentStatus(AgentName.TECHNICAL_WRITER, AgentStatus.COMPLETED);
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : "An unknown error occurred.";
      setErrorMessage(msg);
      addLog(`Workflow failed: ${msg}`, "ERROR");
      setAgentStates(prevStates =>
          prevStates.map(agent =>
              (agent.status === AgentStatus.WORKING || agent.status === AgentStatus.REVIEWING || agent.status === AgentStatus.WAITING || agent.status === AgentStatus.PENDING)
              ? { ...agent, status: AgentStatus.FAILED }
              : agent
          )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const activeAgentElement = document.querySelector('[data-active-agent="true"]');
    if (activeAgentElement) {
      activeAgentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [agentStates]);

  // Auto-select first profile if none is selected and profiles are available
  useEffect(() => {
    if (!selectedProfileId && documentTypeProfiles.length > 0) {
      setSelectedProfileId(documentTypeProfiles[0].id);
    }
    if (selectedProfileId && !documentTypeProfiles.find(p => p.id === selectedProfileId) && documentTypeProfiles.length > 0) {
      // If current selection is no longer valid, pick first
      setSelectedProfileId(documentTypeProfiles[0].id);
    } else if (documentTypeProfiles.length === 0) {
      setSelectedProfileId(null);
    }
  }, [documentTypeProfiles, selectedProfileId]);


  if (currentView === 'settings') {
    return (
      <SettingsPage
        agentSettings={agentSettings}
        onAgentSettingsChange={setAgentSettings}
        documentTypeProfiles={documentTypeProfiles}
        onDocumentTypeProfilesChange={setDocumentTypeProfiles}
        onBackToMain={() => setCurrentView('main')}
        disabled={isProcessing}
      />
    );
  }

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-6 text-center">
        <div className="flex justify-between items-center mb-2">
            <div className="w-1/4 flex justify-start">
                <button
                    onClick={toggleTheme}
                    className="px-3 py-2 text-sm btn-theme-secondary rounded-md text-theme-accent"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline mr-1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline mr-1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    )}
                    {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
            </div>
            <h1 className="text-4xl font-bold text-theme-accent w-1/2">Tech Doc Workflow</h1>
            <div className="w-1/4 flex justify-end">
                <button
                    onClick={() => setCurrentView('settings')}
                    className="px-4 py-2 text-sm btn-theme-secondary rounded-md text-theme-accent"
                    title="Go to settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline mr-1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.116-1.003h2.58c.556 0 1.026.461 1.116 1.003L15 6H9l.594-2.06zM21 12h-1.5M4.5 12H3m15.364 6.364l-1.06-1.06M6.364 6.364l-1.06-1.061M21 12c0 2.228-.86 4.33-2.427 5.913a8.914 8.914 0 01-1.413 1.259A9.011 9.011 0 0112 21c-2.228 0-4.33-.86-5.913-2.427a8.914 8.914 0 01-1.259-1.413A9.011 9.011 0 013 12c0-2.228.86-4.33 2.427-5.913a8.914 8.914 0 011.413-1.259A9.011 9.011 0 0112 3c2.228 0 4.33.86 5.913 2.427a8.914 8.914 0 011.259 1.413A9.011 9.011 0 0121 12zM12 9a3 3 0 100 6 3 3 0 000-6z" />
                    </svg>
                    Settings
                </button>
            </div>
        </div>
        <p className="text-theme-secondary mt-1">Multi-role workflow for transforming rough content into publish-ready technical documents.</p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <DocumentInputForm
            profiles={documentTypeProfiles}
            selectedProfileId={selectedProfileId}
            onProfileChange={setSelectedProfileId}
            sourceContent={sourceContent}
            onSourceContentChange={setSourceContent}
            supportingContent={supportingContent}
            onSupportingContentChange={setSupportingContent}
            onSubmit={handleFormSubmit}
            isProcessing={isProcessing}
          />
          <DownloadReviewLogButton
            feedbackLog={reviewFeedbackLog}
            disabled={isProcessing || reviewFeedbackLog.length === 0}
          />
           <button
            onClick={() => resetWorkflow(false)}
            disabled={isProcessing}
            className="w-full flex items-center justify-center px-6 py-3 btn-theme-secondary text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-primary focus:ring-theme-accent disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reset workflow
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col h-[75rem] gap-6">
            <div className="flex-shrink-0">
                <div className="card-theme p-6">
                  <h3 className="text-xl font-semibold text-theme-primary mb-4 border-b border-theme pb-2">Role status</h3>
                  {isProcessing && !agentStates.some(a => [AgentStatus.WORKING, AgentStatus.REVIEWING].includes(a.status)) &&
                  !workflowLogs.some(log => log.message.includes("Workflow started")) && (
                      <div className="flex items-center justify-center p-4 text-theme-secondary">
                          <Spinner size="md" /> <span className="ml-3">Initializing workflow...</span>
                      </div>
                  )}
                  <div className="space-y-3">
                    {agentStates.map((agentState) => (
                      <div key={agentState.id} data-active-agent={[AgentStatus.WORKING, AgentStatus.REVIEWING].includes(agentState.status) ? 'true': 'false'}>
                          <AgentCard agentState={agentState} />
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            <div className="flex-grow min-h-0">
                <WorkflowStatusLog logs={workflowLogs} />
            </div>
          </div>

          {errorMessage && (
            <div className="bg-theme-error/10 border border-theme-error/30 p-4 rounded-lg text-theme-error">
              <h4 className="font-semibold">Error:</h4>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {finalDocument && !isProcessing && (
            <div className="card-theme p-6">
              <h3 className="text-xl font-semibold text-theme-primary mb-2">Final document ready</h3>
               <p className="text-sm text-theme-secondary mb-4">The workflow has completed. You can download the final Markdown document below.</p>
              <div className="max-h-96 overflow-y-auto bg-theme-elevated p-4 rounded-md border border-theme mb-4 prose prose-sm max-w-none scrollbar-theme">
                <pre className="whitespace-pre-wrap">{finalDocument}</pre>
              </div>
              <DownloadButton
                content={finalDocument}
                filename={`${documentTypeProfiles.find(p => p.id === selectedProfileId)?.name.replace(/\s+/g, '_') || 'document'}_${new Date().toISOString().split('T')[0]}.md`}
              />
            </div>
          )}
           {!selectedProfileId && !isProcessing && documentTypeProfiles.length > 0 && (
             <div className="bg-theme-accent/10 border border-theme-accent/30 p-4 rounded-lg text-theme-accent">
                <h4 className="font-semibold">Getting started:</h4>
                <p className="text-sm">Select a document type profile, paste your source content, and click "Start authoring workflow".</p>
                <p className="text-sm mt-1">You can manage document type profiles in <button onClick={() => setCurrentView('settings')} className="underline hover:text-theme-primary">Settings</button>.</p>
             </div>
           )}
            {!selectedProfileId && !isProcessing && documentTypeProfiles.length === 0 && (
             <div className="bg-theme-warning/10 border border-theme-warning/30 p-4 rounded-lg text-theme-warning">
                <h4 className="font-semibold">Configuration needed:</h4>
                <p className="text-sm">No document type profiles found. Add at least one profile in <button onClick={() => setCurrentView('settings')} className="underline hover:text-theme-accent">Settings</button> before starting the workflow.</p>
             </div>
           )}
        </div>
      </main>
       <footer className="w-full max-w-6xl mt-12 text-center text-xs text-theme-muted">
        <p>Copyright 2025 | Marsh Macy</p>
      </footer>
    </div>
  );
};

export default App;