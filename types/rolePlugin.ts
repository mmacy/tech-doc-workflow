// Plugin-style modular role system
export interface RolePluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  category: 'writer' | 'reviewer' | 'analyzer' | 'processor' | 'custom';
  icon?: string;
  tags?: string[];
  dependencies?: string[];
  compatibleVersions?: string[];
}

export interface RolePluginConfig {
  [key: string]: any;
}

export interface RolePluginHooks {
  onBeforeExecution?: (context: ExecutionContext) => Promise<void> | void;
  onAfterExecution?: (context: ExecutionContext, result: any) => Promise<void> | void;
  onError?: (context: ExecutionContext, error: Error) => Promise<void> | void;
  onValidateConfig?: (config: RolePluginConfig) => ValidationResult;
}

export interface ExecutionContext {
  roleId: string;
  document: string;
  sourceContent?: string;
  supportingContent?: string;
  iteration: number;
  previousResults?: any[];
  globalSettings?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface RolePlugin {
  metadata: RolePluginMetadata;
  
  // Core execution method
  execute(context: ExecutionContext, config: RolePluginConfig): Promise<RoleExecutionResult>;
  
  // Configuration schema
  getConfigSchema(): RolePluginConfigSchema;
  
  // Validation
  validateConfig(config: RolePluginConfig): ValidationResult;
  
  // Optional hooks
  hooks?: RolePluginHooks;
  
  // Initialization and cleanup
  initialize?(globalConfig?: Record<string, any>): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export interface RolePluginConfigSchema {
  fields: ConfigField[];
  defaultValues?: Record<string, any>;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'object';
  required?: boolean;
  defaultValue?: any;
  description?: string;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  conditional?: {
    dependsOn: string;
    value: any;
  };
}

export interface RoleExecutionResult {
  type: 'continue' | 'revise' | 'error' | 'skip';
  data?: any;
  feedback?: string;
  metadata?: Record<string, any>;
}

export interface PluginWorkflowProfile {
  id: string;
  name: string;
  description: string;
  version: string;
  roles: PluginRoleInstance[];
  executionOrder: string[];
  globalSettings: Record<string, any>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    tags?: string[];
  };
}

export interface PluginRoleInstance {
  id: string;
  pluginId: string;
  name: string;
  description?: string;
  config: RolePluginConfig;
  executionSettings: {
    enabled: boolean;
    maxRetries?: number;
    timeout?: number;
    maxLoops?: number;
    priority?: number;
  };
}

// Built-in plugin implementations
export class TechnicalWriterPlugin implements RolePlugin {
  metadata: RolePluginMetadata = {
    id: 'technical-writer-core',
    name: 'Technical Writer',
    version: '1.0.0',
    description: 'Core technical writing plugin for creating and revising documentation',
    author: 'System',
    category: 'writer',
    icon: '✍️',
    tags: ['writing', 'documentation', 'core']
  };

  getConfigSchema(): RolePluginConfigSchema {
    return {
      fields: [
        {
          key: 'writingStyle',
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
          description: 'Choose the tone and style for the writing'
        },
        {
          key: 'targetAudience',
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
          description: 'Primary audience for the documentation'
        },
        {
          key: 'includeExamples',
          label: 'Include code examples',
          type: 'boolean',
          defaultValue: true,
          description: 'Whether to include practical code examples'
        },
        {
          key: 'complexityLevel',
          label: 'Complexity level',
          type: 'number',
          defaultValue: 3,
          validation: { min: 1, max: 5 },
          description: 'Technical complexity level (1=basic, 5=advanced)'
        },
        {
          key: 'customInstructions',
          label: 'Custom instructions',
          type: 'textarea',
          description: 'Additional specific instructions for this writer'
        }
      ],
      defaultValues: {
        writingStyle: 'professional',
        targetAudience: 'developers',
        includeExamples: true,
        complexityLevel: 3
      }
    };
  }

  validateConfig(config: RolePluginConfig): ValidationResult {
    const errors: string[] = [];
    
    if (!config.writingStyle) {
      errors.push('Writing style is required');
    }
    if (!config.targetAudience) {
      errors.push('Target audience is required');
    }
    if (config.complexityLevel && (config.complexityLevel < 1 || config.complexityLevel > 5)) {
      errors.push('Complexity level must be between 1 and 5');
    }

    return { isValid: errors.length === 0, errors };
  }

