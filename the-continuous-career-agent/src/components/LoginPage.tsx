import React, { useState } from "react";
import {
  Layers,
  ShieldCheck,
  Cpu,
  Fingerprint,
  RefreshCw,
  Terminal,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

  interface LoginPageProps {
  onGoogleSignIn: (mode: "signin" | "signup") => Promise<void>;
  onEmailSignIn: (email: string, pass: string) => Promise<void>;
  onEmailSignUp: (email: string, pass: string, fullName: string) => Promise<void>;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}


export default function LoginPage({ onGoogleSignIn, onEmailSignIn, onEmailSignUp }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isBtnClicking, setIsBtnClicking] = useState(false);
  
  // Email/Password states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [notRegisteredWarning, setNotRegisteredWarning] = useState(false);

  // Strong password checks
  const lenMet = password.length >= 8;
  const upperMet = /[A-Z]/.test(password);
  const lowerMet = /[a-z]/.test(password);
  const digitMet = /[0-9]/.test(password);
  const specialMet = /[^A-Za-z0-9]/.test(password);
  const allCriteriaMet = lenMet && upperMet && lowerMet && digitMet && specialMet;

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    setErrorMsg("");
    setNotRegisteredWarning(false);
    setPassword("");
  };

  const handleGoogleSignInAction = async () => {
    setIsBtnClicking(true);
    setErrorMsg("");
    setNotRegisteredWarning(false);
    try {
      await onGoogleSignIn(activeTab);
    } catch (err: any) {
      if (err.message === "ACCOUNT_NOT_FOUND" || err.code === "auth/user-not-found") {
        setActiveTab("signup");
        setNotRegisteredWarning(true);
        setErrorMsg("This Google account is not registered. Please sign up to establish your profile records.");
      } else {
        setErrorMsg(err.message || "Google authentication failed.");
      }
    } finally {
      setIsBtnClicking(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setNotRegisteredWarning(false);

    if (!email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (activeTab === "signup" && !fullName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (activeTab === "signup") {
      // Strictly enforce strong password rule
      if (!allCriteriaMet) {
        setErrorMsg("Password is not strong enough. Please follow all instructions highlighted in the strength guide.");
        return;
      }
    }

    setIsBtnClicking(true);
    try {
      if (activeTab === "signin") {
        await onEmailSignIn(email, password);
      } else {
        await onEmailSignUp(email, password, fullName);
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      let displayError = err.message || "Authentication failed.";
      
      // Determine if they are not yet a user to show a specialized signup suggestion pop warning
      if (
        err.code === "auth/user-not-found" || 
        err.message?.toLowerCase().includes("user not found") || 
        err.message?.toLowerCase().includes("no user record") ||
        (activeTab === "signin" && err.code === "auth/invalid-credential")
      ) {
        setNotRegisteredWarning(true);
        displayError = "No account found matching this email. Sign up first to get started!";
      } else if (err.code === "auth/wrong-password") {
        displayError = "Incorrect password. Please verify and try again.";
      } else if (err.code === "auth/email-already-in-use") {
        displayError = "An account is already registered with this email address.";
      } else if (err.code === "auth/weak-password") {
        displayError = "The chosen password does not satisfy secure Firebase policies.";
      }
      
      setErrorMsg(displayError);
    } finally {
      setIsBtnClicking(false);
    }
  };

  return (
    <div
      className="min-h-screen font-sans flex items-center justify-center p-4 relative overflow-hidden dossier-grid"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
      id="login-page-container"
    >
      {/* Theme toggle */}
      <button
        type="button"
        onClick={onToggleTheme}
        id="login-theme-toggle"
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
        aria-label="Toggle light and dark mode"
        title="Toggle light / dark mode"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Decorative ambient washes */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px]"
        style={{ backgroundColor: "var(--accent-soft)", opacity: 0.6 }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px]"
        style={{ backgroundColor: "var(--secondary-soft)", opacity: 0.6 }}
      />

      <div className="max-w-md w-full relative z-10 space-y-6">

        {/* Logo and Brand Heading */}
        <div className="text-center space-y-2.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex w-12 h-12 rounded-xl items-center justify-center shadow-xl mb-2 border"
            style={{ backgroundColor: "var(--accent)", borderColor: "var(--accent-strong)" }}
          >
            <Layers size={22} style={{ color: "var(--accent-contrast)" }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-1.5"
          >
            <span
              className="text-[10px] font-semibold font-mono tracking-[0.25em] uppercase block"
              style={{ color: "var(--secondary)" }}
            >
              Multi-Agent Talent Dossier
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              Job Genius AI
            </h1>
            <p className="text-xs font-sans max-w-sm mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
              An autonomous multi-agent partner that conducts technical profiling, coordinates market discovery, and automates outreach templates.
            </p>
          </motion.div>
        </div>

        {/* Auth Module Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl shadow-2xl overflow-hidden relative border blueprint-corners"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          id="auth-card"
        >
          {/* Brass top rule */}
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{ backgroundColor: "var(--accent)", opacity: 0.8 }} />

          {/* Unified Sign In vs Sign Up Tabs */}
          <div className="flex p-1 border-b" style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)" }}>
            <button
              onClick={() => setActiveTab("signin")}
              className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider font-mono rounded-lg transition-all cursor-pointer"
              style={
                activeTab === "signin"
                  ? { backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }
                  : { color: "var(--text-faint)" }
              }
              id="tab-select-signin"
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider font-mono rounded-lg transition-all cursor-pointer"
              style={
                activeTab === "signup"
                  ? { backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }
                  : { color: "var(--text-faint)" }
              }
              id="tab-select-signup"
            >
              Sign Up
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === "signin" ? (
                <motion.div
                  key="signin-content"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
                      <Fingerprint size={15} style={{ color: "var(--secondary)" }} /> Welcome Back
                    </h3>
                    <p className="text-xs leading-relaxed font-sans" style={{ color: "var(--text-muted)" }}>
                      Connect your secure Google identity to query your persistent Firestore capability mapping and view active scouting channels.
                    </p>
                  </div>

                  {/* Core capability pointers */}
                  <div
                    className="rounded-xl p-3.5 space-y-2 text-[11px] font-mono border"
                    style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                      <span>Resume past conversational logs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                      <span>Access indexed job matching feeds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                      <span>Retain personalized outreach drafts</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSignInAction}
                      disabled={isBtnClicking}
                      className="w-full font-semibold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer active:scale-[0.99] disabled:opacity-50"
                      style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
                      id="google-signin-btn"
                    >
                      {isBtnClicking ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.091 14.99 0 12 0 7.37 0 3.336 2.627 1.345 6.471l3.92 3.294z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.49 12.275c0-.853-.076-1.67-.218-2.455H12v4.64h6.46c-.28 1.5-1.127 2.766-2.39 3.618l3.712 2.877c2.172-2.002 3.42-4.947 3.42-8.68z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.266 14.235L1.345 17.53A11.966 11.966 0 0 0 12 24c2.93 0 5.617-.982 7.782-2.658l-3.712-2.877c-.11.077-1.173.83-4.07.83-3.664 0-6.772-2.478-7.876-5.834l-3.918 3.3l.06-.064z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 19.38c-3.664 0-6.772-2.478-7.876-5.834L.206 16.84C2.197 20.686 6.233 23.313 12 23.313c3.083 0 5.86-.99 7.782-2.658l-3.712-2.877c-.11.077-1.173.83-4.07.83z"
                          />
                        </svg>
                      )}
                      <span>Continue with Google</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup-content"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
                      <Cpu size={15} style={{ color: "var(--secondary)" }} /> Let's Register Your Profile
                    </h3>
                    <p className="text-xs leading-relaxed font-sans" style={{ color: "var(--text-muted)" }}>
                      Start your technical profiling onboarding with Agent 1. Establish secure, database-linked records instantly.
                    </p>
                  </div>

                  {/* Core capability pointers */}
                  <div
                    className="rounded-xl p-3.5 space-y-2 text-[11px] font-mono border"
                    style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--secondary)" }} />
                      <span>Instantly link profiling metrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--secondary)" }} />
                      <span>Activate autonomous search criteria</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--secondary)" }} />
                      <span>Unlock AI portfolio branding tools</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSignInAction}
                      disabled={isBtnClicking}
                      className="w-full font-semibold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer active:scale-[0.99] disabled:opacity-50"
                      style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
                      id="google-signup-btn"
                    >
                      {isBtnClicking ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.091 14.99 0 12 0 7.37 0 3.336 2.627 1.345 6.471l3.92 3.294z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.49 12.275c0-.853-.076-1.67-.218-2.455H12v4.64h6.46c-.28 1.5-1.127 2.766-2.39 3.618l3.712 2.877c2.172-2.002 3.42-4.947 3.42-8.68z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.266 14.235L1.345 17.53A11.966 11.966 0 0 0 12 24c2.93 0 5.617-.982 7.782-2.658l-3.712-2.877c-.11.077-1.173.83-4.07.83-3.664 0-6.772-2.478-7.876-5.834l-3.918 3.3l.06-.064z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 19.38c-3.664 0-6.772-2.478-7.876-5.834L.206 16.84C2.197 20.686 6.233 23.313 12 23.313c3.083 0 5.86-.99 7.782-2.658l-3.712-2.877c-.11.077-1.173.83-4.07.83z"
                          />
                        </svg>
                      )}
                      <span>Register with Google</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Direct Sandbox Bypass option */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }} />
              <span className="flex-shrink mx-3 text-[9px] font-mono tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>or bypass auth</span>
              <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }} />
            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={onSandboxBypass}
                className="w-full font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-[11px] font-mono tracking-wide cursor-pointer active:scale-[0.99] border"
                style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                id="sandbox-bypass-btn"
              >
                <Terminal size={12} style={{ color: "var(--secondary)" }} />
                <span>Launch Local Sandbox Session</span>
              </button>
            </div>

            {/* Sandbox Notice / Popup Warning */}
            <p className="text-[10px] font-sans leading-relaxed text-center" style={{ color: "var(--text-faint)" }}>
              Note: Popups are secure. If internal workspace cookies restrict google sign-in inside the preview frame, our secure local developer environment bypass activates automatically.
            </p>
          </div>
        </motion.div>

        {/* System security tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center items-center gap-1.5 text-[10px] font-mono"
          style={{ color: "var(--text-faint)" }}
        >
          <ShieldCheck size={13} style={{ color: "var(--secondary)" }} />
          <span>AES-256 SECURED VIA FIREBASE CLOUD SHIELD</span>
        </motion.div>
      </div>
    </div>
  );
}
