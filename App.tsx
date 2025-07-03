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

const App: React.FC = () => {
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
    }
  }, [agentSettings.llmProvider]);


  const handleFormSubmit = async () => {
    if (!selectedProfileId) {
        addLog("Error: No document type profile selected.", "ERROR");
        setErrorMessage("Please select a document type profile.");
        return;
    }
    const profile = documentTypeProfiles.find(p => p.id === selectedProfileId);
    if (!profile) {
        addLog(`Error: Selected profile with ID ${selectedProfileId} not found.`, "ERROR");
        setErrorMessage("Selected profile not found. Please check settings or re-select.");
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-6 text-center">
        <div className="flex justify-between items-center mb-2">
            <span className="w-1/4"></span> {/* Spacer */}
            <h1 className="text-4xl font-bold text-sky-400 w-1/2">Tech Doc Workflow</h1>
            <div className="w-1/4 flex justify-end">
                <button
                    onClick={() => setCurrentView('settings')}
                    className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-md text-sky-300 transition-colors"
                    title="Go to settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline mr-1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.003 1.116-1.003h2.58c.556 0 1.026.461 1.116 1.003L15 6H9l.594-2.06zM21 12h-1.5M4.5 12H3m15.364 6.364l-1.06-1.06M6.364 6.364l-1.06-1.061M21 12c0 2.228-.86 4.33-2.427 5.913a8.914 8.914 0 01-1.413 1.259A9.011 9.011 0 0112 21c-2.228 0-4.33-.86-5.913-2.427a8.914 8.914 0 01-1.259-1.413A9.011 9.011 0 013 12c0-2.228.86-4.33 2.427-5.913a8.914 8.914 0 011.413-1.259A9.011 9.011 0 0112 3c2.228 0 4.33.86 5.913 2.427a8.914 8.914 0 011.259 1.413A9.011 9.011 0 0121 12zM12 9a3 3 0 100 6 3 3 0 000-6z" />
                    </svg>
                    Settings
                </button>
            </div>
        </div>
        <p className="text-slate-400 mt-1">Multi-role workflow for transforming rough content into publish-ready technical documents.</p>
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
            className="w-full flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reset workflow
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col h-[50rem] gap-6">
            <div className="h-1/2">
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
                  <h3 className="text-xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2 shrink-0">Role status</h3>
                  {isProcessing && !agentStates.some(a => [AgentStatus.WORKING, AgentStatus.REVIEWING].includes(a.status)) &&
                  !workflowLogs.some(log => log.message.includes("Workflow started")) && (
                      <div className="flex items-center justify-center p-4 text-slate-400">
                          <Spinner size="md" /> <span className="ml-3">Initializing workflow...</span>
                      </div>
                  )}
                  <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 flex-grow">
                    {agentStates.map((agentState) => (
                      <div key={agentState.id} data-active-agent={[AgentStatus.WORKING, AgentStatus.REVIEWING].includes(agentState.status) ? 'true': 'false'}>
                          <AgentCard agentState={agentState} />
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            <div className="h-1/2">
                <WorkflowStatusLog logs={workflowLogs} />
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-800/50 border border-red-700 p-4 rounded-lg text-red-200">
              <h4 className="font-semibold text-red-100">Error:</h4>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {finalDocument && !isProcessing && (
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-slate-100 mb-2">Final document ready</h3>
               <p className="text-sm text-slate-400 mb-4">The workflow has completed. You can download the final Markdown document below.</p>
              <div className="max-h-96 overflow-y-auto bg-slate-700 p-4 rounded-md border border-slate-600 mb-4 prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap">{finalDocument}</pre>
              </div>
              <DownloadButton
                content={finalDocument}
                filename={`${documentTypeProfiles.find(p => p.id === selectedProfileId)?.name.replace(/\s+/g, '_') || 'document'}_${new Date().toISOString().split('T')[0]}.md`}
              />
            </div>
          )}
           {!selectedProfileId && !isProcessing && documentTypeProfiles.length > 0 && (
             <div className="bg-sky-800/50 border border-sky-700 p-4 rounded-lg text-sky-200">
                <h4 className="font-semibold text-sky-100">Getting started:</h4>
                <p className="text-sm">Select a document type profile, paste your source content, and click "Start authoring workflow".</p>
                <p className="text-sm mt-1">You can manage document type profiles in <button onClick={() => setCurrentView('settings')} className="underline hover:text-sky-100">Settings</button>.</p>
             </div>
           )}
            {!selectedProfileId && !isProcessing && documentTypeProfiles.length === 0 && (
             <div className="bg-amber-800/50 border border-amber-700 p-4 rounded-lg text-amber-200">
                <h4 className="font-semibold text-amber-100">Configuration needed:</h4>
                <p className="text-sm">No document type profiles found. Please go to <button onClick={() => setCurrentView('settings')} className="underline hover:text-amber-100">Settings</button> to add at least one profile before starting the workflow.</p>
             </div>
           )}
        </div>
      </main>
       <footer className="w-full max-w-6xl mt-12 text-center text-xs text-slate-500">
        <p>Copyright 2025 | Marsh Macy</p>
      </footer>
    </div>
  );
};

export default App;