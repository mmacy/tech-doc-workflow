import { ReviewDecision } from '../types';

export type ProviderType = 'gemini' | 'azure-openai' | 'openai';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  // Azure-specific
  azureEndpoint?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
  // OpenAI-specific
  model?: string;
}

export interface LLMProvider {
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  generateReviewDecision(prompt: string, systemInstruction?: string): Promise<ReviewDecision>;
}

export interface ProviderInfo {
  type: ProviderType;
  name: string;
  description: string;
  configFields: ProviderConfigField[];
}

export interface ProviderConfigField {
  key: keyof ProviderConfig;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
  description?: string;
}

export const PROVIDER_CONFIGS: Record<ProviderType, ProviderInfo> = {
  gemini: {
    type: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s Gemini AI models',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Enter your Gemini API key',
        description: 'Your Google AI Studio API key'
      }
    ]
  },
  'azure-openai': {
    type: 'azure-openai',
    name: 'Azure OpenAI',
    description: 'OpenAI models hosted on Microsoft Azure',
    configFields: [
      {
        key: 'azureEndpoint',
        label: 'Azure Endpoint',
        type: 'url',
        required: true,
        placeholder: 'https://your-resource.openai.azure.com',
        description: 'Your Azure OpenAI endpoint URL'
      },
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Enter your Azure OpenAI API key',
        description: 'Your Azure OpenAI API key'
      },
      {
        key: 'azureDeployment',
        label: 'Deployment Name',
        type: 'text',
        required: true,
        placeholder: 'gpt-4',
        description: 'Your Azure OpenAI deployment name'
      },
      {
        key: 'azureApiVersion',
        label: 'API Version',
        type: 'text',
        required: false,
        placeholder: '2024-10-01-preview',
        description: 'Azure OpenAI API version (optional)'
      }
    ]
  },
  openai: {
    type: 'openai',
    name: 'OpenAI',
    description: 'OpenAI\'s GPT models',
    configFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Enter your OpenAI API key',
        description: 'Your OpenAI API key'
      },
      {
        key: 'model',
        label: 'Model',
        type: 'text',
        required: false,
        placeholder: 'gpt-4o',
        description: 'OpenAI model to use (optional)'
      }
    ]
  }
};