import React, { useState } from 'react';
import { ProviderConfig, ProviderType, PROVIDER_CONFIGS, ProviderConfigField } from '../../types/providers';
import { ProviderFactory } from '../../services/ProviderFactory';
import { KeyManagement } from '../KeyManagement';

interface LLMProviderTabProps {
  provider: ProviderConfig;
  onProviderChange: (provider: ProviderConfig) => void;
}

export const LLMProviderTab: React.FC<LLMProviderTabProps> = ({
  provider,
  onProviderChange,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleProviderTypeChange = (type: ProviderType) => {
    const newProvider: ProviderConfig = {
      type,
      apiKey: '',
    };

    // Set default values for specific providers
    if (type === 'azure-openai') {
      newProvider.azureApiVersion = '2024-12-01-preview';
    } else if (type === 'openai') {
      newProvider.model = 'o3';
    }

    onProviderChange(newProvider);
  };

  const handleFieldChange = (field: keyof ProviderConfig, value: string) => {
    onProviderChange({
      ...provider,
      [field]: value,
    });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const errors = ProviderFactory.validateConfig(provider);
      if (errors.length > 0) {
        setTestResult(`Configuration errors: ${errors.join(', ')}`);
        return;
      }

      const testProvider = ProviderFactory.createProvider(provider);
      await testProvider.generateText('Hello', 'You are a helpful assistant. Respond with just "OK".');
      setTestResult('✅ Connection successful!');
    } catch (error) {
      setTestResult(`❌ Connection failed: ${(error as Error).message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const currentProviderInfo = PROVIDER_CONFIGS[provider.type];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4 text-theme-primary">LLM provider configuration</h3>
        <p className="text-theme-secondary mb-6">
          Choose and configure the AI provider for text generation and document review.
        </p>
      </div>

      {/* Key Management Section */}
      <div className="border-b border-theme pb-6">
        <KeyManagement onKeysUpdated={() => {
          // Optionally refresh test results when keys are updated
          setTestResult(null);
        }} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-theme-secondary">Provider</label>
          <select
            value={provider.type}
            onChange={(e) => handleProviderTypeChange(e.target.value as ProviderType)}
            className="block w-full px-3 py-2 input-theme rounded-md"
          >
            {Object.values(PROVIDER_CONFIGS).map((config) => (
              <option key={config.type} value={config.type}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        {currentProviderInfo.configFields.map((field: ProviderConfigField) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-2 text-theme-secondary">
              {field.label}
              {field.required && <span className="text-theme-error ml-1">*</span>}
            </label>
            <input
              type={field.type === 'password' ? 'password' : 'text'}
              value={(provider[field.key] as string) || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="block w-full px-3 py-2 input-theme rounded-md"
            />
            {field.description && (
              <p className="mt-1 text-sm text-theme-muted">{field.description}</p>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="px-4 py-2 btn-theme-primary text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && (
            <div className="mt-3 p-3 rounded-md bg-theme-elevated border border-theme">
              <p className="text-sm text-theme-primary">{testResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};