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
      newProvider.azureApiVersion = '2024-10-01-preview';
    } else if (type === 'openai') {
      newProvider.model = 'gpt-4o';
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
        <h3 className="text-lg font-medium mb-4">LLM Provider Configuration</h3>
        <p className="text-gray-600 mb-6">
          Choose and configure the AI provider for text generation and document review.
        </p>
      </div>

      {/* Key Management Section */}
      <div className="border-b pb-6">
        <KeyManagement onKeysUpdated={() => {
          // Optionally refresh test results when keys are updated
          setTestResult(null);
        }} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Provider Type</label>
          <select
            value={provider.type}
            onChange={(e) => handleProviderTypeChange(e.target.value as ProviderType)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.values(PROVIDER_CONFIGS).map((config) => (
              <option key={config.type} value={config.type}>
                {config.name} - {config.description}
              </option>
            ))}
          </select>
        </div>

        {currentProviderInfo.configFields.map((field: ProviderConfigField) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type === 'password' ? 'password' : 'text'}
              value={(provider[field.key] as string) || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {field.description && (
              <p className="mt-1 text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testResult && (
            <div className="mt-3 p-3 rounded-md bg-gray-50 border">
              <p className="text-sm">{testResult}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <div>
          <h4 className="text-md font-medium mb-2">Security Notice</h4>
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Browser Usage Enabled</p>
                <p className="mt-1">API keys are exposed in the browser for OpenAI and Azure OpenAI providers. Only use this in trusted environments and avoid using production API keys.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium mb-2">Environment Variables</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>You can also configure providers using environment variables:</p>
            <div className="bg-gray-50 p-3 rounded-md font-mono text-xs">
              {provider.type === 'gemini' && (
                <div>GEMINI_API_KEY=your_gemini_api_key</div>
              )}
              {provider.type === 'azure-openai' && (
                <>
                  <div>AZURE_OPENAI_API_KEY=your_azure_api_key</div>
                  <div>AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com</div>
                  <div>AZURE_OPENAI_DEPLOYMENT=your_deployment_name</div>
                  <div>AZURE_OPENAI_API_VERSION=2024-10-01-preview</div>
                </>
              )}
              {provider.type === 'openai' && (
                <div>OPENAI_API_KEY=your_openai_api_key</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};