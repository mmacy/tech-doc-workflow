import { WorkflowProfile, WorkflowProfileCollection, DEFAULT_WORKFLOW_PROFILES } from '../types/workflow';

const STORAGE_KEY = 'tech-doc-workflow-profiles';
const CURRENT_VERSION = '1.0.0';

export class WorkflowProfileService {
  private static instance: WorkflowProfileService;
  private profiles: WorkflowProfile[] = [];

  private constructor() {
    this.loadProfiles();
  }

  static getInstance(): WorkflowProfileService {
    if (!WorkflowProfileService.instance) {
      WorkflowProfileService.instance = new WorkflowProfileService();
    }
    return WorkflowProfileService.instance;
  }

  private loadProfiles(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const collection: WorkflowProfileCollection = JSON.parse(stored);
        this.profiles = collection.profiles || [];
      } else {
        // First time - load defaults
        this.profiles = [...DEFAULT_WORKFLOW_PROFILES];
        this.saveProfiles();
      }
    } catch (error) {
      console.warn('Failed to load workflow profiles from storage:', error);
      this.profiles = [...DEFAULT_WORKFLOW_PROFILES];
    }
  }

  private saveProfiles(): void {
    try {
      const collection: WorkflowProfileCollection = {
        version: CURRENT_VERSION,
        profiles: this.profiles,
        defaultProfileId: this.profiles[0]?.id
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection, null, 2));
    } catch (error) {
      console.error('Failed to save workflow profiles to storage:', error);
      throw new Error('Failed to save workflow profiles');
    }
  }

  getAllProfiles(): WorkflowProfile[] {
    return [...this.profiles];
  }

  getProfileById(id: string): WorkflowProfile | undefined {
    return this.profiles.find(profile => profile.id === id);
  }

  addProfile(profile: WorkflowProfile): void {
    // Validate profile
    this.validateProfile(profile);
    
    // Check for duplicate IDs
    if (this.profiles.some(p => p.id === profile.id)) {
      throw new Error(`Profile with ID '${profile.id}' already exists`);
    }

    this.profiles.push(profile);
    this.saveProfiles();
  }

  updateProfile(id: string, updatedProfile: WorkflowProfile): void {
    this.validateProfile(updatedProfile);
    
    const index = this.profiles.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Profile with ID '${id}' not found`);
    }

    if (updatedProfile.id !== id && this.profiles.some(p => p.id === updatedProfile.id)) {
      throw new Error(`Profile with ID '${updatedProfile.id}' already exists`);
    }

    this.profiles[index] = updatedProfile;
    this.saveProfiles();
  }

  deleteProfile(id: string): void {
    const index = this.profiles.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Profile with ID '${id}' not found`);
    }

    this.profiles.splice(index, 1);
    this.saveProfiles();
  }

  importProfiles(collection: WorkflowProfileCollection): void {
    if (!collection.profiles || !Array.isArray(collection.profiles)) {
      throw new Error('Invalid profile collection format');
    }

    // Validate all profiles before importing
    collection.profiles.forEach(profile => this.validateProfile(profile));

    this.profiles = collection.profiles;
    this.saveProfiles();
  }

  exportProfiles(): WorkflowProfileCollection {
    return {
      version: CURRENT_VERSION,
      profiles: this.profiles,
      defaultProfileId: this.profiles[0]?.id
    };
  }

  resetToDefaults(): void {
    this.profiles = [...DEFAULT_WORKFLOW_PROFILES];
    this.saveProfiles();
  }

  private validateProfile(profile: WorkflowProfile): void {
    if (!profile.id || typeof profile.id !== 'string') {
      throw new Error('Profile must have a valid ID');
    }
    if (!profile.name || typeof profile.name !== 'string') {
      throw new Error('Profile must have a valid name');
    }
    if (!profile.roles || !Array.isArray(profile.roles) || profile.roles.length === 0) {
      throw new Error('Profile must have at least one role');
    }
    if (!profile.executionOrder || !Array.isArray(profile.executionOrder) || profile.executionOrder.length === 0) {
      throw new Error('Profile must have execution order defined');
    }

    // Validate roles
    profile.roles.forEach((role, index) => {
      if (!role.id || typeof role.id !== 'string') {
        throw new Error(`Role at index ${index} must have a valid ID`);
      }
      if (!role.name || typeof role.name !== 'string') {
        throw new Error(`Role '${role.id}' must have a valid name`);
      }
      if (!role.type || !['writer', 'reviewer'].includes(role.type)) {
        throw new Error(`Role '${role.id}' must have type 'writer' or 'reviewer'`);
      }
      if (!role.systemPrompt || typeof role.systemPrompt !== 'string') {
        throw new Error(`Role '${role.id}' must have a system prompt`);
      }
    });

    // Validate execution order references existing roles
    profile.executionOrder.forEach(roleId => {
      if (!profile.roles.some(role => role.id === roleId)) {
        throw new Error(`Execution order references non-existent role: ${roleId}`);
      }
    });

    // Ensure at least one writer role exists
    const hasWriter = profile.roles.some(role => role.type === 'writer');
    if (!hasWriter) {
      throw new Error('Profile must have at least one writer role');
    }
  }
}