import { LLMProvider, ProviderConfig } from '../types/providers';
import { GeminiProvider } from './providers/GeminiProvider';
import { AzureOpenAIProvider } from './providers/AzureOpenAIProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';

export class ProviderFactory {
  static createProvider(config: ProviderConfig): LLMProvider {
    switch (config.type) {
      case 'gemini':
        return new GeminiProvider(config);
      case 'azure-openai':
        return new AzureOpenAIProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.type}`);
    }
  }

  static validateConfig(config: ProviderConfig): string[] {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Provider is required');
      return errors;
    }

    switch (config.type) {
      case 'gemini':
        if (!config.apiKey) {
          errors.push('Gemini API key is required');
        }
        break;
      case 'azure-openai':
        if (!config.apiKey) {
          errors.push('Azure OpenAI API key is required');
        }
        if (!config.azureEndpoint) {
          errors.push('Azure OpenAI endpoint is required');
        }
        if (!config.azureDeployment) {
          errors.push('Azure OpenAI deployment name is required');
        }
        break;
      case 'openai':
        if (!config.apiKey) {
          errors.push('OpenAI API key is required');
        }
        break;
      default:
        errors.push(`Unsupported provider: ${config.type}`);
    }

    return errors;
  }
}