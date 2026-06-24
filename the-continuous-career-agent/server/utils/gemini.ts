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
  interviewer: process.env.GEMINI_INTERVIEWER_MODEL || "gemini-2.5-flash",
  matchmaker: process.env.GEMINI_MATCHMAKER_MODEL || "gemini-2.5-flash",
  outreachSpecialist: process.env.GEMINI_OUTREACH_MODEL || "gemini-2.5-flash",
};
