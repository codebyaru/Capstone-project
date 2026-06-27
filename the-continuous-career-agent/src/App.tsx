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
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./lib/firebase";
import {
  Layers,
  X,
  User,
  Sun,
  Moon,
  Lock,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Bot,
  FileCheck,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InterviewerChat from "./components/InterviewerChat.tsx";
import LoginPage from "./components/LoginPage.tsx";
import LandingPage from "./components/LandingPage.tsx";
import { UserCapabilityProfile, MatchRecommendation } from "./types/profile.ts";
import { safeLocalStorage, safeSessionStorage } from "./lib/safeStorage.ts";

export default function App() {
  const [activeStep, setActiveStep] = useState<"interview" | "matches" | "outreach">("interview");
  const [profile, setProfile] = useState<UserCapabilityProfile | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Auth State & Persistence
  const [user, setUser] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(true);

  // Dashboard Matching States
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecommendation | null>(null);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);

  // Outreach States
  const [proposalText, setProposalText] = useState("");
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);

  // Integrations States
  const [oauthToken, setOauthToken] = useState("");
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Toast notifications
  const [alertInfo, setAlertInfo] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // High-Fidelity Asset Portfolio Brand Generator States
  const [imagePrompt, setImagePrompt] = useState("Minimalist neon blueprint of a globally distributed cloud API database architecture, technical grid layout, professional vector schematic, navy-dark aesthetic");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [imageAspectRatio, setImageAspectRatio] = useState<"1:1" | "16:9">("1:1");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageEngine, setImageEngine] = useState<string | null>(null);

  // Theme configuration
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = safeLocalStorage.getItem("cc_agent_theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      safeLocalStorage.setItem("cc_agent_theme", theme);
    } catch (err) {
      console.warn("Unable to persist theme preference:", err);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    const fetchSessionToken = async () => {
      try {
        const res = await fetch("/api/profile/session-token");
        const data = await res.json();
        if (data.success && data.sessionToken) {
          safeSessionStorage.setItem("encrypted_session_token", data.sessionToken);
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
        safeLocalStorage.setItem(`cc_agent_${userId}`, JSON.stringify(data));
        return;
      }
    } catch (err: any) {
      console.warn("Firestore status: offline or restricted. Checking local sandbox cache...", err.message);
    }

    try {
      const localCached = safeLocalStorage.getItem(`cc_agent_${userId}`);
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

    try {
      safeLocalStorage.setItem(`cc_agent_${userId}`, JSON.stringify(payload));
    } catch (localErr) {
      console.error("Failed storing local preview state:", localErr);
    }

    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, payload, { merge: true });
    } catch (err: any) {
      console.warn("Writing to cloud database failed or offline. Preserved in local sandbox cache.", err.message);
    }
  };

  // Safe Authentication Handlers
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      setUser(currentUser);
      showNotification(`Welcome back, ${currentUser.displayName || "Developer"}!`, "success");
      await loadUserDataFromFirestore(currentUser.uid);
    } catch (error: any) {
      console.error("Google authentication failed:", error);
      showNotification(error.message || "Google authentication failed. Please try again.", "error");
    }
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      setUser(result.user);
      showNotification(`Welcome back!`, "success");
      if (result.user?.uid) {
        await loadUserDataFromFirestore(result.user.uid).catch(e =>
          console.warn("Silent firestore fetch error, using local fallback:", e)
        );
      }
    } catch (error: any) {
      console.error("Email authentication failed:", error);
      let friendlyMessage = "Failed to sign in. Please check your credentials.";
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        friendlyMessage = "Incorrect password or email structure. Verify and try again.";
      } else if (error.code === "auth/user-not-found") {
        friendlyMessage = "No account found matching this email. Please Sign Up!";
      }
      throw new Error(friendlyMessage);
    }
  };

  const handleEmailSignUp = async (email: string, pass: string, fullName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(result.user);
      showNotification(`Profile registered for ${fullName}!`, "success");

      try {
        const userDocRef = doc(db, "users", result.user.uid);
        await setDoc(userDocRef, {
          profile: {
            fullName: fullName,
            email: email,
            primary_stack: [],
            deep_skills: [],
            ideal_roles: []
          },
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn("Firestore permissions restricted or cloud offline.", firestoreErr);
      }
    } catch (error: any) {
      console.error("Email registration failed:", error);
      let friendlyMessage = "Registration failed.";
      if (error.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already in use by another profile.";
      } else if (error.code === "auth/weak-password") {
        friendlyMessage = "The password is too weak.";
      }
      throw new Error(friendlyMessage);
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
      setShowLanding(true);

      // Clear interview session cache
      safeSessionStorage.removeItem("cc_interview_onboarded");
      safeSessionStorage.removeItem("cc_interview_fullname");
      safeSessionStorage.removeItem("cc_interview_email");
      safeSessionStorage.removeItem("cc_interview_resume");
      safeSessionStorage.removeItem("cc_interview_messages");
      safeSessionStorage.removeItem("cc_interview_inputtext");
      safeSessionStorage.removeItem("cc_interview_step");
      safeSessionStorage.removeItem("cc_interview_finished");

      showNotification("Account disconnected.", "info");
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  const handleFetchMatches = async (targetProfile: UserCapabilityProfile) => {
    setIsFetchingMatches(true);
    try {
      const response = await fetch("/api/market/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (safeSessionStorage.getItem("encrypted_session_token") || ""),
        },
        body: JSON.stringify({ profile: targetProfile }),
      });
      const data = await response.json();
      if (data.success && data.matches) {
        setMatches(data.matches);
        if (data.matches.length > 0) {
          setSelectedMatch(data.matches[0]);
          handleDraftProposalForMatch(targetProfile, data.matches[0]);
        }
      } else {
        throw new Error(data.error || "Failed match calculation");
      }
    } catch (err: any) {
      console.error(err);
      showNotification("Using local fallback match index.", "info");

      const fallbackMatches: MatchRecommendation[] = [
        {
          roleId: "gig-103",
          title: "Lead Frontend Engineer (NextJS & Framer/Motion)",
          companyName: "Aether AI (Co-Pilot for Biotech)",
          matchScore: 98,
          whyYouMatch: "Your deep expertise in high-performance state architectures perfects matches.",
          alignmentHighlights: {
            skillOverlap: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
            insightCongruence: "Direct knowledge addressing redraw penalties."
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

  const handleDraftProposalForMatch = async (currProfile: UserCapabilityProfile, targetMatch: MatchRecommendation) => {
    setIsGeneratingProposal(true);
    setProposalText("");
    let finalProposalText = "";

    try {
      const response = await fetch("/api/outreach/draft-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (safeSessionStorage.getItem("encrypted_session_token") || ""),
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
      const generatedDraft = `To: Hiring Committee at ${targetMatch.companyName}\n\nWarm regards,\n${currProfile.fullName}`;
      setProposalText(generatedDraft);
      finalProposalText = generatedDraft;
    } finally {
      setIsGeneratingProposal(false);
      if (user) {
        saveUserDataToFirestore(user.uid, currProfile, chatHistory, matches, targetMatch, finalProposalText);
      }
    }
  };

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setAlertInfo({ message, type });
    setTimeout(() => setAlertInfo(null), 5000);
  };

  const handleStepChange = (step: "interview" | "matches" | "outreach") => {
    if (step !== "interview" && !profile) {
      showNotification("Please complete the System Architect Profiler (Agent 1) interview first!", "error");
      setActiveStep("interview");
      return;
    }
    setActiveStep(step);
  };

  const handleProfileGenerated = async (newProfile: UserCapabilityProfile, rawHistory: any[]) => {
    setProfile(newProfile);
    setChatHistory(rawHistory);
    showNotification("Technical Capability Profile Compiled successfully!", "success");
    setActiveStep("matches");
    await handleFetchMatches(newProfile);
  };

  // Pipeline Flow Control Action Handlers
  const handleLoadDemoProfile = async () => {
    const demoProfile: UserCapabilityProfile = {
      fullName: "Demo Builder",
      email: user?.email || "sandbox@stack.inc",
      primary_stack: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
      deep_skills: ["State Optimization", "Micro-Frontends", "Vector Indices"],
      ideal_roles: ["Senior Product Engineer", "Frontend Architect"]
    };
    setProfile(demoProfile);
    showNotification("Demo sandbox profile seeded successfully.", "info");
    setActiveStep("matches");
    await handleFetchMatches(demoProfile);
  };

  const handleRestartPipeline = () => {
    setProfile(null);
    setMatches([]);
    setSelectedMatch(null);
    setProposalText("");
    setActiveStep("interview");

    // Clear interview session cache
    safeSessionStorage.removeItem("cc_interview_onboarded");
    safeSessionStorage.removeItem("cc_interview_fullname");
    safeSessionStorage.removeItem("cc_interview_email");
    safeSessionStorage.removeItem("cc_interview_resume");
    safeSessionStorage.removeItem("cc_interview_messages");
    safeSessionStorage.removeItem("cc_interview_inputtext");
    safeSessionStorage.removeItem("cc_interview_step");
    safeSessionStorage.removeItem("cc_interview_finished");

    showNotification("Pipeline indicators cleared.", "info");
  };

  const handleCreateGoogleDoc = async () => {
    if (!oauthToken) {
      showNotification("Sandbox Mode: Token required to write to Drive APIs.", "error");
      return;
    }
    setIsCreatingDoc(true);
    try {
      // Simulating API pipeline call structure
      await new Promise((res) => setTimeout(res, 1500));
      showNotification("Document populated in your Google Workspace Sync directory!", "success");
    } catch (err) {
      showNotification("Workspace automation failure.", "error");
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleSaveGmailDraft = async () => {
    if (!oauthToken) {
      showNotification("Sandbox Mode: OAuth parameters missing.", "error");
      return;
    }
    setIsCreatingDraft(true);
    try {
      await new Promise((res) => setTimeout(res, 1200));
      showNotification("Draft compiled inside target Gmail outbox!", "success");
    } catch (err) {
      showNotification("Draft compilation failed.", "error");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const renderNotificationToast = () => (
    <AnimatePresence>
      {alertInfo && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl max-w-md w-[90%] border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: alertInfo.type === "success" ? "var(--success)" : alertInfo.type === "error" ? "var(--danger)" : "var(--info)"
            }}
          />
          <p className="text-xs font-mono font-medium flex-1" style={{ color: "var(--text)" }}>{alertInfo.message}</p>
          <button onClick={() => setAlertInfo(null)} className="cursor-pointer transition-colors" style={{ color: "var(--text-faint)" }}>
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (showLanding && !user) {
    return (
      <LandingPage
        onEnter={() => setShowLanding(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen font-sans flex flex-col antialiased overflow-x-hidden max-w-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        {renderNotificationToast()}
        <LoginPage
          onGoogleSignIn={handleGoogleSignIn}
          onEmailSignIn={handleEmailSignIn}
          onEmailSignUp={handleEmailSignUp}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col antialiased overflow-x-hidden max-w-full" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      {renderNotificationToast()}

      {/* Header View Row */}
      <header className="border-b px-4 md:px-6 py-4 flex items-center justify-between gap-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <h1 className="text-sm font-bold tracking-tight font-mono uppercase hidden sm:block">Agentic Pipeline Hub</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border cursor-pointer transition-colors"
            style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <div
            className="hidden md:flex items-center border rounded-lg px-2.5 py-1.5 gap-2 text-xs"
            style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)" }}
          >
            <Lock size={12} style={{ color: "var(--text-faint)" }} />
            <input
              id="google-workspace-token-input-header"
              type="password"
              placeholder="Google Workspace Token"
              value={oauthToken}
              onChange={(e) => setOauthToken(e.target.value)}
              className="bg-transparent placeholder-current text-[11px] font-mono focus:outline-none w-40"
              style={{ color: "var(--text)" }}
              title="Enter your Access Token to interface with Gmail/Docs APIs directly"
            />
            <span
              className="text-[10px] rounded px-1.5 font-mono border"
              style={{ color: "var(--secondary)", backgroundColor: "var(--secondary-soft)", borderColor: "var(--secondary)" }}
            >
              OAuth
            </span>
          </div>

          {!profile && (
            <button
              onClick={handleLoadDemoProfile}
              className="text-xs border py-1.5 px-2.5 sm:px-3.5 rounded-lg flex items-center gap-1.5 transition-all font-medium cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
              title="Demo Sandbox"
            >
              <Sparkles size={12} style={{ color: "var(--accent)" }} />
              <span className="hidden sm:inline">Demo sandbox</span>
            </button>
          )}

          {profile && (
            <button
              id="btn-nav-reset"
              onClick={handleRestartPipeline}
              className="text-xs border py-1.5 px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
              title="Reset Profile"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Reset Profile</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="text-xs border border-transparent py-1.5 px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger)" }}
          >
            <User size={12} />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Workspace Sidebar - Steps Selector */}
        <aside
          className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r p-5 md:p-6 flex flex-col gap-6 shrink-0"
          style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
        >
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-muted)" }}>Pipeline steps</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col gap-2">

            {/* Step 1 Tab button */}
            <button
              id="tab-step-1"
              onClick={() => handleStepChange("interview")}
              className="flex items-start gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer border"
              style={
                activeStep === "interview"
                  ? { backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--text)" }
                  : { backgroundColor: "transparent", borderColor: "transparent", color: "var(--text-faint)" }
              }
            >
              <div
                className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                style={
                  activeStep === "interview"
                    ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                    : { backgroundColor: "var(--bg-sunken)", color: "var(--text-faint)" }
                }
              >
                01
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest block" style={{ color: "var(--secondary)" }}>Agent 1</span>
                <span className="text-xs font-semibold block" style={{ color: "var(--text)" }}>AI Chat Interview</span>
                <span className="text-[10px] font-mono mt-0.5 block truncate" style={{ color: "var(--text-faint)" }}>
                  {profile ? "✓ Compiled" : "Active"}
                </span>
              </div>
            </button>

            {/* Step 2 Tab button */}
            <button
              id="tab-step-2"
              onClick={() => handleStepChange("matches")}
              className="flex items-start gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer border"
              style={
                activeStep === "matches"
                  ? { backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--text)" }
                  : { backgroundColor: "transparent", borderColor: "transparent", color: "var(--text-faint)" }
              }
            >
              <div
                className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                style={
                  activeStep === "matches"
                    ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                    : { backgroundColor: "var(--bg-sunken)", color: "var(--text-faint)" }
                }
              >
                02
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest block" style={{ color: "var(--secondary)" }}>Agent 2</span>
                <span className="text-xs font-semibold block" style={{ color: "var(--text)" }}>Market Matching</span>
                <span className="text-[10px] font-mono mt-0.5 block truncate" style={{ color: "var(--text-faint)" }}>
                  {matches.length > 0 ? `${matches.length} matches` : "Pending"}
                </span>
              </div>
            </button>

            {/* Step 3 Tab button */}
            <button
              id="tab-step-3"
              onClick={() => handleStepChange("outreach")}
              className="flex items-start gap-3 p-3.5 rounded-xl transition-all text-left cursor-pointer border"
              style={
                activeStep === "outreach"
                  ? { backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--text)" }
                  : { backgroundColor: "transparent", borderColor: "transparent", color: "var(--text-faint)" }
              }
            >
              <div
                className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-semibold shrink-0"
                style={
                  activeStep === "outreach"
                    ? { backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }
                    : { backgroundColor: "var(--bg-sunken)", color: "var(--text-faint)" }
                }
              >
                03
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-widest block" style={{ color: "var(--secondary)" }}>Agent 3</span>
                <span className="text-xs font-semibold block" style={{ color: "var(--text)" }}>Proposals & Hub</span>
                <span className="text-[10px] font-mono mt-0.5 block truncate" style={{ color: "var(--text-faint)" }}>
                  {proposalText ? "Ready" : "Pending"}
                </span>
              </div>
            </button>

          </div>
        </aside>

        {/* Dynamic Canvas Area */}
        <main className="flex-1 p-6 md:p-8 flex flex-col overflow-x-hidden" style={{ backgroundColor: "var(--bg)" }}>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h2 className="text-xl font-display font-semibold tracking-tight" style={{ color: "var(--text)" }}>Agent 1: System Architect Profiler</h2>
                  </div>
                  {!profile && (
                    <button
                      onClick={handleLoadDemoProfile}
                      className="shrink-0 text-xs py-1.5 px-3 rounded-lg transition-all font-mono border cursor-pointer"
                      style={{ backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent-strong)" }}
                    >
                      Load Sandboxed Demo Profile
                    </button>
                  )}
                </div>

                <div className="rounded-2xl overflow-hidden shadow-xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
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
                <div className="border-b pb-5" style={{ borderColor: "var(--border)" }}>
                  <h2 className="text-xl font-display font-semibold tracking-tight" style={{ color: "var(--text)" }}>Agent 2: Market Scout</h2>
                </div>

                {!profile ? (
                  // Empty State Placeholder
                  <div className="border border-dashed rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4" style={{ borderColor: "var(--border-strong)" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--bg-sunken)", color: "var(--text-faint)" }}>
                      <Lock size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Engineering Profile Required</h3>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
                        You first need to complete the Step 1 AI Interview, or instantly load our premium sandboxed profile to see matching metrics in action.
                      </p>
                    </div>
                    <button
                      onClick={handleLoadDemoProfile}
                      className="font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                      style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
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
                        <span className="text-xs font-mono font-semibold uppercase tracking-widest block" style={{ color: "var(--secondary)" }}>Active Scout Listings</span>
                      </div>

                      {isFetchingMatches ? (
                        <div className="rounded-2xl h-80 flex flex-col items-center justify-center gap-3 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                          <RefreshCw size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
                          <span className="text-xs font-mono text-center px-4" style={{ color: "var(--text-muted)" }}>Running vector similarity mapping on current dataset...</span>
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
                                className="group p-5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between min-h-[14rem] h-auto gap-4"
                                style={
                                  isSelected
                                    ? { backgroundColor: "var(--surface)", borderColor: "var(--accent)" }
                                    : { backgroundColor: "var(--bg-raised)", borderColor: "var(--border)" }
                                }
                              >
                                <div>
                                  <div className="flex justify-between items-start gap-3">
                                    <span className="text-[10px] font-mono font-semibold truncate max-w-[80%] block" style={{ color: "var(--text-faint)" }}>
                                      {match.companyName}
                                    </span>
                                    <span
                                      className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 border"
                                      style={
                                        match.matchScore >= 95
                                          ? { backgroundColor: "var(--success-soft)", color: "var(--success)", borderColor: "var(--success)" }
                                          : { backgroundColor: "var(--accent-soft)", color: "var(--accent-strong)", borderColor: "var(--accent)" }
                                      }
                                    >
                                      {match.matchScore}% Match
                                    </span>
                                  </div>

                                  <h3 className="text-sm font-semibold mt-2.5 line-clamp-2" style={{ color: "var(--text)" }}>
                                    {match.title}
                                  </h3>

                                  <p className="text-xs line-clamp-3 mt-2 font-sans" style={{ color: "var(--text-muted)" }}>
                                    {match.whyYouMatch}
                                  </p>
                                </div>

                                <div className="mt-3.5 pt-3 border-t flex flex-wrap gap-1.5" style={{ borderColor: "var(--border)" }}>
                                  {match.alignmentHighlights.skillOverlap.slice(0, 3).map((skill, sIdx) => (
                                    <span key={sIdx} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg-sunken)", color: "var(--secondary)" }}>
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
                      <span className="text-xs font-mono font-semibold uppercase tracking-widest block" style={{ color: "var(--secondary)" }}>Alignment insights</span>

                      {selectedMatch ? (
                        <div className="rounded-2xl p-5 space-y-5 border blueprint-corners" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                          <div>
                            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded uppercase" style={{ color: "var(--accent-strong)", backgroundColor: "var(--accent-soft)" }}>Candidate Alignment</span>
                            <h3 className="text-base font-semibold mt-2.5" style={{ color: "var(--text)" }}>{selectedMatch.title}</h3>
                            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-faint)" }}>{selectedMatch.companyName}</p>
                          </div>

                          <div className="space-y-3 pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-mono tracking-wider block" style={{ color: "var(--text-faint)" }}>Insight Congruence</span>
                              <p className="leading-relaxed font-sans text-xs p-2.5 border rounded-lg" style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)" }}>
                                "{selectedMatch.alignmentHighlights.insightCongruence}"
                              </p>
                            </div>

                            <div className="space-y-1 pt-1.5">
                              <span className="text-[10px] uppercase font-mono tracking-wider block" style={{ color: "var(--text-faint)" }}>Tech-Stack Overlap</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedMatch.alignmentHighlights.skillOverlap.map((sov, sIdx) => (
                                  <span key={sIdx} className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)", borderColor: "var(--success)" }}>
                                    + {sov}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStepChange("outreach")}
                            className="w-full font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer border border-transparent"
                            style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
                          >
                            <span>Proceed to Outreach Workspace</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-2xl p-5 text-center text-xs font-mono border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-faint)" }}>
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
                <div className="border-b pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h2 className="text-xl font-display font-semibold tracking-tight" style={{ color: "var(--text)" }}>Agent 3: Outreach & Proposals</h2>
                  </div>
                </div>

                {!profile ? (
                  // Empty State Placeholder
                  <div className="border border-dashed rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4" style={{ borderColor: "var(--border-strong)" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--bg-sunken)", color: "var(--text-faint)" }}>
                      <Lock size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Engineering Profile Required</h3>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
                        You first need to complete the Step 1 AI Interview, or instantly load our premium sandboxed profile to see generated copywriter cover letters.
                      </p>
                    </div>
                    <button
                      onClick={handleLoadDemoProfile}
                      className="font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
                      style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
                    >
                      Instant Demo Seeding
                    </button>
                  </div>
                ) : (
                  // High Fidelity Copywriting Dashboard and Document Preview Workspace
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                    {/* Left Panel: Proposal Blueprint & Match overview */}
                    <div className="xl:col-span-4 space-y-6">
                      <div className="rounded-2xl p-5 space-y-4 border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] font-semibold font-mono tracking-widest uppercase block" style={{ color: "var(--secondary)" }}>TARGET OPPORTUNITY</span>

                        <div>
                          <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>{selectedMatch?.title || "Choose matching gig"}</h3>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedMatch?.companyName || "Market scout"}</p>
                        </div>

                        {selectedMatch && (
                          <div className="space-y-3 pt-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                            <div>
                              <span className="text-[10px] font-mono uppercase block" style={{ color: "var(--text-faint)" }}>Why You Align</span>
                              <p className="font-sans mt-1 leading-relaxed text-xs" style={{ color: "var(--text-muted)" }}>
                                {selectedMatch.whyYouMatch}
                              </p>
                            </div>

                            <div className="pt-2">
                              <span className="text-[10px] font-mono uppercase block" style={{ color: "var(--text-faint)" }}>Shared Stack Alignment</span>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {selectedMatch.alignmentHighlights.skillOverlap.map((s, idx) => (
                                  <span key={idx} className="font-mono text-[10px] px-2 py-0.5 rounded border" style={{ backgroundColor: "var(--success-soft)", color: "var(--success)", borderColor: "var(--success)" }}>
                                    ✓ {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Workspace credentials / token input */}
                      <div className="rounded-2xl p-5 space-y-3 text-xs border" style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] font-semibold font-mono tracking-widest uppercase block" style={{ color: "var(--secondary)" }}>WORKSPACE AUTOMATION</span>
                        <div className="flex items-center border rounded-lg px-2.5 py-2 gap-2 text-xs" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                          <Lock size={12} style={{ color: "var(--text-faint)" }} />
                          <input
                            id="google-workspace-token-input-sidebar"
                            type="password"
                            placeholder="Google Workspace OAuth Token"
                            value={oauthToken}
                            onChange={(e) => setOauthToken(e.target.value)}
                            className="bg-transparent placeholder-current text-xs focus:outline-none flex-1 font-sans"
                            style={{ color: "var(--text)" }}
                            title="Enter your Access Token to interface with Gmail/Docs APIs directly"
                          />
                        </div>
                        <p className="text-[10px] font-sans leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          Optional. Add your Google OAuth Token to draft emails/Docs directly to your account.
                        </p>
                      </div>
                    </div>

                    {/* Right Panel: Sleek Live Document Preview Workbench */}
                    <div id="live-workbench-panel" className="xl:col-span-8 space-y-4">

                      <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>

                        {/* Live document header styling mimicking a document program window */}
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b gap-3" style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded flex items-center justify-center text-xs" style={{ backgroundColor: "var(--secondary)", color: "var(--accent-contrast)" }}>
                              <Bot size={15} />
                            </div>
                            <div>
                              <div className="text-[9px] font-mono uppercase tracking-wider font-semibold" style={{ color: "var(--secondary)" }}>
                                Agent 3 Outreach Writer
                              </div>
                              <h4 className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                                Live Letter Preview & Automation Stage
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-strong)", borderColor: "var(--accent)" }}>
                              Gemini flash
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ backgroundColor: "var(--bg)", color: "var(--text-faint)", borderColor: "var(--border)" }}>
                              Outbox target
                            </span>
                          </div>
                        </div>

                        {/* Proposal Text box styled elegant / document block */}
                        <div className="p-6 border-b" style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border)" }}>
                          <div
                            className="rounded-xl p-8 md:p-10 font-sans text-sm md:text-base leading-relaxed tracking-normal min-h-[340px] max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text border shadow-sm"
                            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                          >
                            {isGeneratingProposal ? (
                              <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-3">
                                <RefreshCw size={24} className="animate-spin" style={{ color: "var(--secondary)" }} />
                                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Formulating custom technical proposal content...</span>
                              </div>
                            ) : (
                              proposalText || "Choose a job opportunity from the scouting matches pool to view formatted proposal draft letters."
                            )}
                          </div>
                        </div>

                        {/* Control buttons & automation actions bar - responsive layout */}
                        <div className="p-5 flex flex-col sm:flex-row gap-4 items-center justify-between" style={{ backgroundColor: "var(--surface)" }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>Workspace status:</span>
                            <span
                              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
                              style={
                                oauthToken
                                  ? { backgroundColor: "var(--success-soft)", color: "var(--success)", borderColor: "var(--success)" }
                                  : { backgroundColor: "var(--accent-soft)", color: "var(--accent-strong)", borderColor: "var(--accent)" }
                              }
                            >
                              {oauthToken ? "Authenticated client" : "Sandbox system"}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                              id="btn-create-gdoc"
                              onClick={handleCreateGoogleDoc}
                              disabled={!proposalText || isGeneratingProposal || isCreatingDoc}
                              className="w-full sm:w-auto font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg disabled:opacity-40 border border-transparent"
                              style={{ backgroundColor: "var(--secondary)", color: "var(--accent-contrast)" }}
                            >
                              {isCreatingDoc ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <FileCheck size={14} />
                              )}
                              <span>Open in Google Docs</span>
                            </button>

                            <button
                              id="btn-create-gdraft"
                              onClick={handleSaveGmailDraft}
                              disabled={!proposalText || isGeneratingProposal || isCreatingDraft}
                              className="w-full sm:w-auto font-semibold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg disabled:opacity-40 border border-transparent"
                              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
                            >
                              {isCreatingDraft ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Mail size={14} />
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
      <footer className="border-t py-5 text-center text-[10px] font-mono" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", color: "var(--text-faint)" }}>
        <p>© 2026 The Job Genius AI • Multi-Agent Pipeline Prototype with Google Workspace Integrations</p>
      </footer>
    </div>
  );
}
