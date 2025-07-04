import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        // Legacy support
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        
        // Provider-specific API keys
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        
        // Azure OpenAI environment variables
        'process.env.AZURE_OPENAI_API_KEY': JSON.stringify(env.AZURE_OPENAI_API_KEY),
        'process.env.AZURE_OPENAI_ENDPOINT': JSON.stringify(env.AZURE_OPENAI_ENDPOINT),
        'process.env.AZURE_OPENAI_DEPLOYMENT': JSON.stringify(env.AZURE_OPENAI_DEPLOYMENT),
        'process.env.AZURE_OPENAI_API_VERSION': JSON.stringify(env.AZURE_OPENAI_API_VERSION),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
