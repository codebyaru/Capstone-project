/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from "express";
import { getGeminiClient, MODELS } from "../utils/gemini.js";
import { 
  sanitizeUserProfile, 
  validateSessionHeader, 
  secureLog 
} from "../utils/security.js";

const router = Router();

function generateLocalProposal(profile: any, job: any): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentDay = new Date().getDate();
  const dateStr = `${currentMonth} ${currentDay}, ${currentYear}`;
  
  const candidateName = profile.fullName || "Elite Engineering Candidate";
  const email = profile.email || "candidate@engineer.io";
  const primaryStackStr = profile.primary_stack && profile.primary_stack.length > 0 
    ? profile.primary_stack.slice(0, 4).join(", ") 
    : "advanced reactive architectures & distributed systems";
  
  const deepSkills = profile.deep_skills && profile.deep_skills.length > 0 
    ? profile.deep_skills 
    : ["System Performance Optimization", "Micro-frontend Design Patterns", "State Synchronization"];
    
  const keySkill1 = deepSkills[0] || "Custom API Design";
  const keySkill2 = deepSkills[1] || "High-Throughput Concurrency";
  const archExperience = profile.architectural_experience || 
    "Experienced in solving progressive render bottlenecks, separating complex state lifecycles into decoupled async patterns, and executing robust memory profiling on large web applications.";
  
  return `Date: ${dateStr}
To: Engineering Interview Committee at ${job.companyName}

RE: Technical Partnership & Proposal for the role of ${job.title}

Dear Team,

I was incredibly excited to discover ${job.companyName}'s active efforts to solve key engineering bottlenecks. Having spent years refining multi-agent architectures and developing resilient front-end/back-end systems, I am deeply aware of the delicate design trade-offs required to scale workflows without introducing regressive compile-time or run-time lags.

After closely analyzing the requirements for the ${job.title} role, I see a direct alignment between your challenges and my core capabilities:

1. High-Performance Technology Alignment:
   My battle-tested proficiency across ${primaryStackStr} directly aligns with your active engineering footprint. I specialize in selecting and tailoring correct paradigms for state management and high-throughput execution.

2. Solved Architectural Bottlenecks:
   As detailed in my career profiling analytics: ${archExperience}
   I approach systems engineering with a relentless focus on decoupling long-running asynchronous routines and isolating locking contentions.

3. Deep Skill Application:
   - ${keySkill1}: Under heavy loads or complex scenarios, I utilize localized caching levels and strict resource-allocation guidelines to keep system latency low.
   - ${keySkill2}: I focus on component modularity and standard clean-code separation to ensure team collaboration remains effortless as the codebase grows.

In alignment with your team's mission, I believe my pragmatic, engineering-first style (${profile.communication_style || "Pragmatic & Precise"}) will immediately strengthen your development Velocity.

I would welcome a brief 10-15 minute technical conversation next week to discuss my specific suggestions for scaling your active systems.

Sincerely,

${candidateName}
${email}`;
}

/**
 * Route /api/outreach/draft-proposal
 * Ingests the profile and selected job details, and returns a tailored technical project proposal.
 */
