import { AzureOpenAI } from 'openai';
import { LLMProvider, ProviderConfig } from '../../types/providers';
import { ReviewDecision } from "../../types";

export class AzureOpenAIProvider implements LLMProvider {
  private client: AzureOpenAI;
  private deployment: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error("Azure OpenAI API key is required");
    }
    if (!config.azureEndpoint) {
      throw new Error("Azure OpenAI endpoint is required");
    }
    if (!config.azureDeployment) {
      throw new Error("Azure OpenAI deployment name is required");
    }

    this.client = new AzureOpenAI({
      apiKey: config.apiKey,
      apiVersion: config.azureApiVersion || '2024-10-01-preview',
      endpoint: config.azureEndpoint,
      dangerouslyAllowBrowser: true,
    });

    this.deployment = config.azureDeployment;
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const messages: any[] = [];

      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.deployment,
        messages: messages,
        temperature: 1.0,
        max_completion_tokens: 15000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content received from Azure OpenAI");
      }

      return content.trim();
    } catch (error) {
      console.error("Azure OpenAI API Error:", error);
      if (error instanceof Error) {
        const azureError = error as any;
        if (azureError.status === 401) {
          throw new Error("Invalid API Key. Please check your Azure OpenAI API key.");
        }
        if (azureError.status === 429) {
          throw new Error("API quota exceeded. Please check your Azure OpenAI quotas.");
        }
        if (azureError.status === 404) {
          throw new Error("Deployment not found. Please check your Azure OpenAI deployment name.");
        }
      }
      throw new Error(`Failed to generate text using Azure OpenAI API: ${(error as Error).message}`);
    }
  }

  async generateReviewDecision(prompt: string, systemInstruction?: string): Promise<ReviewDecision> {
    const responseText = await this.generateText(prompt, systemInstruction);

    if (responseText.startsWith("CONTINUE")) {
      return { type: "CONTINUE" };
    } else if (responseText.startsWith("REVISE:")) {
      const feedback = responseText.substring("REVISE:".length).trim();
      if (!feedback) {
        return { type: "ERROR", message: "Reviewer asked to REVISE but provided no feedback." };
      }
      return { type: "REVISE", feedback };
    } else {
      console.warn("Unexpected review response format:", responseText);
      return {
        type: "ERROR",
        message: `Unexpected response format from reviewer. Expected 'CONTINUE' or 'REVISE: ...', but got: "${responseText.substring(0, 100)}..."`
      };
    }
  }
}