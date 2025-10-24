import { 
  RoleTypeSchema, 
  ConfigurableRole, 
  WorkflowSchemaProfile, 
  ROLE_TYPE_SCHEMAS,
  RoleFieldSchema 
} from '../types/roleSchema';

const STORAGE_KEY = 'tech-doc-workflow-schema-profiles';
const CURRENT_VERSION = '1.0.0';

export class RoleSchemaService {
  private static instance: RoleSchemaService;
  private profiles: WorkflowSchemaProfile[] = [];

  private constructor() {
    this.loadProfiles();
  }

  static getInstance(): RoleSchemaService {
    if (!RoleSchemaService.instance) {
      RoleSchemaService.instance = new RoleSchemaService();
    }
    return RoleSchemaService.instance;
  }

  private loadProfiles(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.profiles = data.profiles || [];
      } else {
        // Create default profile
        this.profiles = [this.createDefaultProfile()];
        this.saveProfiles();
      }
    } catch (error) {
      console.warn('Failed to load schema profiles from storage:', error);
      this.profiles = [this.createDefaultProfile()];
    }
  }

  private saveProfiles(): void {
    try {
      const data = {
        version: CURRENT_VERSION,
        profiles: this.profiles
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save schema profiles to storage:', error);
      throw new Error('Failed to save workflow profiles');
    }
  }

  private createDefaultProfile(): WorkflowSchemaProfile {
    const now = new Date().toISOString();
    
    return {
      id: 'default-technical-docs',
      name: 'Technical Documentation Standard',
      description: 'Standard workflow for technical documentation with configurable roles',
      version: '1.0.0',
      roles: [
        {
          id: 'writer-1',
          typeId: 'technical-writer',
          name: 'Technical Writer',
          description: 'Primary documentation writer',
          configuration: {
            writing_style: 'professional',
            target_audience: 'developers',
            include_examples: true,
            complexity_level: 3,
            custom_instructions: ''
          },
          executionSettings: {
            enabled: true,
            timeout: 300,
            retryCount: 2
          }
        },
        {
          id: 'reviewer-1',
          typeId: 'technical-reviewer',
          name: 'Technical Reviewer',
          description: 'Reviews technical accuracy',
          configuration: {
            review_focus: ['accuracy', 'completeness'],
            expertise_level: 'senior',
            strictness_level: 3,
            must_verify_code: true,
            review_checklist: ''
          },
          executionSettings: {
            enabled: true,
            maxLoops: 3,
            timeout: 180,
            retryCount: 1
          }
        },
        {
          id: 'architect-1',
          typeId: 'information-architect',
          name: 'Information Architect',
          description: 'Reviews document structure and flow',
          configuration: {
            structure_focus: ['logical_flow', 'heading_hierarchy'],
            doc_type_expertise: ['how_to', 'explanation'],
            structure_strictness: 3,
            require_examples: true
          },
          executionSettings: {
            enabled: true,
            maxLoops: 2,
            timeout: 150,
            retryCount: 1
          }
        },
        {
          id: 'editor-1',
          typeId: 'style-editor',
          name: 'Style Editor',
          description: 'Reviews writing style and clarity',
          configuration: {
            style_guide: 'technical',
            tone_preference: 'professional',
            check_grammar: true,
            check_terminology: true,
            readability_level: 'professional'
          },
          executionSettings: {
            enabled: true,
            maxLoops: 2,
            timeout: 120,
            retryCount: 1
          }
        }
      ],
      executionOrder: ['writer-1', 'reviewer-1', 'architect-1', 'editor-1'],
      globalSettings: {
        maxTotalIterations: 15,
        timeoutMinutes: 30,
        allowParallelReviews: false
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        author: 'System',
        tags: ['default', 'technical-docs']
      }
    };
  }

  getAllProfiles(): WorkflowSchemaProfile[] {
    return [...this.profiles];
  }

  getProfileById(id: string): WorkflowSchemaProfile | undefined {
    return this.profiles.find(profile => profile.id === id);
  }

  getRoleTypeSchemas(): RoleTypeSchema[] {
    return [...ROLE_TYPE_SCHEMAS];
  }

  getRoleTypeSchema(typeId: string): RoleTypeSchema | undefined {
    return ROLE_TYPE_SCHEMAS.find(schema => schema.id === typeId);
  }

  generatePromptForRole(role: ConfigurableRole): string {
    const schema = this.getRoleTypeSchema(role.typeId);
    if (!schema) {
      throw new Error(`Role type schema not found: ${role.typeId}`);
    }

    let prompt = schema.promptTemplate;
    
    // Simple template replacement - replace {{field_id}} with values
    Object.entries(role.configuration).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle different value types
        let replacement = '';
        if (typeof value === 'boolean') {
          // For boolean fields, use conditional blocks
          const positivePattern = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
          const negativePattern = new RegExp(`{{\\^${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
          
          if (value) {
            prompt = prompt.replace(positivePattern, '$1');
            prompt = prompt.replace(negativePattern, '');
          } else {
            prompt = prompt.replace(positivePattern, '');
            prompt = prompt.replace(negativePattern, '$1');
          }
        } else if (Array.isArray(value)) {
          replacement = value.join(', ');
        } else {
          replacement = String(value);
        }
        
        // Replace simple {{field_id}} patterns
        const pattern = new RegExp(`{{${key}}}`, 'g');
        prompt = prompt.replace(pattern, replacement);
      }
    });

    // Clean up any remaining template syntax
    prompt = prompt.replace(/{{#\w+}}[\s\S]*?{{\/\w+}}/g, '');
    prompt = prompt.replace(/{{[\^#\/]\w+}}/g, '');
    prompt = prompt.replace(/{{[\w_]+}}/g, '');

    return prompt.trim();
  }

  validateRoleConfiguration(typeId: string, configuration: Record<string, any>): { isValid: boolean; errors: string[] } {
    const schema = this.getRoleTypeSchema(typeId);
    if (!schema) {
      return { isValid: false, errors: [`Unknown role type: ${typeId}`] };
    }

    const errors: string[] = [];

    schema.fields.forEach(field => {
      const value = configuration[field.id];
      
      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field.label}' is required`);
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        // Type validation
        switch (field.type) {
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`Field '${field.label}' must be a number`);
            } else {
              if (field.min !== undefined && value < field.min) {
                errors.push(`Field '${field.label}' must be at least ${field.min}`);
              }
              if (field.max !== undefined && value > field.max) {
                errors.push(`Field '${field.label}' must be at most ${field.max}`);
              }
            }
            break;
            
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Field '${field.label}' must be true or false`);
            }
            break;
            
          case 'select':
            if (field.options && !field.options.some(opt => opt.value === value)) {
              errors.push(`Field '${field.label}' must be one of: ${field.options.map(o => o.label).join(', ')}`);
            }
            break;
            
          case 'multiselect':
            if (!Array.isArray(value)) {
              errors.push(`Field '${field.label}' must be an array`);
            } else if (field.options) {
              const validValues = field.options.map(opt => opt.value);
              const invalidValues = value.filter(v => !validValues.includes(v));
              if (invalidValues.length > 0) {
                errors.push(`Field '${field.label}' contains invalid values: ${invalidValues.join(', ')}`);
              }
            }
            break;
            
          case 'text':
          case 'textarea':
            if (typeof value !== 'string') {
              errors.push(`Field '${field.label}' must be text`);
            } else if (field.validation) {
              if (field.validation.minLength && value.length < field.validation.minLength) {
                errors.push(`Field '${field.label}' must be at least ${field.validation.minLength} characters`);
              }
              if (field.validation.maxLength && value.length > field.validation.maxLength) {
                errors.push(`Field '${field.label}' must be at most ${field.validation.maxLength} characters`);
              }
              if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
                errors.push(`Field '${field.label}' ${field.validation.message || 'format is invalid'}`);
              }
            }
            break;
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  addProfile(profile: WorkflowSchemaProfile): void {
    this.validateProfile(profile);
    
    if (this.profiles.some(p => p.id === profile.id)) {
      throw new Error(`Profile with ID '${profile.id}' already exists`);
    }

    profile.metadata.updatedAt = new Date().toISOString();
    this.profiles.push(profile);
    this.saveProfiles();
  }

  updateProfile(id: string, updatedProfile: WorkflowSchemaProfile): void {
    this.validateProfile(updatedProfile);
    
    const index = this.profiles.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Profile with ID '${id}' not found`);
    }

    if (updatedProfile.id !== id && this.profiles.some(p => p.id === updatedProfile.id)) {
      throw new Error(`Profile with ID '${updatedProfile.id}' already exists`);
    }

    updatedProfile.metadata.updatedAt = new Date().toISOString();
    this.profiles[index] = updatedProfile;
    this.saveProfiles();
  }

  deleteProfile(id: string): void {
    const index = this.profiles.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Profile with ID '${id}' not found`);
    }

    if (this.profiles.length <= 1) {
      throw new Error('Cannot delete the last workflow profile');
    }

    this.profiles.splice(index, 1);
    this.saveProfiles();
  }

  duplicateProfile(id: string): WorkflowSchemaProfile {
    const original = this.getProfileById(id);
    if (!original) {
      throw new Error(`Profile with ID '${id}' not found`);
    }

    const duplicate: WorkflowSchemaProfile = {
      ...original,
      id: `${original.id}-copy-${Date.now()}`,
      name: `${original.name} (Copy)`,
      metadata: {
        ...original.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    this.addProfile(duplicate);
    return duplicate;
  }

  private validateProfile(profile: WorkflowSchemaProfile): void {
    if (!profile.id || typeof profile.id !== 'string') {
      throw new Error('Profile must have a valid ID');
    }
    if (!profile.name || typeof profile.name !== 'string') {
      throw new Error('Profile must have a valid name');
    }
    if (!profile.roles || !Array.isArray(profile.roles) || profile.roles.length === 0) {
      throw new Error('Profile must have at least one role');
    }

    // Validate roles
    profile.roles.forEach((role, index) => {
      if (!role.id || typeof role.id !== 'string') {
        throw new Error(`Role at index ${index} must have a valid ID`);
      }
      if (!role.typeId || typeof role.typeId !== 'string') {
        throw new Error(`Role '${role.id}' must have a valid type ID`);
      }
      if (!this.getRoleTypeSchema(role.typeId)) {
        throw new Error(`Role '${role.id}' references unknown type: ${role.typeId}`);
      }

      // Validate role configuration
      const validation = this.validateRoleConfiguration(role.typeId, role.configuration);
      if (!validation.isValid) {
        throw new Error(`Role '${role.id}' configuration errors: ${validation.errors.join(', ')}`);
      }
    });

    // Validate execution order
    if (!profile.executionOrder || !Array.isArray(profile.executionOrder)) {
      throw new Error('Profile must have execution order defined');
    }

    profile.executionOrder.forEach(roleId => {
      if (!profile.roles.some(role => role.id === roleId)) {
        throw new Error(`Execution order references non-existent role: ${roleId}`);
      }
    });

    // Ensure at least one writer role
    const hasWriter = profile.roles.some(role => {
      const schema = this.getRoleTypeSchema(role.typeId);
      return schema?.category === 'writer';
    });
    if (!hasWriter) {
      throw new Error('Profile must have at least one writer role');
    }
  }

  exportProfiles(): { version: string; profiles: WorkflowSchemaProfile[] } {
    return {
      version: CURRENT_VERSION,
      profiles: this.profiles
    };
  }

  importProfiles(data: { version: string; profiles: WorkflowSchemaProfile[] }): void {
    if (!data.profiles || !Array.isArray(data.profiles)) {
      throw new Error('Invalid import data format');
    }

    // Validate all profiles before importing
    data.profiles.forEach(profile => this.validateProfile(profile));

    this.profiles = data.profiles;
    this.saveProfiles();
  }

  resetToDefaults(): void {
    this.profiles = [this.createDefaultProfile()];
    this.saveProfiles();
  }
}