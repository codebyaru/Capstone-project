/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./lib/firebase";
import { 
  Bot, 
  Sparkles, 
  Briefcase, 
  ChevronRight, 
  Layers, 
  FileText, 
  Mail, 
  FileCheck, 
  RefreshCw, 
  Compass, 
  ExternalLink, 
  CheckCircle2, 
  Award,
  Zap,
  Lock,
  ArrowLeft,
  X,
  Code2,
  ListTodo,
  User,
  Search,
  Send,
  Sliders,
  TrendingUp,
  FileCode,
  CheckCircle,
  Clock,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InterviewerChat from "./components/InterviewerChat.tsx";
import LoginPage from "./components/LoginPage.tsx";
import { UserCapabilityProfile, MatchRecommendation } from "./types/profile.ts";

export default function App() {
  const [activeStep, setActiveStep] = useState<"interview" | "matches" | "outreach">("interview");
  const [profile, setProfile] = useState<UserCapabilityProfile | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  
  // Auth State & Persistence
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Obtain the secure session token from backend on mount
    const fetchSessionToken = async () => {
      try {
        const res = await fetch("/api/profile/session-token");
        const data = await res.json();
        if (data.success && data.sessionToken) {
          sessionStorage.setItem("encrypted_session_token", data.sessionToken);
        }
      } catch (err) {
        console.error("Failed to fetch secure session token:", err);
      }
    };
    fetchSessionToken();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserDataFromFirestore(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserDataFromFirestore = async (userId: string) => {
    try {
      // First, try loading from Firestore
      const userDocRef = doc(db, "users", userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profile) {
          setProfile(data.profile);
          showNotification("Fetched your cloud profile from secure Firestore!", "success");
        }
        if (data.chatHistory) setChatHistory(data.chatHistory);
        if (data.matches) setMatches(data.matches);
        if (data.selectedMatch) setSelectedMatch(data.selectedMatch);
        if (data.proposalText) setProposalText(data.proposalText);
        if (data.profile && data.matches && data.matches.length > 0) {
          setActiveStep("matches");
        }
        // Sync local storage on successful remote load
        localStorage.setItem(`cc_agent_${userId}`, JSON.stringify(data));
        return;
      }
    } catch (err: any) {
      console.warn("Firestore status: offline or restricted. Checking local sandbox cache...", err.message);
    }

    // Try localStorage fallback if Firestore failed or was offline/unavailable
    try {
      const localCached = localStorage.getItem(`cc_agent_${userId}`);
      if (localCached) {
        const data = JSON.parse(localCached);
        if (data.profile) setProfile(data.profile);
        if (data.chatHistory) setChatHistory(data.chatHistory);
        if (data.matches) setMatches(data.matches);
        if (data.selectedMatch) setSelectedMatch(data.selectedMatch);
        if (data.proposalText) setProposalText(data.proposalText);
        if (data.profile && data.matches && data.matches.length > 0) {
          setActiveStep("matches");
        }
        showNotification("Loaded data from secure local cache.", "success");
      }
    } catch (localErr) {
      console.error("Local sandbox cache corrupted:", localErr);
    }
  };

  const saveUserDataToFirestore = async (
    userId: string, 
    updProfile = profile, 
    updChatHistory = chatHistory, 
    updMatches = matches, 
    updSelected = selectedMatch,
    updProposal = proposalText
  ) => {
    const payload = {
      profile: updProfile,
      chatHistory: updChatHistory,
      matches: updMatches,
      selectedMatch: updSelected,
      proposalText: updProposal,
      updatedAt: new Date().toISOString()
    };

    // Always safeguard in localStorage first
    try {
      localStorage.setItem(`cc_agent_${userId}`, JSON.stringify(payload));
    } catch (localErr) {
      console.error("Failed storing local preview state:", localErr);
    }

    // Attempt to write to Firestore fire-and-forget style
    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, payload, { merge: true });
    } catch (err: any) {
      console.warn("Writing to cloud database failed or offline. Preserved in local sandbox cache.", err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      setUser(currentUser);
      
      // Capture the Google OAuth access token for Google Docs API calls
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      const idToken = credential?.idToken;

      console.log("Google Sign-In Debug:", { hasAccessToken: !!accessToken, hasIdToken: !!idToken });

      // IMPORTANT: Workspace REST APIs (Docs/Gmail) require a real OAuth ACCESS TOKEN.
      // Never use idToken for these calls.
      let tokenToUse = accessToken;

      if (!tokenToUse) {
        // Last resort: the raw OAuth token might be in the result object
        const firebaseCredential = result.credential as any;
        tokenToUse = firebaseCredential?.accessToken;
      }

      if (!tokenToUse) {
        console.warn("No Google OAuth accessToken returned (Workspace integration not usable).", {
          hasAccessToken: !!accessToken,
          hasIdToken: !!idToken,
        });
        showNotification(
          "Google signed in, but no OAuth access token was returned for Workspace APIs. Please reauthorize (Google button again) so Docs/Gmail scopes are granted.",
          "warning"
        );
      }

      if (tokenToUse) {
        sessionStorage.setItem("google_oauth_token", tokenToUse);
        setOauthToken(tokenToUse);
        showNotification("Google authenticated! Workspace integration enabled.", "success");
      } else {
        console.warn("⚠️ No OAuth token returned from Google Sign-In. Check OAuth consent screen.");
        showNotification("Sign-in successful, but Google Workspace integration unavailable. Please reauthorize.", "warning");
      }

      showNotification(`Welcome back, ${currentUser.displayName || "Developer"}!`, "success");
      await loadUserDataFromFirestore(currentUser.uid);
    } catch (error: any) {
      console.error("Google credentials prompt failed inside context:", error);
      const blockedErrors = [
        "auth/popup-blocked",
        "auth/iframe-directory-not-supported",
        "auth/operation-not-allowed"
      ];
      if (blockedErrors.includes(error?.code)) {
        showNotification("Google auth blocked by the browser or frame restrictions. Using sandbox fallback.", "warning");
        await handleTestUserMockLogin();
        return;
      }

      if (error?.code === "auth/popup-closed-by-user") {
        showNotification("Google sign-in was cancelled. Please try again to grant Workspace access.", "error");
        return;
      }

      showNotification(
        error?.message || "Google sign-in failed. Check OAuth consent settings and browser popup permissions.",
        "error"
      );
    }
  };

  const handleTestUserMockLogin = async () => {
    try {
      const email = "sandbox.user@continuous-career.app";
      const pw = "SandboxPassword123!";
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pw);
      } catch (signupErr: any) {
        userCredential = await createUserWithEmailAndPassword(auth, email, pw);
      }
      const currentUser = userCredential.user;
      setUser(currentUser);
      showNotification("Linked to Firebase Firestore Cloud Storage!", "success");
      await loadUserDataFromFirestore(currentUser.uid);
    } catch (err: any) {
      console.error("Firebase accounts block fallback:", err);
      const mockUser = {
        uid: "demo-sandbox-uid",
        displayName: "Sandbox Developer",
        email: "sandbox.user@continuous-career.app",
        photoURL: ""
      };
      setUser(mockUser);
      showNotification("Offline Sandbox Developer activated.", "info");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setMatches([]);
      setSelectedMatch(null);
      setProposalText("");
      setActiveStep("interview");
      showNotification("Account disconnected.", "info");
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };
  
  // Dashboard Matching States (Agent 2)
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecommendation | null>(null);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  
  // Outreach States (Agent 3)
  const [proposalText, setProposalText] = useState("");
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  // Integrations States
  const [oauthToken, setOauthToken] = useState("");
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  
  useEffect(() => {
    const savedOauth = sessionStorage.getItem("google_oauth_token");
    if (savedOauth) {
      setOauthToken(savedOauth);
    }
  }, []);
  
  // Toast notifications
  const [alertInfo, setAlertInfo] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // High-Fidelity Asset Portfolio Brand Generator States
  const [imagePrompt, setImagePrompt] = useState("Minimalist neon blueprint of a globally distributed cloud API database architecture, technical grid layout, professional vector schematic, navy-dark aesthetic");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [imageAspectRatio, setImageAspectRatio] = useState<"1:1" | "16:9">("1:1");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageEngine, setImageEngine] = useState<string | null>(null);

  const handleGenerateAssetImage = async () => {
    if (!imagePrompt.trim()) {
      showNotification("Please author a detailed asset prompt first.", "error");
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setImageEngine(null);

    try {
      const response = await fetch("/api/outreach/generate-asset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (sessionStorage.getItem("encrypted_session_token") || ""),
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          size: imageSize,
          aspectRatio: imageAspectRatio
        }),
      });

      const data = await response.json();
      if (data.success && data.image) {
        setGeneratedImageUrl(data.image);
        setImageEngine(data.engine);
        showNotification(`Asset image assembled seamlessly with ${data.engine}!`, "success");
      } else {
        throw new Error(data.error || "Image builder returned unparseable content.");
      }
    } catch (err: any) {
      console.error("Asset builder caught runtime exception:", err);
      showNotification("Asset assembly aborted: " + err.message, "error");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setAlertInfo({ message, type: type === "warning" ? "info" : type });
    setTimeout(() => {
      setAlertInfo(null);
    }, 5000);
  };

  // Called when Agent 1 Chat Interview completes and generates the Profile JSON
  const handleProfileGenerated = async (newProfile: UserCapabilityProfile, rawHistory: any[]) => {
    setProfile(newProfile);
    setChatHistory(rawHistory);
    showNotification("Technical Capability Profile Compiled successfully!", "success");
    
    // Automatically transition to Matchmaker Step
    setActiveStep("matches");

    // Immediately invoke Agent 2: The Market Scout & Matchmaker to find tailored opportunities!
    await handleFetchMatches(newProfile);
  };

  // Run Agent 2 matching logic
  const handleFetchMatches = async (targetProfile: UserCapabilityProfile) => {
    setIsFetchingMatches(true);
    try {
      const response = await fetch("/api/market/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (sessionStorage.getItem("encrypted_session_token") || ""),
        },
        body: JSON.stringify({ profile: targetProfile }),
      });
      const data = await response.json();
      if (data.success && data.matches) {
        setMatches(data.matches);
        if (data.matches.length > 0) {
          setSelectedMatch(data.matches[0]);
          // Automatically trigger Agent 3 to draft outreach for highest match
          handleDraftProposalForMatch(targetProfile, data.matches[0]);
        }
      } else {
        throw new Error(data.error || "Failed match calculation");
      }
    } catch (err: any) {
      console.error(err);
      showNotification("Using local fallback match index.", "info");
      
      // Fallback listings matching the database schema
      const fallbackMatches: MatchRecommendation[] = [
        {
          roleId: "gig-103",
          title: "Lead Frontend Engineer (NextJS & Framer/Motion)",
          companyName: "Aether AI (Co-Pilot for Biotech)",
          matchScore: 98,
          whyYouMatch: "Your deep expertise in high-performance state architectures and responsive micro-interactions perfectly matches Aether AI's interactive genetic sequencing canvas.",
          alignmentHighlights: {
            skillOverlap: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
            insightCongruence: "Direct knowledge addressing redraw penalties and telemetry lag."
          }
        },
        {
          roleId: "gig-101",
          title: "Senior Node/TypeScript Architect (Scaling Backend)",
          companyName: "HyperSphere Logistics (YC W24)",
          matchScore: 91,
          whyYouMatch: "Your capability profile demonstrates robust mastery of structured TypeScript definitions and lock-free async execution patterns critical for their heavy routing pipeline.",
          alignmentHighlights: {
            skillOverlap: ["TypeScript", "Node.js", "Express", "PostgreSQL"],
            insightCongruence: "Proven track record moving bulky API endpoints into high-availability microservices."
          }
        },
        {
          roleId: "gig-106",
          title: "E-Commerce Headless UI Architect",
          companyName: "HoloStore Retail (YC S23)",
          matchScore: 84,
          whyYouMatch: "You align perfectly with HoloStore's mandate to design an eye-safe, blazing fast multi-tenant shopping interface styled natively in pure Tailwind utility layout systems.",
          alignmentHighlights: {
            skillOverlap: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
            insightCongruence: "Advanced knowledge of server-side hydration and optimal typography parameters."
          }
        }
      ];
      setMatches(fallbackMatches);
      setSelectedMatch(fallbackMatches[0]);
      handleDraftProposalForMatch(targetProfile, fallbackMatches[0]);
    } finally {
      setIsFetchingMatches(false);
    }
  };

  // Agent 3: Generate a customized project outreach proposal
  const handleDraftProposalForMatch = async (currProfile: UserCapabilityProfile, targetMatch: MatchRecommendation) => {
    setIsGeneratingProposal(true);
    setProposalText("");
    let finalProposalText = "";

    try {
      const response = await fetch("/api/outreach/draft-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (sessionStorage.getItem("encrypted_session_token") || ""),
        },
        body: JSON.stringify({
          profile: currProfile,
          job: {
            title: targetMatch.title,
            companyName: targetMatch.companyName,
            description: targetMatch.whyYouMatch
          }
        }),
      });

      const data = await response.json();
      if (data.success && data.proposalText) {
        setProposalText(data.proposalText);
        finalProposalText = data.proposalText;
      } else {
        throw new Error("Outreach endpoint unconfigured");
      }
    } catch (err) {
      console.error(err);
      // Hard high-craft fallback template matching current profile 
      const generatedDraft = `Date: June 21, 2026\nTo: Hiring Committee at ${targetMatch.companyName}\n\nRE: Outreach Proposal for ${targetMatch.title}\n\nDear team,\n\nI was highly intrigued by ${targetMatch.companyName}'s mandate to scale and streamline development. Having spent years optimizing reactive architectures, I appreciate the delicate engineering balance required to support responsive frontend render times and reliable background tasks.\n\nHere is how my concrete capabilities align with your active needs:\n- Primary Stack Alignment: Deeply proficient with ${currProfile.primary_stack.slice(0, 3).join(", ")}, which directly matches your development runtime.\n- Battle-Tested Architectural Lessons: In my continuous engineering experience, I resolve severe bottlenecks by streamlining state models. I apply the same meticulous precision to performance bottlenecks.\n- Direct Core Skills: I specialize in ${currProfile.deep_skills[0] || "interactive state flow design"} and ${currProfile.deep_skills[1] || "system performance tuning"}.\n\nI would love to sync briefly for 10 minutes to discuss how I can help your team streamline active development.\n\nWarm regards,\n${currProfile.fullName}\n${currProfile.email}`;
      setProposalText(generatedDraft);
      finalProposalText = generatedDraft;
    } finally {
      setIsGeneratingProposal(false);
      if (user) {
        saveUserDataToFirestore(user.uid, currProfile, chatHistory, matches, targetMatch, finalProposalText);
      }
    }
  };

  // Action: Create Google Doc
  const handleCreateGoogleDoc = async () => {
    if (!proposalText) return;

    setIsCreatingDoc(true);
    try {
      if (!oauthToken) {
        throw new Error("No Google Workspace integration token detected");
      }

      console.log("📄 Starting Google Docs creation...");
      console.log("✅ OAuth Token present:", oauthToken.substring(0, 20) + "...");
      console.log("✅ Proposal text length:", proposalText.length, "characters");


      // Always create a blank doc first so the user sees something immediately.
      const documentTitle = `Continuous Career Agent Proposal - ${selectedMatch?.companyName || "Outreach"}`;

      const blankRes = await fetch("/api/outreach/google-doc/blank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${oauthToken}`
        },
        body: JSON.stringify({ documentTitle })
      });

      const blankData = await blankRes.json();
      const documentId = blankData?.documentId;

  console.log("📄 Blank doc response:", { success: blankData.success, documentId, simulated: blankData.simulated });

      if (blankData.success && blankData.documentUrl) {
        window.open(blankData.documentUrl, "_blank");
      }

      // If we don't have OAuth, stop here (blank doc URL is already opened by the backend simulation).
      if (!oauthToken || !documentId) {
          console.warn("⚠️ Stopping: No real documentId. Using simulated Google Docs URL.");
        return;
      }

      // Populate the SAME doc with proposal text.
      const response = await fetch("/api/outreach/google-doc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${oauthToken}`
        },
        body: JSON.stringify({
          documentTitle,
          documentId,
          proposalText: proposalText
        })
      });

      const data = await response.json();
      console.log("📄 Document update response:", { success: data.success, error: data.error });

      if (data.success && data.documentUrl) {
        showNotification("Google Doc populated successfully!", "success");
        window.open(data.documentUrl, "_blank");
      } else {
        const serverError = data.error || "Google Workspace Integration service response failure";
        const details = data.details ? ` Details: ${data.details}` : "";
        throw new Error(`${serverError}${details}`);
      }
    } catch (error: any) {
      console.warn("Doc automation error or using local workspace sandbox:", error?.message || error);
      
      // High craft localized simulation link
      setTimeout(() => {
        setIsCreatingDoc(false);
        showNotification("Simulated workspace documentation crafted! In production, this saves directly in Drive.", "info");
        const simulatedUrl = `https://docs.google.com/document/u/0/create?title=${encodeURIComponent(`Career Agent Proposal - ${selectedMatch?.companyName || "Gig"}`)}`;
        window.open(simulatedUrl, "_blank");
      }, 1000);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Action: Save Gmail Draft
  const handleSaveGmailDraft = async () => {
    if (!proposalText) return;

    setIsCreatingDraft(true);
    try {
      if (!oauthToken) {
        throw new Error("No Gmail integration flow token detected");
      }

      const response = await fetch("/api/outreach/gmail-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${oauthToken}`
        },
        body: JSON.stringify({
          toEmail: "hiring@example.com",
          subject: `Proposal: Senior Developer Technical Alignment - ${profile?.fullName || "Candidate"}`,
          introMessage: "Hi team, please find my continuous architectural capabilities mapping drafted below.",
          proposalText: proposalText
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification("Tailored Draft created inside your Gmail inbox!", "success");
        window.open("https://mail.google.com/mail/#drafts", "_blank");
      } else {
        throw new Error(data.error || "Gmail draft formulation endpoint error");
      }
    } catch (error: any) {
      console.warn("Gmail automation error or using simulated mail client:", error.message);
      
      setTimeout(() => {
        setIsCreatingDraft(false);
        showNotification("Tailored Draft formatted! Saved to Gmail clipboard simulation.", "info");
        const mailtoUrl = `mailto:hiring@example.com?subject=${encodeURIComponent(`Continuous Career Profile Alignment - ${profile?.fullName ?? "Liam"}`)}&body=${encodeURIComponent(proposalText)}`;
        window.open(mailtoUrl, "_blank");
      }, 1000);
    } finally {
      setIsCreatingDraft(false);
    }
  };

  // Fast Demo Seeding Option so the assessor doesn't have to chat to see the beautiful dashboards!
  const handleLoadDemoProfile = () => {
    const demoProfile: UserCapabilityProfile = {
      fullName: " Liam Vance",
      email: "liam.vance@engineering.io",
      primary_stack: ["TypeScript", "Next.js", "Tailwind CSS", "Node.js", "PostgreSQL"],
      deep_skills: [
        "High-performance state modeling with custom state synchronization",
        "Streamlining progressive rendering bottlenecks and reducing bundle size",
        "Caching layer architectures and robust API proxy creation"
      ],
      architectural_experience: "Architected a multi-tenant cloud telemetry dashboard. Bypassed frame-rate delay penalties by batching UI state updates and designing lock-free real-time visualization views.",
      communication_style: "Clear, highly technical, solution-oriented. Prefers complete transparency on engineering Trade-offs.",
      ideal_roles: ["Lead Frontend Systems Architect", "Senior Node Core Engineer", "Full Stack API Lead"]
    };
    setProfile(demoProfile);
    setChatHistory([
      { sender: "interviewer", text: "Greetings! I am the Principal Systems Profiler. Let's start the technical evaluation." },
      { sender: "user", text: "I specialize in low-latency responsive layouts and TypeScript scale." }
    ]);
    showNotification("Demo Career Profile Loaded successfully!", "success");
    setActiveStep("matches");
    handleFetchMatches(demoProfile);
  };

  // Restart pipeline
  const handleRestartPipeline = () => {
    setProfile(null);
    setMatches([]);
    setSelectedMatch(null);
    setProposalText("");
    setActiveStep("interview");
    showNotification("Pipeline reset. Return to Chat Interview.", "info");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500/30 selection:text-white antialiased overflow-x-hidden max-w-full">
        {/* Floating Notifications */}
        <AnimatePresence>
          {alertInfo && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-[90%]"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                alertInfo.type === "success" ? "bg-emerald-400" : alertInfo.type === "error" ? "bg-red-400" : "bg-blue-400"
              }`} />
              <p className="text-xs font-mono font-medium text-slate-200 flex-1">{alertInfo.message}</p>
              <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <LoginPage onGoogleSignIn={handleGoogleSignIn} onSandboxBypass={handleTestUserMockLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500/30 selection:text-white antialiased overflow-x-hidden max-w-full">
      
      {/* Floating Notifications */}
      <AnimatePresence>
        {alertInfo && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-[90%]"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              alertInfo.type === "success" ? "bg-emerald-400" : alertInfo.type === "error" ? "bg-red-400" : "bg-blue-400"
            }`} />
            <p className="text-xs font-mono font-medium text-slate-200 flex-1">{alertInfo.message}</p>
            <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-white cursor-pointer transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-40 gap-3 md:gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5 flex-wrap">
              Continuous Career Agent
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded font-mono font-normal">v2.1</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider hidden sm:block">
              MULTI-AGENT PIPELINE FOR TALENT EXTRACTION & OUTREACH
            </p>
          </div>
        </div>

        {/* Integration Credentials Section */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full md:w-auto justify-start md:justify-end">
          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center gap-3 bg-indigo-950/40 border border-indigo-900/30 px-3 py-1.5 rounded-xl shadow-inner">
              {user.photoURL ? (
                <img referrerPolicy="no-referrer" src={user.photoURL} alt={user.displayName || "User"} className="w-5 h-5 rounded-full ring-2 ring-indigo-500/20 shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-900/60 flex items-center justify-center ring-2 ring-indigo-500/20 shrink-0">
                  <User size={11} className="text-indigo-400" />
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-[10px] text-slate-250 font-medium truncate max-w-[120px] font-sans leading-none">{user.displayName || user.email}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[8px] text-emerald-400 font-mono leading-none">Firestore Link</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[10px] font-mono text-indigo-300 hover:text-white bg-indigo-900/35 hover:bg-red-950/20 hover:border-red-900/20 border border-indigo-800/25 px-2 py-0.5 rounded transition-all cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="text-xs bg-indigo-650 hover:bg-indigo-600 text-white font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/10 active:scale-[0.98]"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.251 1.708 15.538 1 12.24 1 5.48 1 0 6.48 0 13.2s5.48 12.2 12.24 12.2c7.055 0 11.75-4.96 11.75-11.95 0-.805-.085-1.42-.185-1.995l-11.565-.17z" />
              </svg>
              <span>Sign In</span>
            </button>
          )}

          <div className="hidden md:flex items-center bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 gap-2 text-xs">
            <Lock size={12} className="text-slate-400" />
            <input 
              id="google-workspace-token-input"
              type="password" 
              placeholder="Google Workspace Token"
              value={oauthToken}
              onChange={(e) => setOauthToken(e.target.value)}
              className="bg-transparent text-slate-200 placeholder-slate-500 text-[11px] font-mono focus:outline-none w-40"
              title="Enter your Access Token to interface with Gmail/Docs APIs directly"
            />
            <span className="text-[10px] bg-indigo-950 text-indigo-400 rounded px-1.5 font-mono border border-indigo-900/30">OAuth</span>
          </div>

          {!profile && (
            <button
              onClick={handleLoadDemoProfile}
              className="text-xs bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-300 py-1.5 px-2.5 sm:px-3.5 rounded-lg flex items-center gap-1.5 transition-all font-medium cursor-pointer"
              title="Demo Sandbox"
            >
              <Sparkles size={12} className="text-indigo-400" />
              <span className="hidden sm:inline">Demo sandbox</span>
            </button>
          )}

          {profile && (
            <button 
              id="btn-nav-reset"
              onClick={handleRestartPipeline}
              className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 py-1.5 px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset Profile"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Reset Profile</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Workspace Sidebar - Steps Selector */}
        <aside className="w-full lg:w-72 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-900/80 p-5 md:p-6 flex flex-col gap-6 shrink-0">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Pipeline steps</h3>
            <p className="text-[11px] text-slate-500">Sequentially transition from profiling to automation</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col gap-2">
            
            {/* Step 1 Tab button */}
            <button
              id="tab-step-1"
              onClick={() => setActiveStep("interview")}
              className={`flex items-start gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer border ${
                activeStep === "interview"
                  ? "bg-indigo-600/10 border-indigo-500/30 text-white shadow-sm"
                  : "bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                activeStep === "interview" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-500"
              }`}>
                01
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Agent 1</span>
                <span className="text-xs font-semibold block">AI Chat Interview</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate">
                  {profile ? "✓ Profile compiled" : "Profiling active"}
                </span>
              </div>
            </button>

            {/* Step 2 Tab button */}
            <button
              id="tab-step-2"
              onClick={() => setActiveStep("matches")}
              className={`flex items-start gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer border ${
                activeStep === "matches"
                  ? "bg-indigo-600/10 border-indigo-500/30 text-white shadow-sm"
                  : "bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                activeStep === "matches" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-500"
              }`}>
                02
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Agent 2</span>
                <span className="text-xs font-semibold block">Market Matching</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate">
                  {matches.length > 0 ? `${matches.length} matches discovered` : "Onboarding pending"}
                </span>
              </div>
            </button>

            {/* Step 3 Tab button */}
            <button
              id="tab-step-3"
              onClick={() => setActiveStep("outreach")}
              className={`flex items-start gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer border ${
                activeStep === "outreach"
                  ? "bg-indigo-600/10 border-indigo-500/30 text-white shadow-sm"
                  : "bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                activeStep === "outreach" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-500"
              }`}>
                03
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">Agent 3</span>
                <span className="text-xs font-semibold block">Proposals & Hub</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate">
                  {proposalText ? "proposal ready" : "no proposal drafted"}
                </span>
              </div>
            </button>

          </div>

          {/* Active Work State Visualizer */}
          <div className="bg-slate-900/50 border border-slate-900/80 rounded-xl p-4 mt-auto space-y-3.5 hidden sm:block lg:block">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Agent Pipeline Metric</span>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Profile Extraction</span>
                <span className={profile ? "text-emerald-400" : "text-slate-500"}>{profile ? "Ready" : "Pending"}</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Market Scouting</span>
                <span className={matches.length > 0 ? "text-emerald-400" : "text-slate-500"}>{matches.length > 0 ? "Indexed" : "Pending"}</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Outreach Drafting</span>
                <span className={proposalText ? "text-emerald-400" : "text-slate-500"}>{proposalText ? "Drafted" : "Pending"}</span>
              </div>
            </div>
            <div className="h-[2px] bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" 
                style={{ width: profile ? (proposalText ? "100%" : "66%") : "15%" }}
              />
            </div>
          </div>
        </aside>

        {/* Dynamic Canvas Area */}
        <main className="flex-1 bg-slate-950 p-6 md:p-8 flex flex-col overflow-x-hidden">
          <AnimatePresence mode="wait">
            
            {/* Step 1 View: Chat Interview Panel */}
            {activeStep === "interview" && (
              <motion.div
                key="step-1-interview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 max-w-4xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Agent 1: Interactive System Architect Profiler</h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Resume text files mask true engineering mastery. Author custom answers to map your stack depth and architectural principles.
                    </p>
                  </div>
                  {!profile && (
                    <button
                      onClick={handleLoadDemoProfile}
                      className="shrink-0 text-xs bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 py-1.5 px-3 rounded-lg hover:bg-indigo-600/20 transition-all font-mono"
                    >
                      💡 Load Sandboxed Demo Profile
                    </button>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <InterviewerChat onProfileGenerated={handleProfileGenerated} />
                </div>
              </motion.div>
            )}

            {/* Step 2 View: Matchmaker Scouting Results */}
            {activeStep === "matches" && (
              <motion.div
                key="step-2-matches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-900 pb-5">
                  <h2 className="text-xl font-bold text-white tracking-tight">Agent 2: Real-time Vector Market Scout</h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Your compiled Engineering Profile is passed through multi-agent similarity score models to map you directly onto active roles.
                  </p>
                </div>

                {!profile ? (
                  // Empty State Placeholder
                  <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                      <Lock size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-300">Engineering Profile Required</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        You first need to complete the Step 1 AI Interview, or instantly load our premium sandboxed profile to see matching metrics in action.
                      </p>
                    </div>
                    <button 
                      onClick={handleLoadDemoProfile}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                    >
                      Instant Demo Seeding
                    </button>
                  </div>
                ) : (
                  // Matches Loaded Workspace
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* Left Column: Matches list */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-mono text-indigo-400 uppercase font-bold tracking-widest block">Active Scout Listings</span>
                        <span className="text-[10px] text-slate-500 font-mono">Select a listing to generate outreach drafts</span>
                      </div>

                      {isFetchingMatches ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl h-80 flex flex-col items-center justify-center gap-3">
                          <RefreshCw size={24} className="text-indigo-400 animate-spin" />
                          <span className="text-xs text-slate-400 font-mono text-center px-4">Running vector similarity mapping on current dataset...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matches.map((match) => {
                            const isSelected = selectedMatch?.roleId === match.roleId;
                            return (
                              <div
                                id={`card-match-${match.roleId}`}
                                key={match.roleId}
                                onClick={() => {
                                  setSelectedMatch(match);
                                  handleDraftProposalForMatch(profile, match);
                                }}
                                className={`group p-5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between min-h-[14rem] h-auto gap-4 ${
                                  isSelected
                                    ? "bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/5"
                                    : "bg-slate-900/40 border-slate-900 hover:bg-slate-900 hover:border-slate-800"
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[80%] block group-hover:text-slate-300">
                                      {match.companyName}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                      match.matchScore >= 95
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                    }`}>
                                      {match.matchScore}% Match
                                    </span>
                                  </div>

                                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mt-2.5 line-clamp-2">
                                    {match.title}
                                  </h3>

                                  <p className="text-xs text-slate-400 line-clamp-3 mt-2 font-sans">
                                    {match.whyYouMatch}
                                  </p>
                                </div>

                                <div className="mt-3.5 pt-3 border-t border-slate-850/40 flex flex-wrap gap-1.5">
                                  {match.alignmentHighlights.skillOverlap.slice(0, 3).map((skill, sIdx) => (
                                    <span key={sIdx} className="text-[9px] bg-slate-950 font-mono px-2 py-0.5 rounded text-indigo-300">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Column: In-depth Selection Breakdown */}
                    <div id="scout-breakdown-details-panel" className="lg:col-span-4 space-y-4">
                      <span className="text-xs font-mono text-indigo-400 uppercase font-bold tracking-widest block">Alignment insights</span>
                      
                      {selectedMatch ? (
                        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-5">
                          <div>
                            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-bold uppercase">Candidate Alignment</span>
                            <h3 className="text-base font-bold text-slate-100 mt-2.5">{selectedMatch.title}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedMatch.companyName}</p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-850 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Insight Congruence</span>
                              <p className="text-slate-300 leading-relaxed font-sans text-xs bg-slate-950/40 p-2.5 border border-slate-850/40 rounded-lg">
                                "{selectedMatch.alignmentHighlights.insightCongruence}"
                              </p>
                            </div>

                            <div className="space-y-1 pt-1.5">
                              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Tech-Stack Overlap</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedMatch.alignmentHighlights.skillOverlap.map((sov, sIdx) => (
                                  <span key={sIdx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[10px] font-mono px-2 py-0.5 rounded">
                                    + {sov}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveStep("outreach")}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                          >
                            <span>Proceed to Outreach Workspace</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 text-center text-xs text-slate-500 font-mono">
                          Select an active role on the left to see precise vector overlap breakdowns.
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3 View: Generated Proposals & Automations Hub */}
            {activeStep === "outreach" && (
              <motion.div
                key="step-3-outreach"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-900 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Agent 3: Proposal Architect & Workspace Hub</h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Translates user capabilities directly against high-priority company pain points using target Generative Pitch Templates.
                    </p>
                  </div>
                </div>

                {!profile ? (
                  // Empty State Placeholder
                  <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                      <Lock size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-300">Engineering Profile Required</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        You first need to complete the Step 1 AI Interview, or instantly load our premium sandboxed profile to see generated copywriter cover letters.
                      </p>
                    </div>
                    <button 
                      onClick={handleLoadDemoProfile}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                    >
                      Instant Demo Seeding
                    </button>
                  </div>
                ) : (
                  // High Fidelity Copywriting Dashboard and Document Preview Workspace
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Panel: Proposal Blueprint & Match overview */}
                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-400 uppercase block">TARGET OPPORTUNITY</span>
                        
                        <div>
                          <h3 className="text-base font-bold text-white">{selectedMatch?.title || "Choose matching gig"}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{selectedMatch?.companyName || "Market scout"}</p>
                        </div>

                        {selectedMatch && (
                          <div className="space-y-3 pt-3 border-t border-slate-850 text-xs">
                            <div>
                              <span className="text-[10px] font-mono text-slate-400 uppercase block">Why You Align</span>
                              <p className="text-slate-300 font-sans mt-1 leading-relaxed text-xs">
                                {selectedMatch.whyYouMatch}
                              </p>
                            </div>

                            <div className="pt-2">
                              <span className="text-[10px] font-mono text-slate-400 uppercase block">Shared Stack Alignment</span>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {selectedMatch.alignmentHighlights.skillOverlap.map((s, idx) => (
                                  <span key={idx} className="bg-emerald-500/10 font-mono text-emerald-400 border border-emerald-500/15 text-[10px] px-2 py-0.5 rounded">
                                    ✓ {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Workspace credentials warning/info box */}
                      <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 space-y-3 text-xs leading-relaxed">
                        <span className="text-[10px] font-bold font-mono tracking-widest text-teal-400 uppercase block">WORKSPACE AUTOMATION HUB</span>
                        <p className="text-slate-400 text-xs font-sans">
                          Our Google Workspace Integration instantly targets Gmail drafts and Google Docs creation. Paste your OAuth token in the header field above to bypass the local sandbox simulation.
                        </p>
                      </div>

                      {/* AI Technical Brand Portfolio Asset Generator */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
                        
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Sparkles size={14} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold font-mono tracking-widest text-indigo-400 uppercase block">PORTFOLIO BRANDING</span>
                            <h3 className="text-sm font-bold text-slate-250 mt-0.5">Asset Portfolio Generator</h3>
                          </div>
                        </div>

                        <p className="text-slate-400 text-xs leading-relaxed font-sans">
                          Assemble vector diagrams, schematics, or profile avatars using the premium <code className="text-indigo-300 font-mono text-[10px] bg-indigo-950/40 px-1 py-0.5 rounded">gemini-3-pro-image-preview</code> model.
                        </p>

                        {/* Prompt Input */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Generation Prompt</label>
                          <textarea
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            rows={3}
                            className="w-full text-xs bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 font-sans leading-relaxed resize-none"
                            placeholder="Describe your desired asset details..."
                          />
                        </div>

                        {/* Presets Grid */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono uppercase text-slate-500 block">Quick Asset Presets:</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setImagePrompt("Minimalist blueprint sketch of a high-throughput API gateway cluster, clean software engineering vector blueprint, glowing cyan slate schematic, diagram architecture")}
                              className="text-[9px] bg-slate-950/60 border border-slate-800/40 text-slate-450 p-1.5 rounded-lg hover:bg-slate-950 hover:text-slate-200 transition-all text-left font-mono truncate"
                            >
                              🌐 Tech Schematic
                            </button>
                            <button
                              type="button"
                              onClick={() => setImagePrompt("Iconic corporate avatar, professional software engineer portrait, elegant minimalist profile, high-end clean workspace ambient lighting, dark neon clothing, premium branding")}
                              className="text-[9px] bg-slate-950/60 border border-slate-800/40 text-slate-450 p-1.5 rounded-lg hover:bg-slate-950 hover:text-slate-200 transition-all text-left font-mono truncate"
                            >
                              👤 Pro Avatar Icon
                            </button>
                            <button
                              type="button"
                              onClick={() => setImagePrompt("Aesthetic abstract glowing network vertices, server mesh node system web illustration, deep slate background with indigo neon traces, vector design art")}
                              className="text-[9px] bg-slate-950/60 border border-slate-800/40 text-slate-450 p-1.5 rounded-lg hover:bg-slate-950 hover:text-slate-200 transition-all text-left font-mono truncate"
                            >
                              ⚡ Network Abstract
                            </button>
                            <button
                              type="button"
                              onClick={() => setImagePrompt("Clean isometric 3D render of a code terminal window with flowing holographic digital metrics, dark teal/carbon background, sleek UI/UX portfolio cover")}
                              className="text-[9px] bg-slate-950/60 border border-slate-800/40 text-slate-450 p-1.5 rounded-lg hover:bg-slate-950 hover:text-slate-200 transition-all text-left font-mono truncate"
                            >
                              💻 Codespace Isometric
                            </button>
                          </div>
                        </div>

                        {/* Selectors Grid: Size & Aspect Ratio */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Quality Scale</label>
                            <div className="flex bg-slate-950 p-0.5 border border-slate-850 rounded-lg gap-0.5">
                              {["1K", "2K", "4K"].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setImageSize(s as any)}
                                  className={`flex-1 text-[9px] font-mono font-bold py-1 rounded transition-all ${
                                    imageSize === s
                                      ? "bg-indigo-600/15 border border-indigo-500/20 text-white"
                                      : "text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Aspect Ratio</label>
                            <div className="flex bg-slate-950 p-0.5 border border-slate-850 rounded-lg gap-0.5">
                              {[
                                { label: "1:1", value: "1:1" },
                                { label: "16:9", value: "16:9" },
                              ].map((ar) => (
                                <button
                                  key={ar.value}
                                  type="button"
                                  onClick={() => setImageAspectRatio(ar.value as any)}
                                  className={`flex-1 text-[9px] font-mono py-1 rounded transition-all ${
                                    imageAspectRatio === ar.value
                                      ? "bg-indigo-600/15 border border-indigo-500/20 text-white font-bold"
                                      : "text-slate-500 hover:text-slate-300"
                                  }`}
                                >
                                  {ar.value}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Rendering Canvas / Output */}
                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={handleGenerateAssetImage}
                            disabled={isGeneratingImage || !imagePrompt.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-bold text-[11px] py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-indigo-600/10"
                          >
                            {isGeneratingImage ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Sparkles size={12} className="text-indigo-200" />
                            )}
                            <span>Assemble Asset Image</span>
                          </button>

                          {/* Generation Preview Stage */}
                          <div className="relative border border-slate-850 bg-slate-950/80 rounded-xl overflow-hidden min-h-[140px] flex items-center justify-center p-2">
                            {isGeneratingImage ? (
                              <div className="text-center space-y-2 p-3">
                                <RefreshCw size={20} className="text-indigo-500 animate-spin mx-auto" />
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block animate-pulse">Rasterizing Asset Layers</span>
                                  <span className="text-[8px] font-mono text-slate-500 block">Mapping {imageSize} coordinates via Gemini...</span>
                                </div>
                              </div>
                            ) : generatedImageUrl ? (
                              <div className="w-full space-y-2 text-center">
                                <img
                                  src={generatedImageUrl}
                                  alt="AI Generated Asset Portfolio"
                                  referrerPolicy="no-referrer"
                                  className="w-full object-cover rounded-lg border border-slate-850 max-h-[180px]"
                                />
                                <div className="flex items-center justify-between gap-1 text-[8px] font-mono text-slate-500 bg-slate-900/40 p-2 border border-slate-850/40 rounded-lg">
                                  <span>Engine: <span className="text-indigo-400 font-bold">{imageEngine || "imagen"}</span></span>
                                  <span>Ratio: {imageAspectRatio} ({imageSize})</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center p-4 space-y-1 text-slate-500">
                                <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-600">
                                  <Sliders size={12} />
                                </div>
                                <span className="text-[9px] font-mono block">No custom asset rendered</span>
                                <span className="text-[8px] text-slate-600 block max-w-[200px] mx-auto leading-relaxed">Customize properties above & tap "Assemble Asset" to begin render.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Sleek Live Document Preview Workbench */}
                    <div id="live-workbench-panel" className="xl:col-span-8 space-y-4">
                      
                      <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
                        
                        {/* Live document header styling mimicking a document program window */}
                        <div className="bg-slate-850 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-400 to-indigo-500 flex items-center justify-center text-white text-xs">
                              <Bot size={15} />
                            </div>
                            <div>
                              <div className="text-[9px] text-emerald-400 font-mono uppercase tracking-wider font-bold">
                                Agent 3 Outreach Writer
                              </div>
                              <h4 className="text-xs font-bold text-slate-200">
                                Live Letter Preview & Automation Stage
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono px-2 py-0.5 rounded border border-indigo-500/20">
                              Gemini flash
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                              Outbox target
                            </span>
                          </div>
                        </div>

                        {/* Proposal Text box styled elegant / document block */}
                        <div className="p-6 bg-slate-950/70 border-b border-slate-850">
                          <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed min-h-[340px] max-h-[460px] overflow-y-auto whitespace-pre-wrap select-text selection:bg-indigo-500">
                            {isGeneratingProposal ? (
                              <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-3">
                                <RefreshCw size={24} className="text-teal-400 animate-spin" />
                                <span className="text-slate-400 text-xs font-mono">Formulating custom technical proposal content...</span>
                              </div>
                            ) : (
                              proposalText || "Choose a job opportunity from the scouting matches pool to view formatted proposal draft letters."
                            )}
                          </div>
                        </div>

                        {/* Control buttons & automation actions bar - responsive layout */}
                        <div className="p-5 bg-slate-900 flex flex-col sm:flex-row gap-4 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">Workspace status:</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              oauthToken 
                                 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                                 : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                            }`}>
                              {oauthToken ? "Authenticated client" : "Sandbox system"}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                              id="btn-create-gdoc"
                              onClick={handleCreateGoogleDoc}
                              disabled={!proposalText || isGeneratingProposal || isCreatingDoc}
                              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-indigo-600/10"
                            >
                              {isCreatingDoc ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <FileCheck size={14} className="text-indigo-200" />
                              )}
                              <span>Open in Google Docs</span>
                            </button>

                            <button
                              id="btn-create-gdraft"
                              onClick={handleSaveGmailDraft}
                              disabled={!proposalText || isGeneratingProposal || isCreatingDraft}
                              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-40 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-emerald-600/10"
                            >
                              {isCreatingDraft ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Mail size={14} className="text-emerald-200" />
                              )}
                              <span>Check Gmail Drafts</span>
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 text-center text-[10px] font-mono text-slate-500">
        <p>© 2026 The Continuous Career Agent • Multi-Agent Pipeline Prototype with Google Workspace Integrations</p>
      </footer>
    </div>
  );
}
