import OpenAI from 'openai';
import { LLMProvider, ProviderConfig } from '../../types/providers';
import { ReviewDecision } from "../../types";
import { keyManager } from '../keyManager';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: ProviderConfig) {
    // Try to get API key from KeyManager first, then fall back to config
    const apiKey = keyManager.getKey('openai') || config.apiKey;

    if (!apiKey) {
      throw new Error("OpenAI API key not configured - add your key in settings.");
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    this.model = config.model || 'gpt-4.1-nano';
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const messages: any[] = [];

      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 1.0,
        max_completion_tokens: 15000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content received from OpenAI");
      }

      return content.trim();
    } catch (error) {
      console.error("OpenAI API Error:", error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error) {
        const openaiError = error as any;
        if (openaiError.status === 401) {
          throw new Error("Invalid API key. Check your OpenAI API key.");
        }
        if (openaiError.status === 429) {
          throw new Error("API quota exceeded. Check your OpenAI quotas.");
        }
        if (openaiError.status === 404) {
          throw new Error("Model not found. Check your OpenAI model name.");
        }
      }
      throw new Error(`Failed to generate text using OpenAI API: ${(error as Error).message}`);
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