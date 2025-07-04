import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LLMProvider, ProviderConfig } from '../../types/providers';
import { ReviewDecision } from "../../types";
import { keyManager } from '../keyManager';

export class GeminiProvider implements LLMProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(config: ProviderConfig) {
    // Try to get API key from KeyManager first, then fall back to config
    const apiKey = keyManager.getKey('gemini') || config.apiKey;
    
    if (!apiKey) {
      throw new Error("Gemini API key not configured. Please add your key in settings.");
    }
    
    this.ai = new GoogleGenAI({ apiKey: apiKey });
    this.model = 'gemini-2.5-flash-preview-04-17'; // Default model
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5,
          topK: 32,
          topP: 0.9,
        }
      });
      return response.text.trim();
    } catch (error) {
      console.error("Gemini API Error:", error);
      if (error instanceof Error) {
        const geminiError = error as any;
        if (geminiError.message && geminiError.message.includes('API key not valid')) {
          throw new Error("Invalid API Key. Please check your Gemini API key.");
        }
        if (geminiError.message && geminiError.message.includes('quota')) {
          throw new Error("API quota exceeded. Please check your Gemini project quotas.");
        }
      }
      throw new Error(`Failed to generate text using Gemini API: ${(error as Error).message}`);
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