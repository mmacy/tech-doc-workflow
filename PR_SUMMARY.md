# Add multi-LLM provider support and enhanced security

This PR introduces support for multiple LLM providers (OpenAI, Gemini, Azure OpenAI) and implements enhanced security by removing environment variable-based API key configuration to prevent secrets from being accidentally baked into build artifacts.

## Key changes:

• **Multi-provider architecture** - Replaced single Gemini service with extensible provider system supporting OpenAI, Gemini, and Azure OpenAI
• **Enhanced security model** - Removed all environment variable API key support; keys now stored securely in memory only
• **Secure UI-based key management** - New `KeyManagement` component with validation, masking, and connection testing
• **Runtime provider configuration** - Users can switch between providers and models through the settings interface
• **Cleaned build process** - Removed all `loadEnv` and environment variable injection from Vite configuration
• **Updated documentation** - Removed environment variable setup instructions; added multi-provider guidance
• **Provider metadata in logs** - Workflow logs now show which provider and model are being used
• **Improved validation and error handling** - Better connection testing and error messages for each provider