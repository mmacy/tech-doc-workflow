import React, { useState, useEffect } from 'react';
import { 
  WorkflowSchemaProfile, 
  ConfigurableRole, 
  RoleTypeSchema, 
  RoleFieldSchema 
} from '../../types/roleSchema';
import { RoleSchemaService } from '../../services/roleSchemaService';

interface RoleBuilderTabProps {
  disabled?: boolean;
}

const RoleBuilderTab: React.FC<RoleBuilderTabProps> = ({ disabled = false }) => {
  const [profiles, setProfiles] = useState<WorkflowSchemaProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<WorkflowSchemaProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<WorkflowSchemaProfile | null>(null);
  const [editingRole, setEditingRole] = useState<ConfigurableRole | null>(null);
  const [roleTypeSchemas] = useState<RoleTypeSchema[]>(() => 
    RoleSchemaService.getInstance().getRoleTypeSchemas()
  );
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  const service = RoleSchemaService.getInstance();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    try {
      const loadedProfiles = service.getAllProfiles();
      setProfiles(loadedProfiles);
      if (!selectedProfile && loadedProfiles.length > 0) {
        setSelectedProfile(loadedProfiles[0]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    }
  };

  const handleCreateProfile = () => {
    const newProfile: WorkflowSchemaProfile = {
      id: `profile-${Date.now()}`,
      name: 'New Workflow Profile',
      description: 'Custom workflow profile',
      version: '1.0.0',
      roles: [],
      executionOrder: [],
      globalSettings: {
        maxTotalIterations: 15,
        timeoutMinutes: 30,
        allowParallelReviews: false
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

  const handleEditProfile = (profile: WorkflowSchemaProfile) => {
    setEditingProfile({ ...profile });
  };

  const handleSaveProfile = () => {
    if (!editingProfile) return;

    try {
      if (profiles.some(p => p.id === editingProfile.id && p !== selectedProfile)) {
        service.addProfile(editingProfile);
      } else {
        service.updateProfile(editingProfile.id, editingProfile);
      }
      loadProfiles();
      setSelectedProfile(editingProfile);
      setEditingProfile(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    try {
      service.deleteProfile(profileId);
      loadProfiles();
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(profiles.find(p => p.id !== profileId) || null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  const handleAddRole = (typeId: string) => {
    if (!editingProfile) return;

    const schema = roleTypeSchemas.find(s => s.id === typeId);
    if (!schema) return;

    const newRole: ConfigurableRole = {
      id: `role-${Date.now()}`,
      typeId,
      name: schema.name,
      description: schema.description,
      configuration: getDefaultConfiguration(schema),
      executionSettings: {
        enabled: true,
        ...(schema.defaultSettings || {}),
        maxLoops: schema.category === 'reviewer' ? 2 : undefined
      }
    };

    setEditingRole(newRole);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: ConfigurableRole) => {
    setEditingRole({ ...role });
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    if (!editingProfile || !editingRole) return;

    try {
      const validation = service.validateRoleConfiguration(editingRole.typeId, editingRole.configuration);
      if (!validation.isValid) {
        setError(`Role configuration errors: ${validation.errors.join(', ')}`);
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

  const getDefaultConfiguration = (schema: RoleTypeSchema): Record<string, any> => {
    const config: Record<string, any> = {};
    schema.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        config[field.id] = field.defaultValue;
      }
    });
    return config;
  };

  const renderRoleField = (field: RoleFieldSchema, value: any, onChange: (value: any) => void) => {
    const fieldId = `field-${field.id}`;

    switch (field.type) {
      case 'text':
        return (
          <input
            id={fieldId}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            disabled={disabled}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            disabled={disabled}
          />
        );

      case 'number':
        return (
          <input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            className="w-full px-3 py-2 border border-theme rounded-md bg-theme-elevated text-theme-primary text-sm"
            disabled={disabled}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              id={fieldId}
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
            id={fieldId}
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
                      onChange(currentValues.filter((v: string) => v !== option.value));
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
    a.download = `workflow-schema-profiles-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      service.importProfiles(data);
      loadProfiles();
      setShowImportModal(false);
      setImportData('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import profiles');
    }
  };

  if (editingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-theme-primary">
            {profiles.some(p => p.id === editingProfile.id) ? 'Edit' : 'Create'} Workflow Profile
          </h3>
          <div className="space-x-2">
            <button
              onClick={handleSaveProfile}
              disabled={disabled || editingProfile.roles.length === 0}
              className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md disabled:opacity-50"
            >
              Save Profile
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
              <label className="block text-sm font-medium text-theme-primary mb-1">Profile name</label>
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
                <h4 className="font-medium text-theme-primary">Roles</h4>
                <div className="space-x-1">
                  {roleTypeSchemas.map((schema) => (
                    <button
                      key={schema.id}
                      onClick={() => handleAddRole(schema.id)}
                      disabled={disabled}
                      className="px-2 py-1 btn-theme-secondary text-xs rounded disabled:opacity-50"
                      title={`Add ${schema.name}`}
                    >
                      {schema.icon} {schema.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {editingProfile.roles.map((role, index) => {
                  const schema = roleTypeSchemas.find(s => s.id === role.typeId);
                  return (
                    <div key={role.id} className="border border-theme rounded-md p-3 bg-theme-elevated">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-theme-primary">
                            {schema?.icon} {role.name}
                          </span>
                          <span className="text-sm text-theme-secondary ml-2">
                            ({schema?.name})
                          </span>
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
                    No roles added yet. Click the buttons above to add roles.
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

            {editingProfile.roles.length > 0 && (
              <div>
                <h4 className="font-medium text-theme-primary mb-2">Execution order</h4>
                <div className="space-y-1">
                  {editingProfile.executionOrder.map((roleId, index) => {
                    const role = editingProfile.roles.find(r => r.id === roleId);
                    const schema = roleTypeSchemas.find(s => s.id === role?.typeId);
                    return (
                      <div key={roleId} className="flex items-center text-sm bg-theme-elevated border border-theme rounded p-2">
                        <span className="w-6 h-6 bg-theme-accent text-theme-primary-contrast rounded-full flex items-center justify-center text-xs mr-2">
                          {index + 1}
                        </span>
                        <span>{schema?.icon} {role?.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role Configuration Modal */}
        {showRoleModal && editingRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-theme-primary border border-theme rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-theme-primary">
                  Configure {roleTypeSchemas.find(s => s.id === editingRole.typeId)?.name}
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

                {roleTypeSchemas.find(s => s.id === editingRole.typeId)?.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-theme-primary mb-1">
                      {field.label}
                      {field.required && <span className="text-theme-error ml-1">*</span>}
                    </label>
                    {renderRoleField(
                      field,
                      editingRole.configuration[field.id],
                      (value) => setEditingRole({
                        ...editingRole,
                        configuration: {
                          ...editingRole.configuration,
                          [field.id]: value
                        }
                      })
                    )}
                    {field.helpText && (
                      <p className="text-xs text-theme-muted mt-1">{field.helpText}</p>
                    )}
                  </div>
                ))}
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
        <h3 className="text-lg font-medium text-theme-primary">Schema-based Role Builder</h3>
        <div className="space-x-2">
          <button
            onClick={handleCreateProfile}
            disabled={disabled}
            className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md disabled:opacity-50"
          >
            Create New Profile
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
              <h4 className="font-medium text-theme-primary mb-3">Profile Preview</h4>
              <div className="bg-theme-elevated border border-theme rounded-md p-4 space-y-4">
                <div>
                  <h5 className="font-medium text-theme-primary">{selectedProfile.name}</h5>
                  <p className="text-sm text-theme-secondary">{selectedProfile.description}</p>
                  <p className="text-xs text-theme-muted">Version: {selectedProfile.version}</p>
                </div>

                <div>
                  <h6 className="font-medium text-theme-primary mb-2">Roles ({selectedProfile.roles.length})</h6>
                  <div className="space-y-1">
                    {selectedProfile.roles.map((role) => {
                      const schema = roleTypeSchemas.find(s => s.id === role.typeId);
                      return (
                        <div key={role.id} className="text-sm border border-theme rounded p-2">
                          <div className="font-medium text-theme-primary">
                            {schema?.icon} {role.name}
                          </div>
                          <div className="text-theme-secondary">{schema?.name}</div>
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
                  <h6 className="font-medium text-theme-primary mb-2">Execution Order</h6>
                  <div className="space-y-1">
                    {selectedProfile.executionOrder.map((roleId, index) => {
                      const role = selectedProfile.roles.find(r => r.id === roleId);
                      const schema = roleTypeSchemas.find(s => s.id === role?.typeId);
                      return (
                        <div key={roleId} className="flex items-center text-sm">
                          <span className="w-6 h-6 bg-theme-accent text-theme-primary-contrast rounded-full flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                          <span>{schema?.icon} {role?.name}</span>
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
            <h4 className="text-lg font-medium text-theme-primary mb-4">Import Schema Profiles</h4>
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

export default RoleBuilderTab;