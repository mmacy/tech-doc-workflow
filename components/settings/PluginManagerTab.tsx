import React, { useState, useEffect } from 'react';
import { 
  PluginWorkflowProfile, 
  PluginRoleInstance, 
  RolePlugin,
  ConfigField 
} from '../../types/rolePlugin';
import { PluginManagerService } from '../../services/pluginManagerService';

interface PluginManagerTabProps {
  disabled?: boolean;
}

const PluginManagerTab: React.FC<PluginManagerTabProps> = ({ disabled = false }) => {
  const [profiles, setProfiles] = useState<PluginWorkflowProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PluginWorkflowProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<PluginWorkflowProfile | null>(null);
  const [editingRole, setEditingRole] = useState<PluginRoleInstance | null>(null);
  const [availablePlugins, setAvailablePlugins] = useState<RolePlugin[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPluginModal, setShowPluginModal] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<RolePlugin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  const service = PluginManagerService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const loadedProfiles = service.getAllProfiles();
      const plugins = service.getAllPlugins();
      
      setProfiles(loadedProfiles);
      setAvailablePlugins(plugins);
      
      if (!selectedProfile && loadedProfiles.length > 0) {
        setSelectedProfile(loadedProfiles[0]);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  };

  const handleCreateProfile = () => {
    const newProfile: PluginWorkflowProfile = {
      id: `plugin-profile-${Date.now()}`,
      name: 'New Plugin Workflow',
      description: 'Custom plugin-based workflow',
      version: '1.0.0',
      roles: [],
      executionOrder: [],
      globalSettings: {
        maxTotalIterations: 15,
        timeoutMinutes: 30,
        allowParallelExecution: false
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'User',
        tags: []
      }
    };
    setEditingProfile(newProfile);
  };

  const handleEditProfile = (profile: PluginWorkflowProfile) => {
    setEditingProfile({ ...profile });
  };

  const handleSaveProfile = () => {
    if (!editingProfile) return;

    try {
      if (profiles.some(p => p.id === editingProfile.id && p !== selectedProfile)) {
        service.addProfile(editingProfile);
        setSuccess('Profile created successfully');
      } else {
        service.updateProfile(editingProfile.id, editingProfile);
        setSuccess('Profile updated successfully');
      }
      
      loadData();
      setSelectedProfile(editingProfile);
      setEditingProfile(null);
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    try {
      service.deleteProfile(profileId);
      loadData();
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(profiles.find(p => p.id !== profileId) || null);
      }
      setSuccess('Profile deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  const handleAddRole = (plugin: RolePlugin) => {
    if (!editingProfile) return;

    const schema = plugin.getConfigSchema();
    const defaultConfig = schema.defaultValues || {};
    
    const newRole: PluginRoleInstance = {
      id: `role-${Date.now()}`,
      pluginId: plugin.metadata.id,
      name: plugin.metadata.name,
      description: plugin.metadata.description,
      config: defaultConfig,
      executionSettings: {
        enabled: true,
        timeout: 180,
        maxRetries: 1,
        maxLoops: plugin.metadata.category === 'reviewer' ? 2 : 1
      }
    };

    setEditingRole(newRole);
    setSelectedPlugin(plugin);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: PluginRoleInstance) => {
    const plugin = availablePlugins.find(p => p.metadata.id === role.pluginId);
    if (!plugin) return;

    setEditingRole({ ...role });
    setSelectedPlugin(plugin);
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    if (!editingProfile || !editingRole || !selectedPlugin) return;

    try {
      const validation = selectedPlugin.validateConfig(editingRole.config);
      if (!validation.isValid) {
        setError(`Role configuration errors: ${validation.errors?.join(', ')}`);
        return;
      }

      const existingIndex = editingProfile.roles.findIndex(r => r.id === editingRole.id);
      if (existingIndex >= 0) {
        editingProfile.roles[existingIndex] = editingRole;
      } else {
        editingProfile.roles.push(editingRole);
        editingProfile.executionOrder.push(editingRole.id);
      }

      setEditingProfile({ ...editingProfile });
      setShowRoleModal(false);
      setEditingRole(null);
      setSelectedPlugin(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    }
  };

  const handleRemoveRole = (roleId: string) => {
    if (!editingProfile) return;

    setEditingProfile({
      ...editingProfile,
      roles: editingProfile.roles.filter(r => r.id !== roleId),
      executionOrder: editingProfile.executionOrder.filter(id => id !== roleId)
    });
  };

  const renderConfigField = (field: ConfigField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            disabled={disabled}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={field.validation?.min}
            max={field.validation?.max}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            disabled={disabled}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="mr-2"
              disabled={disabled}
            />
            <span className="text-sm text-theme-secondary">Enable this option</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            disabled={disabled}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-1">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    if (e.target.checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter((v: any) => v !== option.value));
                    }
                  }}
                  className="mr-2"
                  disabled={disabled}
                />
                <span className="text-sm text-theme-primary">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return <div className="text-theme-error">Unsupported field type: {field.type}</div>;
    }
  };

  const handleExport = () => {
    const data = service.exportProfiles();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plugin-workflow-profiles-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      service.importProfiles(data);
      loadData();
      setShowImportModal(false);
      setImportData('');
      setSuccess('Profiles imported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import profiles');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'writer': return '✍️';
      case 'reviewer': return '🔍';
      case 'analyzer': return '📊';
      case 'processor': return '⚙️';
      default: return '🔧';
    }
  };

  if (editingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-theme-primary">
            {profiles.some(p => p.id === editingProfile.id) ? 'Edit' : 'Create'} Plugin Workflow
          </h3>
          <div className="space-x-2">
            <button
              onClick={handleSaveProfile}
              disabled={disabled || editingProfile.roles.length === 0}
              className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md disabled:opacity-50"
            >
              Save Workflow
            </button>
            <button
              onClick={() => setEditingProfile(null)}
              disabled={disabled}
              className="px-4 py-2 btn-theme-secondary rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-theme-error/10 border border-theme-error/30 p-3 rounded-md text-theme-error text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">Workflow name</label>
              <input
                type="text"
                value={editingProfile.name}
                onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">Description</label>
              <textarea
                value={editingProfile.description}
                onChange={(e) => setEditingProfile({ ...editingProfile, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary"
                disabled={disabled}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-theme-primary">Role instances</h4>
                <button
                  onClick={() => setShowPluginModal(true)}
                  disabled={disabled}
                  className="px-3 py-1 btn-theme-primary text-theme-primary-contrast text-sm rounded disabled:opacity-50"
                >
                  Add Role
                </button>
              </div>

              <div className="space-y-2">
                {editingProfile.roles.map((role) => {
                  const plugin = availablePlugins.find(p => p.metadata.id === role.pluginId);
                  return (
                    <div key={role.id} className="border border-theme rounded-md p-3 bg-theme-elevated">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-theme-primary">
                            {plugin?.metadata.icon || getCategoryIcon(plugin?.metadata.category || '')} {role.name}
                          </span>
                          <span className="text-sm text-theme-secondary ml-2">
                            ({plugin?.metadata.name})
                          </span>
                          <div className="text-xs text-theme-muted">
                            {role.executionSettings.enabled ? 'Enabled' : 'Disabled'}
                            {role.executionSettings.maxLoops && ` • Max loops: ${role.executionSettings.maxLoops}`}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditRole(role)}
                            disabled={disabled}
                            className="p-1 text-theme-accent hover:text-theme-accent-dark disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveRole(role.id)}
                            disabled={disabled}
                            className="p-1 text-theme-error hover:text-theme-error-dark disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {editingProfile.roles.length === 0 && (
                  <div className="text-center py-6 text-theme-secondary">
                    No roles added yet. Click "Add Role" to add plugin instances.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-theme-primary mb-2">Global settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Max total iterations</label>
                  <input
                    type="number"
                    value={editingProfile.globalSettings.maxTotalIterations || 15}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      globalSettings: {
                        ...editingProfile.globalSettings,
                        maxTotalIterations: parseInt(e.target.value) || 15
                      }
                    })}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="block text-sm text-theme-secondary mb-1">Timeout (minutes)</label>
                  <input
                    type="number"
                    value={editingProfile.globalSettings.timeoutMinutes || 30}
                    onChange={(e) => setEditingProfile({
                      ...editingProfile,
                      globalSettings: {
                        ...editingProfile.globalSettings,
                        timeoutMinutes: parseInt(e.target.value) || 30
                      }
                    })}
                    min="5"
                    max="120"
                    className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-theme-primary mb-2">Available plugins</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availablePlugins.map((plugin) => (
                  <div key={plugin.metadata.id} className="border border-theme rounded-md p-2 bg-theme-elevated">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-theme-primary text-sm">
                          {plugin.metadata.icon || getCategoryIcon(plugin.metadata.category)} {plugin.metadata.name}
                        </span>
                        <div className="text-xs text-theme-secondary">{plugin.metadata.description}</div>
                        <div className="text-xs text-theme-muted">
                          {plugin.metadata.category} • v{plugin.metadata.version}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plugin Selection Modal */}
        {showPluginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-theme-primary border border-theme rounded-lg p-6 w-full max-w-2xl">
              <h4 className="text-lg font-medium text-theme-primary mb-4">Select Plugin</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availablePlugins.map((plugin) => (
                  <div
                    key={plugin.metadata.id}
                    className="border border-theme rounded-md p-3 bg-theme-elevated cursor-pointer hover:border-theme-accent"
                    onClick={() => {
                      handleAddRole(plugin);
                      setShowPluginModal(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-theme-primary">
                          {plugin.metadata.icon || getCategoryIcon(plugin.metadata.category)} {plugin.metadata.name}
                        </span>
                        <div className="text-sm text-theme-secondary">{plugin.metadata.description}</div>
                        <div className="text-xs text-theme-muted">
                          {plugin.metadata.category} • v{plugin.metadata.version}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowPluginModal(false)}
                  className="px-4 py-2 btn-theme-secondary rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Configuration Modal */}
        {showRoleModal && editingRole && selectedPlugin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-theme-primary border border-theme rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-theme-primary">
                  Configure {selectedPlugin.metadata.name}
                </h4>
                <div className="space-x-2">
                  <button
                    onClick={handleSaveRole}
                    className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md"
                  >
                    Save Role
                  </button>
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 btn-theme-secondary rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-1">Role name</label>
                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary"
                  />
                </div>

                <div>
                  <h5 className="font-medium text-theme-primary mb-2">Execution settings</h5>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingRole.executionSettings.enabled}
                        onChange={(e) => setEditingRole({
                          ...editingRole,
                          executionSettings: {
                            ...editingRole.executionSettings,
                            enabled: e.target.checked
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-theme-primary">Enabled</span>
                    </label>

                    {selectedPlugin.metadata.category === 'reviewer' && (
                      <div>
                        <label className="block text-sm text-theme-secondary mb-1">Max loops</label>
                        <input
                          type="number"
                          value={editingRole.executionSettings.maxLoops || 2}
                          onChange={(e) => setEditingRole({
                            ...editingRole,
                            executionSettings: {
                              ...editingRole.executionSettings,
                              maxLoops: parseInt(e.target.value) || 2
                            }
                          })}
                          min="1"
                          max="10"
                          className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-theme-primary mb-2">Plugin configuration</h5>
                  <div className="space-y-3">
                    {selectedPlugin.getConfigSchema().fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-theme-primary mb-1">
                          {field.label}
                          {field.required && <span className="text-theme-error ml-1">*</span>}
                        </label>
                        {renderConfigField(
                          field,
                          editingRole.config[field.key],
                          (value) => setEditingRole({
                            ...editingRole,
                            config: {
                              ...editingRole.config,
                              [field.key]: value
                            }
                          })
                        )}
                        {field.description && (
                          <p className="text-xs text-theme-muted mt-1">{field.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-theme-primary">Plugin-based Workflow Manager</h3>
        <div className="space-x-2">
          <button
            onClick={handleCreateProfile}
            disabled={disabled}
            className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md disabled:opacity-50"
          >
            Create New Workflow
          </button>
          <button
            onClick={handleExport}
            disabled={disabled}
            className="px-4 py-2 btn-theme-secondary rounded-md disabled:opacity-50"
          >
            Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            disabled={disabled}
            className="px-4 py-2 btn-theme-secondary rounded-md disabled:opacity-50"
          >
            Import
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-theme-error/10 border border-theme-error/30 p-3 rounded-md text-theme-error text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-theme-success/10 border border-theme-success/30 p-3 rounded-md text-theme-success text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-theme-primary mb-3">Workflow Profiles</h4>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedProfile?.id === profile.id
                    ? 'border-theme-accent bg-theme-accent/10'
                    : 'border-theme bg-theme-elevated hover:border-theme-accent/50'
                }`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-theme-primary">{profile.name}</h5>
                    <p className="text-sm text-theme-secondary">{profile.description}</p>
                    <p className="text-xs text-theme-muted">{profile.roles.length} roles</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProfile(profile);
                      }}
                      disabled={disabled}
                      className="p-1 text-theme-accent hover:text-theme-accent-dark disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                      disabled={disabled || profiles.length <= 1}
                      className="p-1 text-theme-error hover:text-theme-error-dark disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedProfile && (
            <>
              <h4 className="font-medium text-theme-primary mb-3">Profile Details</h4>
              <div className="bg-theme-elevated border border-theme rounded-md p-4 space-y-4">
                <div>
                  <h5 className="font-medium text-theme-primary">{selectedProfile.name}</h5>
                  <p className="text-sm text-theme-secondary">{selectedProfile.description}</p>
                  <p className="text-xs text-theme-muted">Version: {selectedProfile.version}</p>
                </div>

                <div>
                  <h6 className="font-medium text-theme-primary mb-2">Plugin Roles ({selectedProfile.roles.length})</h6>
                  <div className="space-y-2">
                    {selectedProfile.roles.map((role) => {
                      const plugin = availablePlugins.find(p => p.metadata.id === role.pluginId);
                      return (
                        <div key={role.id} className="text-sm border border-theme rounded p-2">
                          <div className="font-medium text-theme-primary">
                            {plugin?.metadata.icon || getCategoryIcon(plugin?.metadata.category || '')} {role.name}
                          </div>
                          <div className="text-theme-secondary">{plugin?.metadata.name} v{plugin?.metadata.version}</div>
                          <div className="text-theme-muted">
                            {role.executionSettings.enabled ? 'Enabled' : 'Disabled'}
                            {role.executionSettings.maxLoops && ` • Max loops: ${role.executionSettings.maxLoops}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-theme-primary mb-2">Execution order</h6>
                  <div className="space-y-1">
                    {selectedProfile.executionOrder.map((roleId, index) => {
                      const role = selectedProfile.roles.find(r => r.id === roleId);
                      const plugin = availablePlugins.find(p => p.metadata.id === role?.pluginId);
                      return (
                        <div key={roleId} className="flex items-center text-sm">
                          <span className="w-6 h-6 bg-theme-accent text-theme-primary-contrast rounded-full flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                          <span>
                            {plugin?.metadata.icon || getCategoryIcon(plugin?.metadata.category || '')} {role?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-theme-primary border border-theme rounded-lg p-6 w-full max-w-2xl">
            <h4 className="text-lg font-medium text-theme-primary mb-4">Import Plugin Profiles</h4>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON data here..."
              rows={10}
              className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 btn-theme-secondary rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginManagerTab;