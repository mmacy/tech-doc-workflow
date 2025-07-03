import { LLMProvider, ProviderConfig } from '../types/providers';
import { ReviewDecision } from '../types';
import { ProviderFactory } from './ProviderFactory';

let currentProvider: LLMProvider | null = null;

export const initializeProvider = (config: ProviderConfig): void => {
  const errors = ProviderFactory.validateConfig(config);
  if (errors.length > 0) {
    throw new Error(`Provider configuration errors: ${errors.join(', ')}`);
  }
  
  currentProvider = ProviderFactory.createProvider(config);
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
  throw new Error('No default provider configuration available. Please configure a provider.');
};

export const callLLMTextGeneration = async (prompt: string, systemInstruction?: string): Promise<string> => {
  if (!currentProvider) {
    // Try to initialize with default config
    try {
      const defaultConfig = getDefaultProviderConfig();
      initializeProvider(defaultConfig);
    } catch (error) {
      throw new Error('No LLM provider configured. Please configure a provider in settings.');
    }
  }
  
  if (!currentProvider) {
    throw new Error('Failed to initialize LLM provider');
  }
  
  return currentProvider.generateText(prompt, systemInstruction);
};

export const callLLMReview = async (prompt: string, systemInstruction?: string): Promise<ReviewDecision> => {
  if (!currentProvider) {
    // Try to initialize with default config
    try {
      const defaultConfig = getDefaultProviderConfig();
      initializeProvider(defaultConfig);
    } catch (error) {
      throw new Error('No LLM provider configured. Please configure a provider in settings.');
    }
  }
  
  if (!currentProvider) {
    throw new Error('Failed to initialize LLM provider');
  }
  
  return currentProvider.generateReviewDecision(prompt, systemInstruction);
};

export const getCurrentProviderInfo = (): { providerName: string; modelName: string } => {
  if (!currentProvider) {
    // Try to initialize with default config to get provider info
    try {
      const defaultConfig = getDefaultProviderConfig();
      return getProviderDisplayInfo(defaultConfig);
    } catch (error) {
      return { providerName: 'Not configured', modelName: 'Unknown' };
    }
  }
  
  // If we have a current provider, we need to get its config somehow
  // For now, we'll try to get it from the current settings
  // This is a bit hacky but works for our use case
  return { providerName: 'Current Provider', modelName: 'Active Model' };
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
        modelName: config.model || 'gpt-4o' 
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