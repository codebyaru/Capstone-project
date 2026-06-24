/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import { getGeminiClient, MODELS, generateContentWithFallback } from "../utils/gemini.js";
import { Type } from "@google/genai";
import { UserCapabilityProfile } from "../../src/types/profile.js";
import { 
  sanitizeUserProfile, 
  validateSessionHeader, 
  encryptToken, 
  secureLog 
} from "../utils/security.js";
import { onStateHandover } from "../../config/antigravity.config.js";

const router = Router();

/**
 * GET /api/profile/session-token
 * Provisions an encrypted session token for secure frontend auth.
 */
router.get("/session-token", async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = JSON.stringify({
      timestamp: Date.now(),
      clientId: req.ip || "127.0.0.1",
      authorized: true
    });
    const sessionToken = encryptToken(payload);
    res.json({ success: true, sessionToken });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to generate session token", details: error.message });
  }
});

/**
 * Endpoint to start or continue a career profiling interview.
 * Body parameter:
 * - `chatHistory`: Array of existing chat messages { role: "user" | "model", text: string }
 * - `currentResumeText`: Optional initial text or select tech stack uploaded by user
 */
router.post("/interview", validateSessionHeader, async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatHistory = [], currentResumeText = "" } = req.body;

    // Securely log using our masked secure log helper
    secureLog("Interview Input Request", { chatHistory, currentResumeText });

    // Sanitize user inputs to scrub Personally Identifiable Information (PII) before Gemini API invocation
    const cleanResumeText = sanitizeUserProfile(currentResumeText || "");
    const cleanChatHistory = sanitizeUserProfile(chatHistory || []) as any;

    const ai = getGeminiClient();

    // Prepare system instructions for Agent 1
    const systemPrompt = `You are Agent 1: The Technical Interviewer & Profiler for "The Continuous Career Agent".
Your sole objective is to conduct a highly focused, extremely empathetic, yet deeply technical technical interview consisting of exactly 3 to 4 targeting questions to uncover a candidate's true capability, problem-solving style, and architectural expertise.

Structure your interactions:
1. Probe deeper into real architectural trade-offs, edge cases handled, database preferences, and problem-solving tactics.
2. Be empathetic ("That makes complete sense", "That's a really smart design decision under pressure") but highly curious as a peer staff engineer.
3. Be supportive, concise, and conversational (keep messages to 2-3 shorter paragraphs max).
4. Do NOT ask multiple questions at once. Ask exactly one precise progressive question at a time.
5. Review the chat history count of user answers. Once the candidate has answered 3 or 4 of your questions, do NOT ask any new technical questions. Instead, thank them and end your response exactly with this special completion text: "[INTERVIEW_COMPLETE] Understood! Our continuous profiling session is completed successfully. I have fully extracted your high-value engineering trade-off capabilities! Click the button below to compile your Capability Profile."

If we have a currentResumeText or tech stack provided and the chatHistory is empty, begin by analyzing it and asking the first high-yield architectural question.`;

    // Map existing text history to Gemini API Content array
    const contents = cleanChatHistory.map((msg: { role: string; text: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // If initial load with resume but no chat history yet
    if (contents.length === 0 && cleanResumeText) {
      contents.push({
        role: "user",
        parts: [{ text: `Here is my background/resume text: \n\n${cleanResumeText}\n\nPlease start the interview with your first targeted question.` }],
      });
    } else if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello! Let's start the continuous career agent technical interviewing session." }],
      });
    }

    const response = await generateContentWithFallback(ai, {
      model: MODELS.interviewer,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const nextQuestion = response.text || "Could you tell me more about your recent project architecture?";

    res.json({
      success: true,
      nextQuestion,
      chatHistory: [
        ...chatHistory, // Return the non-sanitized history for front-end rendering, while Gemini only gets sanitized text
        { role: "model", text: nextQuestion }
      ]
    });
  } catch (error: any) {
    const errorStr = typeof error === "object" ? JSON.stringify(error) : error.toString();
    const isQuota = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota");
    
    console.warn(`Agent 1 (Interviewer) API ${isQuota ? "quota hit" : "error"}. Enacting offline fallback conversational loop...`);
    
    // Offline conversational fallback
    const FALLBACK_QUESTIONS = [
      "Tell me more about your experience with scaling applications.",
      "What is the most complex architectural challenge you've solved?",
      "How do you handle severe bottlenecks in continuous deployment?",
      "Can you give an example of optimizing memory or state architectures in your past roles?",
      "Thank you for sharing. Could you outline how you manage system performance trade-offs?"
    ];
    const history = req.body.chatHistory || [];
    const userMessageCount = history.filter((m: any) => m.role === "user").length;
    const nextQuestion = FALLBACK_QUESTIONS[userMessageCount % FALLBACK_QUESTIONS.length];

    res.json({
      success: true,
      nextQuestion,
      chatHistory: [
        ...history,
        { role: "model", text: nextQuestion }
      ]
    });
  }
});

