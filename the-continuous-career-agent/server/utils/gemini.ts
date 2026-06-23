/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

/**
 * Returns an initialized instance of the GoogleGenAI SDK client.
 * Using lazy-initialization prevents the app from crashing on start 
 * if the `GEMINI_API_KEY` is not set or injected yet in the environment.
 */
export function getGeminiClient(): GoogleGenAI {
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not defined. " +
      "Please insert it in your Settings > Secrets panel on AI Studio."
    );
  }

  // Initialize official Gemini GenAI Client with required telemetry headers
  geminiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  return geminiClient;
}

/**
 * Ideal models to use for each business agent based on modern Gemini API specifications:
 * 
 * - Agent 1: Interrogative/Conversational Partner - "gemini-3.5-flash"
 * - Agent 2: Logic, matching & parsing profile JSON - "gemini-3.5-flash" or "gemini-3.1-pro-preview" (complex logic)
 * - Agent 3: High-fidelity document generation & customized copy drafting - "gemini-3.5-flash"
 */
export const MODELS = {
  interviewer: "gemini-2.5-flash",
  matchmaker: "gemini-2.5-flash",
  outreachSpecialist: "gemini-2.5-flash",
};

/**
 * Safely executes a generateContent call. If it fails with a 429/quota error,
 * it retries using the high-availability "gemini-3.1-flash-lite" model automatically
 * before giving up and propagating/falling back to offline modes.
 */
export async function generateContentWithFallback(
  ai: any,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
): Promise<any> {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const errorStr = (typeof error === "object" ? JSON.stringify(error) : "") + (error.message || "") + "";
    const isQuota = errorStr.includes("429") || 
                    errorStr.includes("RESOURCE_EXHAUSTED") || 
                    errorStr.includes("quota") || 
                    errorStr.includes("Quota");
    
    if (isQuota) {
      console.warn(
        `[Quota Fallback] Active model '${params.model}' hit rate-limit (429/RESOURCE_EXHAUSTED). ` +
        `Retrying with resilient lightweight 'gemini-3.1-flash-lite' model...`
      );
      
      const fallbackParams = {
        ...params,
        model: "gemini-3.1-flash-lite",
      };
      
      // If thinkingConfig is present, remove it as it is not supported for gemini-3.1-flash-lite
      if (fallbackParams.config && fallbackParams.config.thinkingConfig) {
        const cleanedConfig = { ...fallbackParams.config };
        delete cleanedConfig.thinkingConfig;
        fallbackParams.config = cleanedConfig;
      }
      
      return await ai.models.generateContent(fallbackParams);
    }
    throw error;
  }
}