router.post("/draft-proposal", validateSessionHeader, async (req: Request, res: Response): Promise<void> => {
  const { profile, job } = req.body;
  if (!profile || !job) {
     res.status(400).json({ success: false, error: "Both capability profile and target job are required for drafting outreach copy." });
     return;
  }

  // Securely log the incoming request
  secureLog("Draft Proposal outreach request", { profileShort: profile.fullName, jobTitle: job.title });

  try {
    // Scrub any Personally Identifiable Information (PII) before hitting the LLM model
    const cleanProfile = sanitizeUserProfile(profile);
    const cleanJob = sanitizeUserProfile(job);

    const ai = getGeminiClient();

    const outreachPrompt = `You are Agent 3: The Business Automation & Outreach Specialist.
Your task is to draft a hyper-targeted, highly professional, non-generic project proposal or cover letter.
It should read as written by an elite developer who understands the company's pain points and brings concrete experience resolving them.

Guidelines:
1. Focus directly on how the candidate's battle-tested architectural insights (from Capability Profile) solve specific issues mentioned in the job description.
2. Structure the proposal beautifully:
   - Header (Date and Target Company)
   - Professional Introduction
   - Direct Pain Point Solving (How I can help based on my specific technical insights)
   - Outline of Approach/Key Deliverables
   - Humble but confident call to action
3. DO NOT use generic buzzwords or hollow self-praise ("enthusiastic go-getter"). Keep it pragmatic, technical, and high-signal.`;

    const instructionsText = `Job Details:\n${JSON.stringify(cleanJob, null, 2)}\n\nCandidate Profile:\n${JSON.stringify(cleanProfile, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: instructionsText }] }],
      config: {
        systemInstruction: outreachPrompt,
        temperature: 0.7,
        tools: [{ googleSearch: {} }]
      }
    });

    res.json({
      success: true,
      proposalText: response.text || "Failed to generate outreach text."
    });
  } catch (error: any) {
    console.warn("Agent 3 (Outreach Specialist) Gemini calling failed, falling back to local high-fidelity generator.", error.message || error);
    try {
      const generatedDraft = generateLocalProposal(profile, job);
      res.json({
        success: true,
        proposalText: generatedDraft
      });
    } catch (fallbackError: any) {
      console.error("Agent 3 Fallback generation failed:", fallbackError);
      res.status(500).json({
        success: false,
        error: "Failed to generate proposal copy copy",
        details: fallbackError.message,
      });
    }
  }
});

/**
 * Endpoint /api/outreach/google-doc
 * Automatically creates a beautifully organized Google Document in the user's Drive.
 * Expects 'Authorization' header containing bearer Google OAuth token.
 */
router.post("/google-doc", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
       res.status(401).json({ success: false, error: "Google OAuth Access Token is required via 'Authorization: Bearer <token>' header" });
       return;
    }

    const token = authHeader.split(" ")[1];
    const { documentTitle, proposalText } = req.body;

    if (!documentTitle || !proposalText) {
       res.status(400).json({ success: false, error: "documentTitle and proposalText are mandatory" });
       return;
    }

    // 1. Send REST request to Google Docs API to create the empty document
    const createDocRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title: documentTitle })
    });

    if (!createDocRes.ok) {
      const errDetail = await createDocRes.text();
      throw new Error(`Google API responded with error during creation: ${errDetail}`);
    }

    const docData = await createDocRes.json();
    const documentId = docData.documentId;

    // 2. Append the generated HTML/Markdown content to the document
    const updateDocRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              text: proposalText,
              location: { index: 1 }
            }
          }
        ]
      })
    });

    if (!updateDocRes.ok) {
      const errDetail = await updateDocRes.text();
      throw new Error(`Google API responded with error during insertion: ${errDetail}`);
    }

    res.json({
      success: true,
      documentId,
      documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
      infoMessage: "Successfully drafted Google Doc directly in your Workspace folder!"
    });
  } catch (error: any) {
    console.error("Agent 3 (Google Doc Automation) Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to automatically provision Google Document",
      details: error.message
    });
  }
});

/**
 * Endpoint /api/outreach/gmail-draft
 * Creates a ready-to-send email draft directly in the user's Gmail box.
 * Expects 'Authorization' header containing bearer Google OAuth token.
 */
router.post("/gmail-draft", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
       res.status(401).json({ success: false, error: "Google OAuth Access Token is required via 'Authorization: Bearer <token>' header" });
       return;
    }

    const token = authHeader.split(" ")[1];
    const { toEmail, subject, introMessage, proposalText } = req.body;

    if (!subject || !proposalText) {
       res.status(400).json({ success: false, error: "subject and proposalText are mandatory" });
       return;
    }

    // Assemble email content inside standard RFC822 format
    const emailBody = `${introMessage || "Hello,\n\nPlease find my customized project proposal attached below.\n\n"}\n\n=========================================\n${proposalText}\n=========================================`;
    
    const emailContent = [
      `To: ${toEmail || ""}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      emailBody
    ].join("\r\n");

    // Perform standard Base64url safe encoding as required by Gmail API
    const base64SafeMessage = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send HTTP REST call to create the draft in user's Gmail box
    const draftRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        message: {
          raw: base64SafeMessage
        }
      })
    });

    if (!draftRes.ok) {
      const errDetail = await draftRes.text();
      throw new Error(`Gmail API creation failed: ${errDetail}`);
    }

    const draftData = await draftRes.json();

    res.json({
      success: true,
      draftId: draftData.id,
      draftUrl: "https://mail.google.com/mail/#drafts", // Take user direct to drafts catalog
      infoMessage: "Successfully constructed the tailored proposal draft inside your Gmail inbox!"
    });
  } catch (error: any) {
    console.error("Agent 3 (Gmail Automation) Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create Gmail email draft",
      details: error.message
    });
  }
});

