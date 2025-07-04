export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate OpenAI API key format
 */
export function validateOpenAIKey(key: string): ValidationResult {
  if (!key) {
    return { isValid: false, error: 'Key is required' };
  }
  
  if (!key.startsWith('sk-')) {
    return { isValid: false, error: 'OpenAI keys should start with "sk-"' };
  }
  
  if (key.length < 40) {
    return { isValid: false, error: 'Key appears too short' };
  }
  
  // Check for common placeholder patterns
  if (key.includes('your-api-key') || key.includes('xxx')) {
    return { isValid: false, error: 'Please enter a real API key' };
  }
  
  return { isValid: true };
}

/**
 * Validate Gemini API key format
 */
export function validateGeminiKey(key: string): ValidationResult {
  if (!key) {
    return { isValid: false, error: 'Key is required' };
  }
  
  if (key.length < 30) {
    return { isValid: false, error: 'Key appears too short' };
  }
  
  // Gemini keys typically contain alphanumeric + hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
    return { isValid: false, error: 'Key contains invalid characters' };
  }
  
  return { isValid: true };
}

/**
 * Validate Azure OpenAI configuration
 */
export function validateAzureConfig(apiKey: string, endpoint: string): ValidationResult {
  if (!apiKey || !endpoint) {
    return { isValid: false, error: 'Both API key and endpoint are required' };
  }
  
  // Validate endpoint URL
  try {
    const url = new URL(endpoint);
    if (!url.hostname.includes('openai.azure.com')) {
      return { isValid: false, error: 'Endpoint should be an Azure OpenAI URL' };
    }
  } catch {
    return { isValid: false, error: 'Invalid endpoint URL' };
  }
  
  if (apiKey.length < 30) {
    return { isValid: false, error: 'API key appears too short' };
  }
  
  return { isValid: true };
}

/**
 * Get validator for a specific provider
 */
export function getValidator(provider: string): (key: string) => ValidationResult {
  switch (provider) {
    case 'openai':
      return validateOpenAIKey;
    case 'gemini':
      return validateGeminiKey;
    case 'azure':
      return (key: string) => validateAzureConfig(key, ''); // Simplified for example
    default:
      return () => ({ isValid: false, error: 'Unknown provider' });
  }
}