function performLocalProfileCompilation(chatHistory: any[]): UserCapabilityProfile {
  let fullName = "Expert Developer";
  let email = "engineer@continuous-agent.io";
  
  // Find any name input if exists in user onboarding / chat history
  const userTexts = chatHistory
    .filter(msg => msg.role === "user")
    .map(msg => msg.text || "");
    
  const combinedText = userTexts.join(" ");
  
  // Basic keyword extraction for tech stack
  const stackKeywords = ["react", "typescript", "node", "express", "postgresql", "postgres", "redis", "websockets", "aws", "docker", "kubernetes", "solidity", "rust", "python", "next.js", "nextjs", "tailwind"];
  const matchedStack = stackKeywords.filter(kw => combinedText.toLowerCase().includes(kw));
  
  const primaryStack = matchedStack.length > 0 
    ? matchedStack.map(m => m.charAt(0).toUpperCase() + m.slice(1)) 
    : ["TypeScript", "Node.js", "React", "PostgreSQL"];

  const deepSkills = [
    "High-Performance API Design",
    "State Lifecycle Architecture",
    "Distributed Memory Management"
  ];
  if (combinedText.toLowerCase().includes("scale") || combinedText.toLowerCase().includes("database")) {
    deepSkills.unshift("Database Query Optimization & Indexing");
  }
  if (combinedText.toLowerCase().includes("security") || combinedText.toLowerCase().includes("auth")) {
    deepSkills.unshift("Cryptographic Auditing & High-Security Systems");
  }
  if (combinedText.toLowerCase().includes("css") || combinedText.toLowerCase().includes("canvas") || combinedText.toLowerCase().includes("motion")) {
    deepSkills.unshift("Interactive Responsive Canvas Renderers & UX Orchestration");
  }

  let architecturalExperience = "Demonstrates battle-tested expertise designing modular full-stack architectures. Focuses on performance-oriented development, caching policies, and clean decoupled asynchronous components.";
  if (userTexts.length > 0) {
    const customExperience = userTexts
      .filter((t: string) => t.length > 15)
      .slice(0, 2)
      .join(" Also, ");
    if (customExperience.length > 30) {
      architecturalExperience = `Proven capabilities in technical engineering. Candidate details their hands-on architecture experience: "${customExperience.slice(0, 300)}..." Prioritizes performance efficiency and modular code quality.`;
    }
  }

  let communicationStyle = "Pragmatic & Highly Technical";
  if (combinedText.split(" ").length > 150) {
    communicationStyle = "Detailed Technical Analyst & Analytical Explainer";
  } else if (combinedText.toLowerCase().includes("solve") || combinedText.toLowerCase().includes("simple")) {
    communicationStyle = "Result-Oriented & Pragmatic Architect";
  }

  const idealRoles = [
    "Lead Backend Engineer (Scaling)",
    "Senior Full-Stack Architect",
    "Principal Technical Consultant"
  ];

  return {
    fullName,
    email,
    primary_stack: primaryStack.slice(0, 5),
    deep_skills: deepSkills.slice(0, 4),
    architectural_experience: architecturalExperience,
    communication_style: communicationStyle,
    ideal_roles: idealRoles
  };
}

/**
 * Endpoint to analyze the final interview chat history and compile the structured Capability JSON.
 * Body Parameter:
 * - `chatHistory`: Complete chat history of the interview.
 */
router.post("/compile", validateSessionHeader, async (req: Request, res: Response): Promise<void> => {
  const { chatHistory } = req.body;
  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
     res.status(400).json({ success: false, error: "Chat history is required for compilation" });
     return;
  }

  // Securely log using our masked secure log helper
  secureLog("Compile Profile Request Received", { chatHistoryLength: chatHistory.length });

  try {
    // Sanitize user inputs to scrub Personally Identifiable Information (PII) before Gemini API invocation
    const cleanChatHistory = sanitizeUserProfile(chatHistory || []) as any;

    const ai = getGeminiClient();

    // Setup Agent 1 profile compilation instructions
    const compilePrompt = `Convert the technical conversation history into a beautifully compiled Capability Profile JSON conforming exactly to the requested schema.
Analyze the candidate's answers deeply. Extract their primary_stack, deep_skills, architectural_experience (with specific trade-offs and decision justifications), observed communication_style, and ideal_roles. Keep details structured and informative.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Technical conversation history to parse into Capability Profile JSON:\n\n${JSON.stringify(cleanChatHistory, null, 2)}` }],
        }
      ],
      config: {
        systemInstruction: compilePrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            primary_stack: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            deep_skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            architectural_experience: { type: Type.STRING },
            communication_style: { type: Type.STRING },
            ideal_roles: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["fullName", "email", "primary_stack", "deep_skills", "architectural_experience", "communication_style", "ideal_roles"]
        }
      }
    });

    const parsedProfile: UserCapabilityProfile = JSON.parse(response.text || "{}");

    // Asynchronously trigger Antigravity topology state handover to the Scout agent node
    onStateHandover(parsedProfile).catch((err) => {
      secureLog("Antigravity state handover hook failed", { error: err.message });
    });

    res.json({
      success: true,
      profile: parsedProfile
    });
  } catch (error: any) {
    const errorStr = typeof error === "object" ? JSON.stringify(error) : error.toString();
    const isQuota = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota");
    console.warn(`Agent 1 Profile compilation API ${isQuota ? "quota hit" : "error"}. Enacting offline fallback conversational loop...`);
    try {
      const parsedProfile = performLocalProfileCompilation(chatHistory);
      
      // Attempt handover using fallback profile
      onStateHandover(parsedProfile).catch((err) => {
        secureLog("Antigravity state handover hook failed in fallback mode", { error: err.message });
      });

      res.json({
        success: true,
        profile: parsedProfile
      });
    } catch (fallbackError: any) {
      console.error("Local profile compilation fallback failed as well:", fallbackError);
      res.status(500).json({
        success: false,
        error: "Failed to compile capability profile",
        details: fallbackError.message,
      });
    }
  }
});

export default router;

