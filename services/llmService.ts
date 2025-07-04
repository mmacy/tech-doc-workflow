import { LLMProvider, ProviderConfig } from '../types/providers';
import { ReviewDecision } from '../types';
import { ProviderFactory } from './ProviderFactory';

let currentProvider: LLMProvider | null = null;
let currentProviderConfig: ProviderConfig | null = null;

export const initializeProvider = (config: ProviderConfig): void => {
  const errors = ProviderFactory.validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Provider configuration errors: ${errors.join(', ')}`);
  }

  currentProvider = ProviderFactory.createProvider(config);
  currentProviderConfig = config;
};

export const getDefaultProviderConfig = (): ProviderConfig => {
  // Try to use Gemini as default if API key is available
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    return {
      type: 'gemini',
      apiKey: geminiApiKey
    };
  }

  // Fallback to requiring manual configuration
  throw new Error('No default provider configuration available - configure a provider.');
};

export const callLLMTextGeneration = async (prompt: string, systemInstruction?: string): Promise<string> => {
  if (!currentProvider || !currentProviderConfig) {
    throw new Error('No LLM provider configured - configure a provider in settings.');
  }

  try {
    return await currentProvider.generateText(prompt, systemInstruction);
  } catch (error) {
    const providerInfo = getProviderDisplayInfo(currentProviderConfig);
    throw new Error(`Failed to generate text using ${providerInfo.providerName} (${providerInfo.modelName}): ${(error as Error).message}`);
  }
};

export const callLLMReview = async (prompt: string, systemInstruction?: string): Promise<ReviewDecision> => {
  if (!currentProvider || !currentProviderConfig) {
    throw new Error('No LLM provider configured. Configure a provider in settings.');
  }

  try {
    return await currentProvider.generateReviewDecision(prompt, systemInstruction);
  } catch (error) {
    const providerInfo = getProviderDisplayInfo(currentProviderConfig);
    throw new Error(`Failed to generate review using ${providerInfo.providerName} (${providerInfo.modelName}): ${(error as Error).message}`);
  }
};

export const getCurrentProviderInfo = (): { providerName: string; modelName: string } => {
  if (!currentProviderConfig) {
    return { providerName: 'Not configured', modelName: 'Unknown' };
  }

  return getProviderDisplayInfo(currentProviderConfig);
};

export const getProviderDisplayInfo = (config: ProviderConfig): { providerName: string; modelName: string } => {
  switch (config.type) {
    case 'gemini':
      return {
        providerName: 'Google Gemini',
        modelName: 'gemini-2.5-flash-preview-04-17'
      };
    case 'azure-openai':
      return {
        providerName: 'Azure OpenAI',
        modelName: config.azureDeployment || 'Unknown deployment'
      };
    case 'openai':
      return {
        providerName: 'OpenAI',
        modelName: config.model || 'gpt-4.1-nano'
      };
    default:
      return {
        providerName: 'Unknown Provider',
        modelName: 'Unknown Model'
      };
  }
};

// Legacy functions for backward compatibility
export const callGeminiTextGeneration = callLLMTextGeneration;
export const callGeminiReview = callLLMReview;