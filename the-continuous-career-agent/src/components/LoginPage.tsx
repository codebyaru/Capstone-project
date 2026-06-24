import React, { useState } from "react";
import {
  Layers,
  ShieldCheck,
  Cpu,
  Fingerprint,
  RefreshCw,
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

export default function LoginPage({ 
  onGoogleSignIn, 
  onEmailSignIn, 
  onEmailSignUp,
  theme,
  onToggleTheme 
}: LoginPageProps) {
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
    setEmail("");
    setFullName("");
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

    if (activeTab === "signup" && !allCriteriaMet) {
      setErrorMsg("Password is not strong enough. Please satisfy all security rules.");
      return;
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
      }
      
      setErrorMsg(displayError);
    } finally {
      setIsBtnClicking(false);
    }
  };

  return (
    <div
      className="min-h-screen font-sans flex items-center justify-center p-4 relative overflow-hidden"
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
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Decorative ambient washes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px]" style={{ backgroundColor: "var(--accent-soft)", opacity: 0.6 }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px]" style={{ backgroundColor: "var(--secondary-soft)", opacity: 0.6 }} />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Logo and Brand Heading */}
        <div className="text-center space-y-2.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="inline-flex w-12 h-12 rounded-xl items-center justify-center shadow-xl mb-2 border"
            style={{ backgroundColor: "var(--accent)", borderColor: "var(--accent-strong)" }}
          >
            <Layers size={22} style={{ color: "var(--accent-contrast)" }} />
          </motion.div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold font-mono tracking-[0.25em] uppercase block" style={{ color: "var(--secondary)" }}>
              Multi-Agent Talent Dossier
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              Job Genius AI
            </h1>
            <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
              An autonomous multi-agent partner that conducts technical profiling, coordinates market discovery, and automates outreach templates.
            </p>
          </div>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl text-xs border text-center font-mono"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Auth Module Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl shadow-2xl overflow-hidden relative border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          id="auth-card"
        >
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{ backgroundColor: "var(--accent)", opacity: 0.8 }} />

          {/* Tab Selection */}
          <div className="flex p-1 border-b" style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => handleTabChange("signin")}
              className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider font-mono rounded-lg transition-all cursor-pointer"
              style={activeTab === "signin" ? { backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" } : { color: "var(--text-faint)" }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className="flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider font-mono rounded-lg transition-all cursor-pointer"
              style={activeTab === "signup" ? { backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" } : { color: "var(--text-faint)" }}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {/* Native Form For Email and Password Submission */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === "signin" ? (
                  <motion.div
                    key="signin-inputs"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>Email Address</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all"
                        style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text)" }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all"
                        style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text)" }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup-inputs"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-3"
                  >
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>Full Name</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Mercer"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all"
                        style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text)" }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>Email Address</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all"
                        style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text)" }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>Secure Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition-all"
                        style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text)" }}
                      />
                      {/* Real-time Dynamic Password Metrics Indicator */}
                      <div className="pt-1.5 grid grid-cols-5 gap-1 text-[9px] font-mono text-center">
                        <div style={{ color: lenMet ? "var(--accent)" : "var(--text-faint)" }}>Min 8 Chars</div>
                        <div style={{ color: upperMet ? "var(--accent)" : "var(--text-faint)" }}>A-Z</div>
                        <div style={{ color: lowerMet ? "var(--accent)" : "var(--text-faint)" }}>a-z</div>
                        <div style={{ color: digitMet ? "var(--accent)" : "var(--text-faint)" }}>0-9</div>
                        <div style={{ color: specialMet ? "var(--accent)" : "var(--text-faint)" }}>Special</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Action Button For Credentials */}
              <button
                type="submit"
                disabled={isBtnClicking}
                className="w-full mt-2 font-semibold py-2.5 px-5 rounded-xl border transition-all text-xs uppercase tracking-wider cursor-pointer active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                {isBtnClicking ? <RefreshCw size={14} className="animate-spin mx-auto" /> : <span>Confirm Credentials</span>}
              </button>
            </form>

            {/* Separator Layout Line */}
            <div className="relative flex py-1 items-center font-mono text-[10px]">
              <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }}></div>
              <span className="flex-shrink mx-4" style={{ color: "var(--text-faint)" }}>OR PROVIDER AUTH</span>
              <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }}></div>
            </div>

            {/* Google Authentication Block */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignInAction}
                disabled={isBtnClicking}
                className="w-full font-semibold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
                id="google-signin-btn"
              >
                {isBtnClicking ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.091 14.99 0 12 0 7.37 0 3.336 2.627 1.345 6.471l3.92 3.294z"/>
                    <path fill="#4285F4" d="M23.49 12.275c0-.853-.076-1.67-.218-2.455H12v4.64h6.46c-.28 1.5-1.127 2.766-2.39 3.618l3.712 2.877c2.172-2.002 3.42-4.947 3.42-8.68z"/>
                    <path fill="#FBBC05" d="M5.266 14.235L1.345 17.53A11.966 11.966 0 0 0 12 24c2.93 0 5.617-.982 7.782-2.658l-3.712-2.877c-.11.077-1.173.83-4.07.83-3.664 0-6.772-2.478-7.876-5.834l-3.918 3.3l.06-.064z"/>
                    <path fill="#34A853" d="M12 19.38c-3.664 0-6.772-2.478-7.876-5.834L.206 16.84C2.197 20.686 6.233 23.313 12 23.313c3.083 0 5.86-.99 7.782-2.658l-3.712-2.877c-.11.077-1.173.83-4.07.83z"/>
                  </svg>
                )}
                <span>{activeTab === "signin" ? "Continue with Google" : "Register with Google"}</span>
              </button>
            </div>

          </div>
        </motion.div>

        {/* System security tag */}
        <div className="flex justify-center items-center gap-1.5 text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>
          <ShieldCheck size={13} style={{ color: "var(--secondary)" }} />
          <span>AES-256 SECURED VIA FIREBASE CLOUD SHIELD</span>
        </div>
      </div>
    </div>
  );
}
