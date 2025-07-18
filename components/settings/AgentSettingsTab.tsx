import React from 'react';
import { AgentSettings, AgentName, AgentRole } from '../../types';
import { AGENT_CONFIGURATIONS } from '../../constants';

interface AgentSettingsTabProps {
  settings: AgentSettings;
  onSettingsChange: (newSettings: AgentSettings) => void;
  disabled: boolean;
}

const reviewerAgents = AGENT_CONFIGURATIONS.filter(agent => agent.role === AgentRole.REVIEWER);

const AgentSettingsTab: React.FC<AgentSettingsTabProps> = ({ settings, onSettingsChange, disabled }) => {
  const handleMaxLoopsChange = (agentId: AgentName.INFORMATION_ARCHITECT | AgentName.TECHNICAL_EDITOR | AgentName.TECHNICAL_REVIEWER, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      onSettingsChange({
        ...settings,
        maxLoopsPerReviewer: {
          ...settings.maxLoopsPerReviewer,
          [agentId]: numValue,
        },
      });
    }
  };

  const handleGuidanceChange = (agentId: keyof AgentSettings['reviewerGuidance'], value: string) => {
    onSettingsChange({
      ...settings,
      reviewerGuidance: {
        ...settings.reviewerGuidance,
        [agentId]: value,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-theme-primary mb-1">Reviewer role configuration</h3>
        <p className="text-sm text-theme-secondary">
          Customize the behavior of reviewer roles in the workflow.
        </p>
      </div>
       <div className="space-y-6">
        <div>
            <p className="text-sm text-theme-secondary mb-1">Maximum review passes</p>
            <p className="text-xs text-theme-muted mb-3">Configure the maximum times a document can be sent back to the Technical Writer by each specific reviewer.</p>
        </div>
        {reviewerAgents.map((agent) => (
          <div key={agent.id} className="p-4 bg-theme-elevated rounded-lg border border-theme">
            <h4 className="text-md font-medium text-theme-accent mb-3">{agent.id}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`maxLoops-${agent.id}`} className="block text-theme-secondary text-sm mb-1">
                        Max review passes:
                    </label>
                    <input
                        type="number"
                        id={`maxLoops-${agent.id}`}
                        name={`maxLoops-${agent.id}`}
                        min="0"
                        max="10"
                        value={settings.maxLoopsPerReviewer[agent.id as keyof AgentSettings['maxLoopsPerReviewer']]}
                        onChange={(e) => handleMaxLoopsChange(agent.id as keyof AgentSettings['maxLoopsPerReviewer'], e.target.value)}
                        disabled={disabled}
                        className="w-full md:w-24 p-2 input-theme rounded-md disabled:opacity-50"
                    />
                </div>
                <div className="md:col-span-2"> {/* Make guidance textarea full width on its own line effectively */}
                  <label htmlFor={`guidance-${agent.id}`} className="block text-sm font-medium text-theme-secondary mb-1">
                    Custom review guidance:
                  </label>
                  <textarea
                    id={`guidance-${agent.id}`}
                    name={`guidance-${agent.id}`}
                    rows={5}
                    value={settings.reviewerGuidance[agent.id as keyof AgentSettings['reviewerGuidance']]}
                    onChange={(e) => handleGuidanceChange(agent.id as keyof AgentSettings['reviewerGuidance'], e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 input-theme rounded-md disabled:opacity-50 text-sm"
                    placeholder={`Enter specific review instructions for ${agent.id}...`}
                  />
                  <p className="text-xs text-theme-muted mt-1">This guidance will be provided to the {agent.id} in addition to their core specialization.</p>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentSettingsTab;