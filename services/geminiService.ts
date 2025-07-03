
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT, PROMPT_SYSTEM_INSTRUCTION } from '../constants';
import { ReviewDecision } from "../types";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set. Please set it in your environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateText = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: {
        systemInstruction: PROMPT_SYSTEM_INSTRUCTION,
        temperature: 0.5, // Lower temperature for more factual/deterministic output
        topK: 32,
        topP: 0.9,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
      // It's good practice to check the error structure from Gemini if available,
      // e.g., error.response.data or similar for more detailed messages.
      const geminiError = error as any; // Cast to any to check for specific properties
      if (geminiError.message && geminiError.message.includes('API key not valid')) {
         throw new Error("Invalid API Key. Please check your GEMINI_API_KEY environment variable.");
      }
      if (geminiError.message && geminiError.message.includes('quota')) {
        throw new Error("API quota exceeded. Please check your Gemini project quotas.");
      }
    }
    throw new Error(`Failed to generate text using Gemini API: ${ (error as Error).message }`);
  }
};


export const callGeminiTextGeneration = async (prompt: string): Promise<string> => {
  return generateText(prompt);
};

export const callGeminiReview = async (prompt: string): Promise<ReviewDecision> => {
  const responseText = await generateText(prompt);

  if (responseText.startsWith("CONTINUE")) {
    return { type: "CONTINUE" };
  } else if (responseText.startsWith("REVISE:")) {
    const feedback = responseText.substring("REVISE:".length).trim();
    if (!feedback) {
        return { type: "ERROR", message: "Reviewer asked to REVISE but provided no feedback." };
    }
    return { type: "REVISE", feedback };
  } else {
    // This case handles unexpected responses from the LLM.
    console.warn("Unexpected review response format:", responseText);
    return {
        type: "ERROR",
        message: `Unexpected response format from reviewer. Expected 'CONTINUE' or 'REVISE: ...', but got: "${responseText.substring(0,100)}..."`
    };
  }
};
