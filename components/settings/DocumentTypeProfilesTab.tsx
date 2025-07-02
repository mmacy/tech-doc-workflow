import React, { useState } from 'react';
import { DocumentTypeProfile } from '../../types';
import ProfileEditorModal from './ProfileEditorModal';

interface DocumentTypeProfilesTabProps {
  profiles: DocumentTypeProfile[];
  onProfilesChange: (newProfiles: DocumentTypeProfile[]) => void;
  disabled: boolean;
}

const DocumentTypeProfilesTab: React.FC<DocumentTypeProfilesTabProps> = ({ profiles, onProfilesChange, disabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<DocumentTypeProfile | null>(null);
  
  const handleAddNewProfile = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
  };

  const handleEditProfile = (profile: DocumentTypeProfile) => {
    setEditingProfile(profile);
    setIsModalOpen(true);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
      onProfilesChange(profiles.filter(p => p.id !== profileId));
    }
  };

  const handleSaveProfile = (profileToSave: DocumentTypeProfile) => {
    if (editingProfile) { // Editing existing
      onProfilesChange(profiles.map(p => p.id === profileToSave.id ? profileToSave : p));
    } else { // Adding new
      onProfilesChange([...profiles, { ...profileToSave, id: `profile_${Date.now()}_${Math.random().toString(36).substring(2,7)}` }]);
    }
    setIsModalOpen(false);
    setEditingProfile(null);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-1">Document Type Profiles</h3>
        <p className="text-sm text-slate-400">
          Manage templates and definitions for different types of documents your team authors.
          These profiles will be available in the main form when starting a new workflow.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          onClick={handleAddNewProfile}
          disabled={disabled}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium text-sm disabled:bg-slate-500 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add New Profile
        </button>
      </div>

      {profiles.length === 0 && (
        <p className="text-slate-400 italic py-4">No document type profiles configured yet. Click "Add New Profile" to create one.</p>
      )}

      <div className="space-y-4">
        {profiles.map(profile => (
          <div key={profile.id} className="bg-slate-700/70 p-4 rounded-lg border border-slate-600/50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold text-sky-300">{profile.name}</h4>
                <p className="text-sm text-slate-300 mt-1 mb-2 whitespace-pre-wrap">{profile.description}</p>
                <details className="text-xs text-slate-400 mb-2">
                    <summary className="cursor-pointer hover:text-sky-400">View document type guidance</summary>
                    <pre className="mt-1 p-2 bg-slate-800 rounded text-xs whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">{profile.docTypeDescription || "No guidance defined."}</pre>
                </details>
                <details className="text-xs text-slate-400">
                    <summary className="cursor-pointer hover:text-sky-400">View template</summary>
                    <pre className="mt-1 p-2 bg-slate-800 rounded text-xs whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">{profile.template || "No template defined."}</pre>
                </details>
              </div>
              <div className="flex space-x-2 shrink-0 ml-4">
                <button onClick={() => handleEditProfile(profile)} disabled={disabled} className="text-sky-400 hover:text-sky-300 disabled:text-slate-500 p-1" title="Edit profile">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
                <button onClick={() => handleDeleteProfile(profile.id)} disabled={disabled} className="text-red-400 hover:text-red-300 disabled:text-slate-500 p-1" title="Delete profile">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.242.26m3.242.26L12 4.092l2.482.028M12 4.092V2.25m8.25.06l-.004-.004M3.75 2.25l.004.004M19.5 7.125A2.25 2.25 0 0017.25 4.875H6.75A2.25 2.25 0 004.5 7.125v1.518c0 .895.255 1.741.714 2.477L12 16.5l6.786-5.385a3.453 3.453 0 00.714-2.477V7.125z" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ProfileEditorModal
          profile={editingProfile}
          onSave={handleSaveProfile}
          onClose={() => {setIsModalOpen(false); setEditingProfile(null);}}
        />
      )}
    </div>
  );
};

export default DocumentTypeProfilesTab;