  async execute(context: ExecutionContext, config: RolePluginConfig): Promise<RoleExecutionResult> {
    // This would integrate with the actual LLM service
    const prompt = this.generatePrompt(context, config);
    
    // Simulate LLM call (would be replaced with actual service call)
    try {
      // const result = await callLLMTextGeneration(prompt);
      // For demo purposes, return a mock result
      return {
        type: 'continue',
        data: `Generated document using ${config.writingStyle} style for ${config.targetAudience}`,
        metadata: {
          prompt: prompt,
          config: config
        }
      };
    } catch (error) {
      return {
        type: 'error',
        feedback: `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generatePrompt(context: ExecutionContext, config: RolePluginConfig): string {
    return `You are an expert Technical Writer creating ${config.writingStyle} documentation for ${config.targetAudience}.

Target audience: ${config.targetAudience}
Writing style: ${config.writingStyle}
Complexity level: ${config.complexityLevel}/5
${config.includeExamples ? 'Include practical code examples and demonstrations.' : ''}
${config.customInstructions ? `\nAdditional instructions:\n${config.customInstructions}` : ''}

Your task is to create clear, comprehensive technical documentation that serves the needs of your target audience.

Document to work with:
${context.document}

${context.sourceContent ? `Source content:\n${context.sourceContent}` : ''}
${context.supportingContent ? `Supporting content:\n${context.supportingContent}` : ''}`;
  }
}

export class TechnicalReviewerPlugin implements RolePlugin {
  metadata: RolePluginMetadata = {
    id: 'technical-reviewer-core',
    name: 'Technical Reviewer',
    version: '1.0.0',
    description: 'Core technical review plugin for accuracy and completeness validation',
    author: 'System',
    category: 'reviewer',
    icon: '🔍',
    tags: ['review', 'accuracy', 'validation', 'core']
  };

  getConfigSchema(): RolePluginConfigSchema {
    return {
      fields: [
        {
          key: 'reviewFocus',
          label: 'Review focus areas',
          type: 'multiselect',
          required: true,
          defaultValue: ['accuracy', 'completeness'],
          options: [
            { value: 'accuracy', label: 'Technical accuracy' },
            { value: 'completeness', label: 'Completeness of information' },
            { value: 'codeQuality', label: 'Code example quality' },
            { value: 'security', label: 'Security considerations' },
            { value: 'performance', label: 'Performance implications' },
            { value: 'bestPractices', label: 'Best practices adherence' }
          ],
          description: 'Select which aspects to focus on during review'
        },
        {
          key: 'expertiseLevel',
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
          description: 'Level of technical expertise for this reviewer'
        },
        {
          key: 'strictnessLevel',
          label: 'Review strictness',
          type: 'number',
          defaultValue: 3,
          validation: { min: 1, max: 5 },
          description: 'How strict should the review be (1=lenient, 5=very strict)'
        },
        {
          key: 'mustVerifyCode',
          label: 'Must verify all code examples',
          type: 'boolean',
          defaultValue: true,
          description: 'Require verification of all code examples against source'
        }
      ]
    };
  }

  validateConfig(config: RolePluginConfig): ValidationResult {
    const errors: string[] = [];
    
    if (!config.reviewFocus || !Array.isArray(config.reviewFocus) || config.reviewFocus.length === 0) {
      errors.push('At least one review focus area must be selected');
    }
    if (!config.expertiseLevel) {
      errors.push('Expertise level is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  async execute(context: ExecutionContext, config: RolePluginConfig): Promise<RoleExecutionResult> {
    const prompt = this.generateReviewPrompt(context, config);
    
    try {
      // Simulate review decision (would be replaced with actual LLM service call)
      // const decision = await callLLMReview(prompt);
      
      // For demo purposes, simulate a review decision
      const needsRevision = Math.random() > 0.7; // 30% chance of needing revision
      
      if (needsRevision) {
        return {
          type: 'revise',
          feedback: `Technical review found issues in ${config.reviewFocus.join(', ')} areas. Please address the following concerns...`,
          metadata: {
            reviewFocus: config.reviewFocus,
            expertiseLevel: config.expertiseLevel,
            iteration: context.iteration
          }
        };
      } else {
        return {
          type: 'continue',
          data: 'Technical review passed',
          metadata: {
            reviewFocus: config.reviewFocus,
            expertiseLevel: config.expertiseLevel
          }
        };
      }
    } catch (error) {
      return {
        type: 'error',
        feedback: `Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateReviewPrompt(context: ExecutionContext, config: RolePluginConfig): string {
    return `You are a ${config.expertiseLevel} Technical Reviewer with expertise in technical documentation review.

Review focus areas: ${config.reviewFocus.join(', ')}
Expertise level: ${config.expertiseLevel}
Review strictness: ${config.strictnessLevel}/5
${config.mustVerifyCode ? 'CRITICAL: You must verify all code examples against the provided source code.' : ''}

Document to review:
${context.document}

${context.sourceContent ? `Source content for verification:\n${context.sourceContent}` : ''}

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards: CONTINUE

2. If the document requires revisions: REVISE: [Provide specific feedback]`;
  }
}

// Default plugin registry
export const DEFAULT_PLUGINS: RolePlugin[] = [
  new TechnicalWriterPlugin(),
  new TechnicalReviewerPlugin()
];

export const PLUGIN_WORKFLOW_PROFILES: PluginWorkflowProfile[] = [
  {
    id: 'default-plugin-workflow',
    name: 'Default Plugin Workflow',
    description: 'Standard workflow using core plugins',
    version: '1.0.0',
    roles: [
      {
        id: 'writer-1',
        pluginId: 'technical-writer-core',
        name: 'Technical Writer',
        description: 'Primary documentation writer',
        config: {
          writingStyle: 'professional',
          targetAudience: 'developers',
          includeExamples: true,
          complexityLevel: 3,
          customInstructions: ''
        },
        executionSettings: {
          enabled: true,
          timeout: 300,
          maxRetries: 2
        }
      },
      {
        id: 'reviewer-1',
        pluginId: 'technical-reviewer-core',
        name: 'Technical Reviewer',
        description: 'Reviews technical accuracy',
        config: {
          reviewFocus: ['accuracy', 'completeness'],
          expertiseLevel: 'senior',
          strictnessLevel: 3,
          mustVerifyCode: true
        },
        executionSettings: {
          enabled: true,
          maxLoops: 3,
          timeout: 180,
          maxRetries: 1
        }
      }
    ],
    executionOrder: ['writer-1', 'reviewer-1'],
    globalSettings: {
      maxTotalIterations: 15,
      timeoutMinutes: 30,
      allowParallelExecution: false
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'System',
      tags: ['default', 'plugin-based']
    }
  }
];