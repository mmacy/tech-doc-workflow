// Schema-based role configuration system
export interface RoleFieldSchema {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'multiselect';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    message?: string;
  };
  helpText?: string;
}

export interface RoleTypeSchema {
  id: string;
  name: string;
  description: string;
  category: 'writer' | 'reviewer' | 'analyzer' | 'processor';
  icon?: string;
  fields: RoleFieldSchema[];
  promptTemplate: string; // Template with {{field_id}} placeholders
  defaultSettings?: Record<string, any>;
}

export interface ConfigurableRole {
  id: string;
  typeId: string; // References RoleTypeSchema
  name: string;
  description?: string;
  configuration: Record<string, any>; // Field values
  generatedPrompt?: string; // Computed from template + configuration
  executionSettings: {
    enabled: boolean;
    maxLoops?: number;
    timeout?: number;
    retryCount?: number;
  };
}

export interface WorkflowSchemaProfile {
  id: string;
  name: string;
  description: string;
  version: string;
  roles: ConfigurableRole[];
  executionOrder: string[];
  globalSettings: {
    maxTotalIterations?: number;
    timeoutMinutes?: number;
    allowParallelReviews?: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    tags?: string[];
  };
}

// Built-in role type schemas
export const ROLE_TYPE_SCHEMAS: RoleTypeSchema[] = [
  {
    id: 'technical-writer',
    name: 'Technical Writer',
    description: 'Creates and revises technical documentation',
    category: 'writer',
    icon: '✍️',
    fields: [
      {
        id: 'writing_style',
        label: 'Writing style',
        type: 'select',
        required: true,
        defaultValue: 'professional',
        options: [
          { value: 'professional', label: 'Professional and formal' },
          { value: 'conversational', label: 'Conversational and approachable' },
          { value: 'technical', label: 'Technical and precise' },
          { value: 'educational', label: 'Educational and explanatory' }
        ],
        helpText: 'Choose the tone and style for the writing'
      },
      {
        id: 'target_audience',
        label: 'Target audience',
        type: 'select',
        required: true,
        defaultValue: 'developers',
        options: [
          { value: 'beginners', label: 'Beginners/newcomers' },
          { value: 'developers', label: 'Experienced developers' },
          { value: 'architects', label: 'Technical architects' },
          { value: 'mixed', label: 'Mixed audience' }
        ],
        helpText: 'Primary audience for the documentation'
      },
      {
        id: 'include_examples',
        label: 'Include code examples',
        type: 'boolean',
        defaultValue: true,
        helpText: 'Whether to include practical code examples'
      },
      {
        id: 'complexity_level',
        label: 'Complexity level',
        type: 'number',
        min: 1,
        max: 5,
        defaultValue: 3,
        helpText: 'Technical complexity level (1=basic, 5=advanced)'
      },
      {
        id: 'custom_instructions',
        label: 'Custom instructions',
        type: 'textarea',
        placeholder: 'Additional specific instructions for this writer...',
        helpText: 'Any specific requirements or constraints for this writer'
      }
    ],
    promptTemplate: `You are an expert Technical Writer creating {{writing_style}} documentation for {{target_audience}}.

Target audience: {{target_audience}}
Writing style: {{writing_style}}
Complexity level: {{complexity_level}}/5
{{#include_examples}}
Include practical code examples and demonstrations.
{{/include_examples}}
{{#custom_instructions}}

Additional instructions:
{{custom_instructions}}
{{/custom_instructions}}

Your task is to create clear, comprehensive technical documentation that serves the needs of your target audience.

Follow these guidelines:
- Write in active voice when possible
- Use clear, concise language appropriate for {{target_audience}}
- Structure content logically with clear headings
- {{#include_examples}}Include relevant examples and code snippets{{/include_examples}}
- Follow the provided document template and style guides`,
    defaultSettings: {
      maxRetries: 2,
      timeout: 300
    }
  },
  {
    id: 'technical-reviewer',
    name: 'Technical Reviewer',
    description: 'Reviews documentation for technical accuracy',
    category: 'reviewer',
    icon: '🔍',
    fields: [
      {
        id: 'review_focus',
        label: 'Review focus areas',
        type: 'multiselect',
        required: true,
        defaultValue: ['accuracy', 'completeness'],
        options: [
          { value: 'accuracy', label: 'Technical accuracy' },
          { value: 'completeness', label: 'Completeness of information' },
          { value: 'code_quality', label: 'Code example quality' },
          { value: 'security', label: 'Security considerations' },
          { value: 'performance', label: 'Performance implications' },
          { value: 'best_practices', label: 'Best practices adherence' }
        ],
        helpText: 'Select which aspects to focus on during review'
      },
      {
        id: 'expertise_level',
        label: 'Reviewer expertise level',
        type: 'select',
        required: true,
        defaultValue: 'senior',
        options: [
          { value: 'junior', label: 'Junior reviewer' },
          { value: 'mid', label: 'Mid-level reviewer' },
          { value: 'senior', label: 'Senior reviewer' },
          { value: 'expert', label: 'Subject matter expert' }
        ],
        helpText: 'Level of technical expertise for this reviewer'
      },
      {
        id: 'strictness_level',
        label: 'Review strictness',
        type: 'number',
        min: 1,
        max: 5,
        defaultValue: 3,
        helpText: 'How strict should the review be (1=lenient, 5=very strict)'
      },
      {
        id: 'must_verify_code',
        label: 'Must verify all code examples',
        type: 'boolean',
        defaultValue: true,
        helpText: 'Require verification of all code examples against source'
      },
      {
        id: 'review_checklist',
        label: 'Custom review checklist',
        type: 'textarea',
        placeholder: 'Enter specific items to check during review...',
        helpText: 'Custom checklist items specific to this reviewer'
      }
    ],
    promptTemplate: `You are a {{expertise_level}} Technical Reviewer with expertise in technical documentation review.

Review focus areas: {{review_focus}}
Expertise level: {{expertise_level}}
Review strictness: {{strictness_level}}/5
{{#must_verify_code}}
CRITICAL: You must verify all code examples against the provided source code.
{{/must_verify_code}}

{{#review_checklist}}
Custom review checklist:
{{review_checklist}}
{{/review_checklist}}

Your specialization is technical accuracy and consistency with the provided source code. 
Review the document for:
{{#review_focus}}
- {{.}}
{{/review_focus}}

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards for your area of expertise and the provided guidance, and requires NO changes:

    CONTINUE

2. If the document requires revisions in your area of expertise or based on the provided guidance:

    REVISE: [Provide very specific, actionable feedback. Clearly state what needs to be changed and why, focusing on your review areas.]

Do not add any text other than specified.`,
    defaultSettings: {
      maxLoops: 3,
      timeout: 180
    }
  },
  {
    id: 'style-editor',
    name: 'Style Editor',
    description: 'Reviews and improves writing style and clarity',
    category: 'reviewer',
    icon: '📝',
    fields: [
      {
        id: 'style_guide',
        label: 'Style guide to follow',
        type: 'select',
        required: true,
        defaultValue: 'technical',
        options: [
          { value: 'technical', label: 'Technical writing best practices' },
          { value: 'ap', label: 'Associated Press (AP) Style' },
          { value: 'chicago', label: 'Chicago Manual of Style' },
          { value: 'google', label: 'Google Developer Style Guide' },
          { value: 'microsoft', label: 'Microsoft Writing Style Guide' },
          { value: 'custom', label: 'Custom style guide' }
        ],
        helpText: 'Which style guide to enforce'
      },
      {
        id: 'tone_preference',
        label: 'Preferred tone',
        type: 'select',
        defaultValue: 'professional',
        options: [
          { value: 'formal', label: 'Formal and academic' },
          { value: 'professional', label: 'Professional but accessible' },
          { value: 'friendly', label: 'Friendly and conversational' },
          { value: 'neutral', label: 'Neutral and objective' }
        ],
        helpText: 'Desired tone for the documentation'
      },
      {
        id: 'check_grammar',
        label: 'Check grammar and punctuation',
        type: 'boolean',
        defaultValue: true,
        helpText: 'Whether to review grammar and punctuation'
      },
      {
        id: 'check_terminology',
        label: 'Check terminology consistency',
        type: 'boolean',
        defaultValue: true,
        helpText: 'Whether to enforce consistent terminology'
      },
      {
        id: 'readability_level',
        label: 'Target readability level',
        type: 'select',
        defaultValue: 'professional',
        options: [
          { value: 'simple', label: 'Simple and clear' },
          { value: 'professional', label: 'Professional level' },
          { value: 'technical', label: 'Technical complexity acceptable' },
          { value: 'advanced', label: 'Advanced vocabulary acceptable' }
        ],
        helpText: 'Target reading complexity level'
      }
    ],
    promptTemplate: `You are an expert Style Editor specializing in {{style_guide}} style guide compliance.

Style guide: {{style_guide}}
Preferred tone: {{tone_preference}}
Target readability: {{readability_level}}

Review focus:
{{#check_grammar}}
- Grammar, spelling, and punctuation accuracy
{{/check_grammar}}
{{#check_terminology}}
- Terminology consistency throughout the document
{{/check_terminology}}
- Writing clarity and conciseness
- Tone consistency ({{tone_preference}})
- Adherence to {{style_guide}} guidelines

Your specialization is technical editing (grammar, spelling, punctuation, style, tone, voice, clarity, conciseness, terminology consistency, and adherence to technical writing best practices).

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards for your area of expertise and the provided guidance, and requires NO changes:

    CONTINUE

2. If the document requires revisions in your area of expertise or based on the provided guidance:

    REVISE: [Provide very specific, actionable feedback. Clearly state what needs to be changed and why, focusing ONLY on style, grammar, and readability improvements.]

Do not add any text other than specified.`,
    defaultSettings: {
      maxLoops: 2,
      timeout: 120
    }
  },
  {
    id: 'information-architect',
    name: 'Information Architect',
    description: 'Reviews document structure and information flow',
    category: 'reviewer',
    icon: '🏗️',
    fields: [
      {
        id: 'structure_focus',
        label: 'Structure focus areas',
        type: 'multiselect',
        required: true,
        defaultValue: ['logical_flow', 'heading_hierarchy'],
        options: [
          { value: 'logical_flow', label: 'Logical information flow' },
          { value: 'heading_hierarchy', label: 'Heading hierarchy and organization' },
          { value: 'content_grouping', label: 'Content grouping and sections' },
          { value: 'navigation', label: 'Navigation and cross-references' },
          { value: 'audience_alignment', label: 'Alignment with target audience' },
          { value: 'completeness', label: 'Information completeness' }
        ],
        helpText: 'Which structural aspects to focus on'
      },
      {
        id: 'doc_type_expertise',
        label: 'Document type expertise',
        type: 'multiselect',
        defaultValue: ['how_to', 'explanation'],
        options: [
          { value: 'how_to', label: 'How-to guides' },
          { value: 'tutorial', label: 'Tutorials' },
          { value: 'explanation', label: 'Explanation documents' },
          { value: 'reference', label: 'Reference documentation' },
          { value: 'api_docs', label: 'API documentation' },
          { value: 'troubleshooting', label: 'Troubleshooting guides' }
        ],
        helpText: 'Types of documents this architect specializes in'
      },
      {
        id: 'structure_strictness',
        label: 'Structure enforcement level',
        type: 'number',
        min: 1,
        max: 5,
        defaultValue: 3,
        helpText: 'How strictly to enforce structural requirements (1=flexible, 5=rigid)'
      },
      {
        id: 'require_examples',
        label: 'Require practical examples',
        type: 'boolean',
        defaultValue: true,
        helpText: 'Whether to require practical examples in appropriate sections'
      }
    ],
    promptTemplate: `You are an expert Information Architect specializing in {{doc_type_expertise}} documentation structure.

Structure focus areas: {{structure_focus}}
Document type expertise: {{doc_type_expertise}}
Structure strictness: {{structure_strictness}}/5
{{#require_examples}}
You should ensure practical examples are included where appropriate.
{{/require_examples}}

Your specialization is information architecture (structure, flow, logical organization, clarity of headings, content grouping, navigation, and overall coherence for the intended audience).

Review the document for:
{{#structure_focus}}
- {{.}}
{{/structure_focus}}

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards for your area of expertise and the provided guidance, and requires NO changes:

    CONTINUE

2. If the document requires revisions in your area of expertise or based on the provided guidance:

    REVISE: [Provide very specific, actionable feedback. Clearly state what needs to be changed and why, focusing ONLY on information architecture and document structure.]

Do not add any text other than specified.`,
    defaultSettings: {
      maxLoops: 2,
      timeout: 150
    }
  }
];