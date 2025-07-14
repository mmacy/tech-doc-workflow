import React, { useState, useEffect } from 'react';
import { WorkflowProfile, WorkflowRole, WORKFLOW_ROLE_TEMPLATES } from '../../types/workflow';
import { WorkflowProfileService } from '../../services/workflowProfileService';

interface WorkflowProfilesTabProps {
  disabled?: boolean;
}

const WorkflowProfilesTab: React.FC<WorkflowProfilesTabProps> = ({ disabled = false }) => {
  const [profiles, setProfiles] = useState<WorkflowProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<WorkflowProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<WorkflowProfile | null>(null);
  const [importData, setImportData] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileService = WorkflowProfileService.getInstance();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    try {
      const loadedProfiles = profileService.getAllProfiles();
      setProfiles(loadedProfiles);
      if (!selectedProfile && loadedProfiles.length > 0) {
        setSelectedProfile(loadedProfiles[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    }
  };

  const handleCreateNew = () => {
    const newProfile: WorkflowProfile = {
      id: `profile-${Date.now()}`,
      name: 'New Workflow Profile',
      description: 'Custom workflow profile',
      version: '1.0.0',
      roles: [{ ...WORKFLOW_ROLE_TEMPLATES.technicalWriter }],
      executionOrder: ['technical-writer'],
      globalSettings: {
        maxIterations: 10,
        timeoutMinutes: 30
      }
    };
    setEditingProfile(newProfile);
    setIsEditing(true);
  };

  const handleEdit = (profile: WorkflowProfile) => {
    setEditingProfile({ ...profile });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editingProfile) return;

    try {
      if (profiles.some(p => p.id === editingProfile.id && p !== selectedProfile)) {
        // New profile
        profileService.addProfile(editingProfile);
      } else {
        // Update existing
        profileService.updateProfile(editingProfile.id, editingProfile);
      }
      loadProfiles();
      setIsEditing(false);
      setEditingProfile(null);
      setSelectedProfile(editingProfile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handleDelete = (profileId: string) => {
    if (profiles.length <= 1) {
      setError('Cannot delete the last workflow profile');
      return;
    }

    try {
      profileService.deleteProfile(profileId);
      loadProfiles();
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(profiles.find(p => p.id !== profileId) || null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  const handleExport = () => {
    const collection = profileService.exportProfiles();
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-profiles-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const collection = JSON.parse(importData);
      profileService.importProfiles(collection);
      loadProfiles();
      setShowImportModal(false);
      setImportData('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import profiles');
    }
  };

  const addRole = (templateKey: keyof typeof WORKFLOW_ROLE_TEMPLATES) => {
    if (!editingProfile) return;
    
    const template = WORKFLOW_ROLE_TEMPLATES[templateKey];
    const newRole: WorkflowRole = {
      ...template,
      id: `${template.id}-${Date.now()}`
    };
    
    setEditingProfile({
      ...editingProfile,
      roles: [...editingProfile.roles, newRole],
      executionOrder: [...editingProfile.executionOrder, newRole.id]
    });
  };

  const removeRole = (roleId: string) => {
    if (!editingProfile) return;
    
    setEditingProfile({
      ...editingProfile,
      roles: editingProfile.roles.filter(role => role.id !== roleId),
      executionOrder: editingProfile.executionOrder.filter(id => id !== roleId)
    });
  };

  const updateRole = (roleId: string, updates: Partial<WorkflowRole>) => {
    if (!editingProfile) return;
    
    setEditingProfile({
      ...editingProfile,
      roles: editingProfile.roles.map(role => 
        role.id === roleId ? { ...role, ...updates } : role
      )
    });
  };

  if (isEditing && editingProfile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-theme-primary">
            {profiles.some(p => p.id === editingProfile.id) ? 'Edit' : 'Create'} Workflow Profile
          </h3>
          <div className="space-x-2">
            <button
              onClick={handleSave}
              disabled={disabled}
              className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={disabled}
              className="px-4 py-2 btn-theme-secondary rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Name</label>
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
            <label className="block text-sm font-medium text-theme-primary mb-1">Roles</label>
            <div className="space-y-3">
              {editingProfile.roles.map((role, index) => (
                <div key={role.id} className="border border-theme rounded-md p-4 bg-theme-elevated">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-theme-primary">{role.name}</span>
                    <button
                      onClick={() => removeRole(role.id)}
                      disabled={disabled || editingProfile.roles.length <= 1}
                      className="text-theme-error hover:text-theme-error-dark disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Role name"
                      value={role.name}
                      onChange={(e) => updateRole(role.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary text-sm"
                      disabled={disabled}
                    />
                    
                    <select
                      value={role.type}
                      onChange={(e) => updateRole(role.id, { type: e.target.value as 'writer' | 'reviewer' })}
                      className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary text-sm"
                      disabled={disabled}
                    >
                      <option value="writer">Writer</option>
                      <option value="reviewer">Reviewer</option>
                    </select>

                    {role.type === 'reviewer' && (
                      <input
                        type="number"
                        placeholder="Max loops"
                        value={role.defaultMaxLoops || 2}
                        onChange={(e) => updateRole(role.id, { defaultMaxLoops: parseInt(e.target.value) || 2 })}
                        className="w-full px-3 py-2 border border-theme rounded-md bg-theme-primary text-theme-primary text-sm"
                        disabled={disabled}
                        min="1"
                        max="10"
                      />
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => addRole('technicalWriter')}
                  disabled={disabled}
                  className="px-3 py-2 btn-theme-secondary text-sm rounded-md disabled:opacity-50"
                >
                  Add Writer
                </button>
                <button
                  onClick={() => addRole('technicalReviewer')}
                  disabled={disabled}
                  className="px-3 py-2 btn-theme-secondary text-sm rounded-md disabled:opacity-50"
                >
                  Add Technical Reviewer
                </button>
                <button
                  onClick={() => addRole('informationArchitect')}
                  disabled={disabled}
                  className="px-3 py-2 btn-theme-secondary text-sm rounded-md disabled:opacity-50"
                >
                  Add Information Architect
                </button>
                <button
                  onClick={() => addRole('technicalEditor')}
                  disabled={disabled}
                  className="px-3 py-2 btn-theme-secondary text-sm rounded-md disabled:opacity-50"
                >
                  Add Technical Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-theme-primary">Workflow Profiles</h3>
        <div className="space-x-2">
          <button
            onClick={handleCreateNew}
            disabled={disabled}
            className="px-4 py-2 btn-theme-primary text-theme-primary-contrast rounded-md disabled:opacity-50"
          >
            Create New
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
          <h4 className="font-medium text-theme-primary mb-3">Available Profiles</h4>
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
                        handleEdit(profile);
                      }}
                      disabled={disabled}
                      className="p-1 text-theme-accent hover:text-theme-accent-dark disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(profile.id);
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
                  <h6 className="font-medium text-theme-primary mb-2">Execution Order</h6>
                  <div className="space-y-1">
                    {selectedProfile.executionOrder.map((roleId, index) => {
                      const role = selectedProfile.roles.find(r => r.id === roleId);
                      return (
                        <div key={roleId} className="flex items-center text-sm">
                          <span className="w-6 h-6 bg-theme-accent text-theme-primary-contrast rounded-full flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                          <span className="text-theme-primary">{role?.name || roleId}</span>
                          <span className="ml-2 text-theme-muted">({role?.type})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-theme-primary mb-2">Roles</h6>
                  <div className="space-y-2">
                    {selectedProfile.roles.map((role) => (
                      <div key={role.id} className="text-sm border border-theme rounded p-2">
                        <div className="font-medium text-theme-primary">{role.name}</div>
                        <div className="text-theme-secondary">{role.description}</div>
                        <div className="text-theme-muted">Type: {role.type}</div>
                        {role.type === 'reviewer' && role.defaultMaxLoops && (
                          <div className="text-theme-muted">Max loops: {role.defaultMaxLoops}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-theme-primary border border-theme rounded-lg p-6 w-full max-w-2xl">
            <h4 className="text-lg font-medium text-theme-primary mb-4">Import Workflow Profiles</h4>
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

export default WorkflowProfilesTab;