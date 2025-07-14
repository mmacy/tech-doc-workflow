export interface WorkflowRole {
  id: string;
  name: string;
  description: string;
  type: 'writer' | 'reviewer';
  specialization?: string;
  defaultMaxLoops?: number;
  systemPrompt: string;
  reviewPrompt?: string; // For reviewer roles
  revisionPrompt?: string; // For writer roles
}

export interface WorkflowProfile {
  id: string;
  name: string;
  description: string;
  version: string;
  roles: WorkflowRole[];
  executionOrder: string[]; // Role IDs in execution order
  globalSettings?: {
    maxIterations?: number;
    timeoutMinutes?: number;
  };
}

export interface WorkflowProfileCollection {
  version: string;
  profiles: WorkflowProfile[];
  defaultProfileId?: string;
}

// Built-in template definitions
export const WORKFLOW_ROLE_TEMPLATES = {
  technicalWriter: {
    id: 'technical-writer',
    name: 'Technical Writer',
    description: 'Generates and revises content based on inputs and feedback',
    type: 'writer' as const,
    systemPrompt: `You are an expert Technical Writer. Your task is to create clear, comprehensive technical documentation.

Follow these guidelines:
- Write in active voice when possible
- Use clear, concise language
- Structure content logically
- Include relevant examples and code snippets
- Follow the provided document template and style guides`,
    revisionPrompt: `You are an expert Technical Writer. Your task is to revise an existing technical document based on specific feedback.

Carefully consider the feedback and apply the necessary changes to the document. Ensure the revised output is in Markdown format.

Output ONLY the revised Markdown content for the document. Do not include any preambles or explanations outside the Markdown.`
  },
  technicalReviewer: {
    id: 'technical-reviewer',
    name: 'Technical Reviewer',
    description: 'Reviews for technical accuracy against source code',
    type: 'reviewer' as const,
    specialization: 'technical accuracy and consistency with the provided source code',
    defaultMaxLoops: 2,
    systemPrompt: `You are an expert Technical Reviewer. Your specialization is technical accuracy and consistency with the provided source code.

Review the document for:
- Accuracy of technical claims
- Consistency with source code
- Correctness of procedures and examples
- Factual accuracy`,
    reviewPrompt: `You are an expert Technical Reviewer. Your specialization is: technical accuracy and consistency with the provided source code. Verify claims, procedures, and factual statements against the source code. Treat source code as authoritative, identifying discrepancies between source code and the document as requiring revision.

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards for your area of expertise and the provided guidance, and requires NO changes:

    CONTINUE

2. If the document requires revisions in your area of expertise or based on the provided guidance:

    REVISE: [Provide very specific, actionable feedback. Clearly state what needs to be changed and why, focusing ONLY on your area of specialization: technical accuracy and consistency with the provided source code and the custom guidance provided.]

Do not add any text other than specified.`
  },
  informationArchitect: {
    id: 'information-architect',
    name: 'Information Architect',
    description: 'Reviews for structure, flow, clarity, and organization',
    type: 'reviewer' as const,
    specialization: 'information architecture (structure, flow, logical organization, clarity of headings, content grouping, navigation, and overall coherence for the intended audience)',
    defaultMaxLoops: 3,
    systemPrompt: `You are an expert Information Architect. Your specialization is information architecture.

Review the document for:
- Logical structure and flow
- Clear headings and organization
- Content grouping and navigation
- Overall coherence for the intended audience`,
    reviewPrompt: `You are an expert Information Architect. Your specialization is: information architecture (structure, flow, logical organization, clarity of headings, content grouping, navigation, and overall coherence for the intended audience).

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards for your area of expertise and the provided guidance, and requires NO changes:

    CONTINUE

2. If the document requires revisions in your area of expertise or based on the provided guidance:

    REVISE: [Provide very specific, actionable feedback. Clearly state what needs to be changed and why, focusing ONLY on your area of specialization: information architecture (structure, flow, logical organization, clarity of headings, content grouping, navigation, and overall coherence for the intended audience) and the custom guidance provided.]

Do not add any text other than specified.`
  },
  technicalEditor: {
    id: 'technical-editor',
    name: 'Technical Editor',
    description: 'Reviews for grammar, style, tone, and consistency',
    type: 'reviewer' as const,
    specialization: 'technical editing (grammar, spelling, punctuation, style, tone, voice, clarity, conciseness, terminology consistency, and adherence to common technical writing best practices)',
    defaultMaxLoops: 3,
    systemPrompt: `You are an expert Technical Editor. Your specialization is technical editing.

Review the document for:
- Grammar, spelling, and punctuation
- Style, tone, and voice consistency
- Clarity and conciseness
- Terminology consistency
- Adherence to technical writing best practices`,
    reviewPrompt: `You are an expert Technical Editor. Your specialization is: technical editing (grammar, spelling, punctuation, style, tone, voice, clarity, conciseness, terminology consistency, and adherence to common technical writing best practices).

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards for your area of expertise and the provided guidance, and requires NO changes:

    CONTINUE

2. If the document requires revisions in your area of expertise or based on the provided guidance:

    REVISE: [Provide very specific, actionable feedback. Clearly state what needs to be changed and why, focusing ONLY on your area of specialization: technical editing (grammar, spelling, punctuation, style, tone, voice, clarity, conciseness, terminology consistency, and adherence to common technical writing best practices) and the custom guidance provided.]

Do not add any text other than specified.`
  }
};

export const DEFAULT_WORKFLOW_PROFILES: WorkflowProfile[] = [
  {
    id: 'technical-documentation-standard',
    name: 'Technical Documentation Standard',
    description: 'Standard workflow for technical documentation with writer and three reviewers',
    version: '1.0.0',
    roles: [
      { ...WORKFLOW_ROLE_TEMPLATES.technicalWriter },
      { ...WORKFLOW_ROLE_TEMPLATES.technicalReviewer },
      { ...WORKFLOW_ROLE_TEMPLATES.informationArchitect },
      { ...WORKFLOW_ROLE_TEMPLATES.technicalEditor }
    ],
    executionOrder: ['technical-writer', 'technical-reviewer', 'information-architect', 'technical-editor'],
    globalSettings: {
      maxIterations: 10,
      timeoutMinutes: 30
    }
  },
  {
    id: 'quick-review',
    name: 'Quick Review',
    description: 'Streamlined workflow with writer and technical editor only',
    version: '1.0.0',
    roles: [
      { ...WORKFLOW_ROLE_TEMPLATES.technicalWriter },
      { ...WORKFLOW_ROLE_TEMPLATES.technicalEditor }
    ],
    executionOrder: ['technical-writer', 'technical-editor'],
    globalSettings: {
      maxIterations: 5,
      timeoutMinutes: 15
    }
  }
];