export enum AgentName {
  TECHNICAL_WRITER = "Technical Writer",
  INFORMATION_ARCHITECT = "Information Architect",
  TECHNICAL_EDITOR = "Technical Editor",
  TECHNICAL_REVIEWER = "Technical Reviewer",
}

export enum AgentRole {
  WRITER = "WRITER",
  REVIEWER = "REVIEWER",
}

export enum AgentStatus {
  PENDING = "Pending",
  WORKING = "Working...",
  REVIEWING = "Reviewing...",
  WAITING = "Waiting...",
  APPROVED = "Approved",
  SKIPPED_MAX_LOOPS = "Skipped (Max Loops Reached)",
  FAILED = "Failed",
  COMPLETED = "Completed",
}

export interface AgentConfig {
  id: AgentName;
  role: AgentRole;
  description: string;
  defaultMaxLoops?: number; // Only for reviewers
}

export interface AgentRuntimeState extends AgentConfig {
  status: AgentStatus;
  feedbackGiven?: string; 
  loops?: number; 
  defaultMaxLoops?: number; // Updated to be generic number for easier state updates
}

export interface WorkflowLog {
  id: string;
  timestamp: string;
  agent?: AgentName;
  message: string;
  type: "INFO" | "ERROR" | "SUCCESS" | "AGENT_ACTION";
}

export interface AgentSettings {
  maxLoopsPerReviewer: Record<AgentName.INFORMATION_ARCHITECT | AgentName.TECHNICAL_EDITOR | AgentName.TECHNICAL_REVIEWER, number>;
  reviewerGuidance: Record<AgentName.INFORMATION_ARCHITECT | AgentName.TECHNICAL_EDITOR | AgentName.TECHNICAL_REVIEWER, string>;
  writingStyleGuide: string;
  markdownStyleGuide: string;
  llmProvider: import('./types/providers').ProviderConfig;
}

export interface DocumentTypeProfile {
  id: string;
  name: string;
  description: string;
  docTypeDescription: string;
  template: string; // Markdown template
}

// For Gemini API response parsing for review agents
export type ReviewDecision = 
  | { type: "CONTINUE" }
  | { type: "REVISE"; feedback: string }
  | { type: "ERROR"; message: string };

export interface ReviewFeedbackEntry {
  agentName: AgentName;
  feedback: string;
  timestamp: string;
}

export type View = 'main' | 'settings';