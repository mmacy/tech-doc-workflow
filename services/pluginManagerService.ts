import {
  RolePlugin,
  PluginWorkflowProfile,
  PluginRoleInstance,
  ExecutionContext,
  RoleExecutionResult,
  DEFAULT_PLUGINS,
  PLUGIN_WORKFLOW_PROFILES,
  ValidationResult
} from '../types/rolePlugin';

const STORAGE_KEY = 'tech-doc-workflow-plugin-profiles';
const PLUGINS_STORAGE_KEY = 'tech-doc-workflow-plugins';
const CURRENT_VERSION = '1.0.0';

export class PluginManagerService {
  private static instance: PluginManagerService;
  private plugins: Map<string, RolePlugin> = new Map();
  private profiles: PluginWorkflowProfile[] = [];

  private constructor() {
    this.initializeDefaultPlugins();
    this.loadProfiles();
  }

  static getInstance(): PluginManagerService {
    if (!PluginManagerService.instance) {
      PluginManagerService.instance = new PluginManagerService();
    }
    return PluginManagerService.instance;
  }

  private initializeDefaultPlugins(): void {
    DEFAULT_PLUGINS.forEach(plugin => {
      this.plugins.set(plugin.metadata.id, plugin);
    });
  }

  private loadProfiles(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.profiles = data.profiles || [];
      } else {
        this.profiles = [...PLUGIN_WORKFLOW_PROFILES];
        this.saveProfiles();
      }
    } catch (error) {
      console.warn('Failed to load plugin profiles from storage:', error);
      this.profiles = [...PLUGIN_WORKFLOW_PROFILES];
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
      console.error('Failed to save plugin profiles to storage:', error);
      throw new Error('Failed to save plugin profiles');
    }
  }

  // Plugin management
  registerPlugin(plugin: RolePlugin): void {
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Plugin with ID '${plugin.metadata.id}' already exists`);
    }

    this.validatePlugin(plugin);
    this.plugins.set(plugin.metadata.id, plugin);
    
    // Initialize plugin if it has an initialize method
    if (plugin.initialize) {
      plugin.initialize();
    }
  }

  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID '${pluginId}' not found`);
    }

    // Check if plugin is in use
    const isInUse = this.profiles.some(profile => 
      profile.roles.some(role => role.pluginId === pluginId)
    );
    
    if (isInUse) {
      throw new Error(`Cannot unregister plugin '${pluginId}' as it is currently in use`);
    }

    // Cleanup plugin if it has a destroy method
    if (plugin.destroy) {
      plugin.destroy();
    }

    this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): RolePlugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): RolePlugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByCategory(category: string): RolePlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => 
      plugin.metadata.category === category
    );
  }

  private validatePlugin(plugin: RolePlugin): void {
    if (!plugin.metadata.id || typeof plugin.metadata.id !== 'string') {
      throw new Error('Plugin must have a valid ID');
    }
    if (!plugin.metadata.name || typeof plugin.metadata.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }
    if (!plugin.metadata.version || typeof plugin.metadata.version !== 'string') {
      throw new Error('Plugin must have a valid version');
    }
    if (typeof plugin.execute !== 'function') {
      throw new Error('Plugin must implement execute method');
    }
    if (typeof plugin.getConfigSchema !== 'function') {
      throw new Error('Plugin must implement getConfigSchema method');
    }
    if (typeof plugin.validateConfig !== 'function') {
      throw new Error('Plugin must implement validateConfig method');
    }
  }

  // Profile management
  getAllProfiles(): PluginWorkflowProfile[] {
    return [...this.profiles];
  }

  getProfileById(id: string): PluginWorkflowProfile | undefined {
    return this.profiles.find(profile => profile.id === id);
  }

  addProfile(profile: PluginWorkflowProfile): void {
    this.validateProfile(profile);
    
    if (this.profiles.some(p => p.id === profile.id)) {
      throw new Error(`Profile with ID '${profile.id}' already exists`);
    }

    profile.metadata.updatedAt = new Date().toISOString();
    this.profiles.push(profile);
    this.saveProfiles();
  }

  updateProfile(id: string, updatedProfile: PluginWorkflowProfile): void {
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

  duplicateProfile(id: string): PluginWorkflowProfile {
    const original = this.getProfileById(id);
    if (!original) {
      throw new Error(`Profile with ID '${id}' not found`);
    }

    const duplicate: PluginWorkflowProfile = {
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

  private validateProfile(profile: PluginWorkflowProfile): void {
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
      if (!role.pluginId || typeof role.pluginId !== 'string') {
        throw new Error(`Role '${role.id}' must have a valid plugin ID`);
      }
      
      const plugin = this.getPlugin(role.pluginId);
      if (!plugin) {
        throw new Error(`Role '${role.id}' references unknown plugin: ${role.pluginId}`);
      }

      // Validate role configuration
      const validation = plugin.validateConfig(role.config);
      if (!validation.isValid) {
        throw new Error(`Role '${role.id}' configuration errors: ${validation.errors?.join(', ')}`);
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

    // Ensure at least one writer role exists
    const hasWriter = profile.roles.some(role => {
      const plugin = this.getPlugin(role.pluginId);
      return plugin?.metadata.category === 'writer';
    });
    if (!hasWriter) {
      throw new Error('Profile must have at least one writer role');
    }
  }

  // Workflow execution
  async executeWorkflow(
    profileId: string, 
    document: string, 
    sourceContent?: string, 
    supportingContent?: string
  ): Promise<{ success: boolean; finalDocument?: string; error?: string; logs: string[] }> {
    const profile = this.getProfileById(profileId);
    if (!profile) {
      return { success: false, error: `Profile '${profileId}' not found`, logs: [] };
    }

    const logs: string[] = [];
    let currentDocument = document;
    let totalIterations = 0;
    const maxIterations = profile.globalSettings.maxTotalIterations || 15;

    try {
      logs.push(`Starting workflow: ${profile.name}`);

      for (const roleId of profile.executionOrder) {
        const role = profile.roles.find(r => r.id === roleId);
        if (!role || !role.executionSettings.enabled) {
          logs.push(`Skipping disabled role: ${roleId}`);
          continue;
        }

        const plugin = this.getPlugin(role.pluginId);
        if (!plugin) {
          const error = `Plugin not found for role '${roleId}': ${role.pluginId}`;
          logs.push(error);
          return { success: false, error, logs };
        }

        logs.push(`Executing role: ${role.name} (${plugin.metadata.name})`);

        let roleIterations = 0;
        const maxRoleLoops = role.executionSettings.maxLoops || 1;

        while (roleIterations < maxRoleLoops && totalIterations < maxIterations) {
          const context: ExecutionContext = {
            roleId: role.id,
            document: currentDocument,
            sourceContent,
            supportingContent,
            iteration: roleIterations,
            globalSettings: profile.globalSettings
          };

          try {
            // Execute plugin hooks
            if (plugin.hooks?.onBeforeExecution) {
              await plugin.hooks.onBeforeExecution(context);
            }

            const result = await plugin.execute(context, role.config);

            // Execute post-execution hook
            if (plugin.hooks?.onAfterExecution) {
              await plugin.hooks.onAfterExecution(context, result);
            }

            logs.push(`Role result: ${result.type}${result.feedback ? ` - ${result.feedback.substring(0, 100)}...` : ''}`);

            switch (result.type) {
              case 'continue':
                if (result.data && typeof result.data === 'string') {
                  currentDocument = result.data;
                }
                logs.push(`Role '${role.name}' completed successfully`);
                break;

              case 'revise':
                if (result.data && typeof result.data === 'string') {
                  currentDocument = result.data;
                }
                roleIterations++;
                totalIterations++;
                logs.push(`Role '${role.name}' requested revision (iteration ${roleIterations})`);
                continue;

              case 'skip':
                logs.push(`Role '${role.name}' skipped`);
                break;

              case 'error':
                const error = `Role '${role.name}' failed: ${result.feedback || 'Unknown error'}`;
                logs.push(error);
                return { success: false, error, logs };

              default:
                const unknownError = `Role '${role.name}' returned unknown result type: ${result.type}`;
                logs.push(unknownError);
                return { success: false, error: unknownError, logs };
            }

            break; // Exit role loop on success/skip

          } catch (error) {
            const errorMsg = `Role '${role.name}' execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logs.push(errorMsg);

            // Execute error hook
            if (plugin.hooks?.onError && error instanceof Error) {
              await plugin.hooks.onError(context, error);
            }

            return { success: false, error: errorMsg, logs };
          }
        }

        if (roleIterations >= maxRoleLoops) {
          logs.push(`Role '${role.name}' reached maximum iterations (${maxRoleLoops})`);
        }
      }

      if (totalIterations >= maxIterations) {
        logs.push(`Workflow reached maximum total iterations (${maxIterations})`);
      }

      logs.push('Workflow completed successfully');
      return { success: true, finalDocument: currentDocument, logs };

    } catch (error) {
      const errorMsg = `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logs.push(errorMsg);
      return { success: false, error: errorMsg, logs };
    }
  }

  // Plugin development helpers
  validateRoleConfig(pluginId: string, config: any): ValidationResult {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      return { isValid: false, errors: [`Plugin '${pluginId}' not found`] };
    }

    return plugin.validateConfig(config);
  }

  getConfigSchemaForPlugin(pluginId: string) {
    const plugin = this.getPlugin(pluginId);
    return plugin?.getConfigSchema();
  }

  // Import/Export
  exportProfiles(): { version: string; profiles: PluginWorkflowProfile[] } {
    return {
      version: CURRENT_VERSION,
      profiles: this.profiles
    };
  }

  importProfiles(data: { version: string; profiles: PluginWorkflowProfile[] }): void {
    if (!data.profiles || !Array.isArray(data.profiles)) {
      throw new Error('Invalid import data format');
    }

    // Validate all profiles before importing
    data.profiles.forEach(profile => this.validateProfile(profile));

    this.profiles = data.profiles;
    this.saveProfiles();
  }

  resetToDefaults(): void {
    this.profiles = [...PLUGIN_WORKFLOW_PROFILES];
    this.saveProfiles();
  }

  // Plugin discovery and management
  installPluginFromDefinition(pluginDefinition: any): void {
    // This would be used to install plugins from external sources
    // For now, we only support built-in plugins
    throw new Error('External plugin installation not yet implemented');
  }

  getPluginDependencies(pluginId: string): string[] {
    const plugin = this.getPlugin(pluginId);
    return plugin?.metadata.dependencies || [];
  }

  checkPluginCompatibility(pluginId: string, targetVersion: string): boolean {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) return false;

    const compatibleVersions = plugin.metadata.compatibleVersions;
    if (!compatibleVersions) return true; // No restrictions

    return compatibleVersions.includes(targetVersion);
  }
}