/**
 * Route /api/outreach/generate-asset
 * Generates high quality asset images (such as profile avatars or professional cover banners)
 * using the modern gemini-3-pro-image-preview model with 1K/2K/4K resolution options.
 */
router.post("/generate-asset", validateSessionHeader, async (req: Request, res: Response): Promise<void> => {
  const { prompt, size, aspectRatio } = req.body;
  if (!prompt) {
    res.status(400).json({ success: false, error: "Prompt is required for image generation." });
    return;
  }

  secureLog("Asset image generation request received", { size, aspectRatio, promptLength: prompt.length });

  // Map requested sizes (1K, 2K, 4K) into detailed high-fidelity prompt cues
  let resolutionCue = "high resolution 1K details, razor-sharp vector textures, photorealistic professional depth";
  if (size === "2K") {
    resolutionCue = "ultra high-definition 2K resolution, premium professional publication quality, cinema-line detailed lighting";
  } else if (size === "4K") {
    resolutionCue = "ultra absolute fidelity masterwork, pristine 4K resolution, gorgeous fine textures, global illumination, studio grade render";
  }

  const finalPrompt = `${prompt} -> Styled in a clean professional tech vibe, ${resolutionCue}.`;

  try {
    const ai = getGeminiClient();
    let base64Bytes = "";
    let engineUsed = "gemini-3-pro-image-preview";

    try {
      // Primary model: gemini-3-pro-image-preview
      const response = await ai.models.generateImages({
        model: "gemini-3-pro-image-preview",
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: aspectRatio || "1:1"
        }
      });

      if (response && response.generatedImages && response.generatedImages.length > 0) {
        base64Bytes = response.generatedImages[0].image.imageBytes;
      } else {
        throw new Error("No image bytes returned in the primary request");
      }
    } catch (primaryErr: any) {
      console.warn("Primary image generation model [gemini-3-pro-image-preview] failed/unsupported. Falling back to [imagen-3.0-generate-002].", primaryErr.message || primaryErr);
      engineUsed = "imagen-3.0-generate-002";

      // Fallback model: imagen-3.0-generate-002
      const fallbackResponse = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: aspectRatio || "1:1"
        }
      });

      if (fallbackResponse && fallbackResponse.generatedImages && fallbackResponse.generatedImages.length > 0) {
        base64Bytes = fallbackResponse.generatedImages[0].image.imageBytes;
      } else {
        throw new Error("No image bytes returned in fallback engine request");
      }
    }

    res.json({
      success: true,
      image: `data:image/jpeg;base64,${base64Bytes}`,
      engine: engineUsed,
      size,
      aspectRatio
    });
  } catch (err: any) {
    console.error("Critical image generation failure:", err);
    
    // In case the workspace key is missing or quotas are restricted, return a beautiful placeholder to preserve frontend demo capability
    const fallbackPicSumUrl = `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 15))}/${aspectRatio === "16:9" ? "1280/720" : "800/800"}`;
    
    res.json({
      success: true,
      image: fallbackPicSumUrl,
      engine: "offline-sandbox-fallback",
      size,
      aspectRatio,
      warning: "Returned fallback placeholder image due to credentials/quota restriction."
    });
  }
});

export default router;
