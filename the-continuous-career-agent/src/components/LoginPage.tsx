import React, { useState } from "react";
import { 
  Bot, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Fingerprint, 
  RefreshCw,
  Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginPageProps {
  onGoogleSignIn: () => Promise<void>;
  onSandboxBypass: () => Promise<void>;
}

export default function LoginPage({ onGoogleSignIn, onSandboxBypass }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isBtnClicking, setIsBtnClicking] = useState(false);

  const handleSignInAction = async () => {
    setIsBtnClicking(true);
    try {
      await onGoogleSignIn();
    } finally {
      setIsBtnClicking(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white"
      id="login-page-container"
    >
      {/* Decorative ambient background assets */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      
      {/* Technical coordinate lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Logo and Brand Heading */}
        <div className="text-center space-y-2.5">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-500 to-purple-600 items-center justify-center shadow-2xl shadow-indigo-500/10 mb-2 border border-indigo-400/25"
          >
            <Layers size={22} className="text-white" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-1.5"
          >
            <span className="text-[10px] font-bold font-mono tracking-[0.25em] text-indigo-400 uppercase block">MULTI-AGENT TALENT HUD</span>
            <h1 className="text-2xl font-bold font-sans tracking-tight text-white sm:text-3xl">
              Continuous Career Agent
            </h1>
            <p className="text-slate-400 text-xs font-sans max-w-sm mx-auto leading-relaxed">
              An autonomous multi-agent partner that conducts technical profiling, coordinates market discovery, and automates outreach templates.
            </p>
          </motion.div>
        </div>

        {/* Auth Module Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden relative"
          id="auth-card"
        >
          {/* Subtle neon indicator top border */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 opacity-80" />

          {/* Unified Sign In vs Sign Up Tabs */}
          <div className="flex bg-slate-950/80 p-1 border-b border-slate-850">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider font-mono rounded-xl transition-all cursor-pointer ${
                activeTab === "signin"
                  ? "bg-slate-900 text-slate-100 border border-slate-800"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              id="tab-select-signin"
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider font-mono rounded-xl transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-slate-900 text-slate-100 border border-slate-800"
                  : "text-slate-500 hover:text-slate-300"
              }`}
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
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Fingerprint size={15} className="text-indigo-400" /> Welcome Back
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Connect your secure Google identity to query your persistent Firestore capability mapping and view active scouting channels.
                    </p>
                  </div>

                  {/* Core capability pointers */}
                  <div className="bg-slate-950/50 border border-slate-850/50 rounded-xl p-3.5 space-y-2 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <span>Resume past conversational logs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <span>Access indexed job matching feeds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <span>Retain personalized outreach drafts</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSignInAction}
                      disabled={isBtnClicking}
                      className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-white/5 active:scale-[0.99] disabled:opacity-50"
                      id="google-signin-btn"
                    >
                      {isBtnClicking ? (
                        <RefreshCw size={14} className="animate-spin text-slate-950" />
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
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Cpu size={15} className="text-teal-400" /> Let's Register Your Profile
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Start your technical profiling onboarding with Agent 1. Establish secure, database-linked records instantly.
                    </p>
                  </div>

                  {/* Core capability pointers */}
                  <div className="bg-slate-950/50 border border-slate-850/50 rounded-xl p-3.5 space-y-2 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                      <span>Instantly link profiling metrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                      <span>Activate autonomous search criteria</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                      <span>Unlock AI portfolio branding tools</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSignInAction}
                      disabled={isBtnClicking}
                      className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-white/5 active:scale-[0.99] disabled:opacity-50"
                      id="google-signup-btn"
                    >
                      {isBtnClicking ? (
                        <RefreshCw size={14} className="animate-spin text-slate-950" />
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
              <div className="flex-grow border-t border-slate-850/60" />
              <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-mono tracking-wider uppercase">or bypass auth</span>
              <div className="flex-grow border-t border-slate-850/60" />
            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={onSandboxBypass}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-350 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-[11px] font-mono tracking-wide cursor-pointer active:scale-[0.99]"
                id="sandbox-bypass-btn"
              >
                <Terminal size={12} className="text-teal-400 group-hover:text-teal-300 transition-colors" />
                <span>Launch Local Sandbox Session</span>
              </button>
            </div>

            {/* Sandbox Notice / Popup Warning */}
            <p className="text-[10px] text-slate-500 font-sans leading-relaxed text-center">
              Note: Popups are secure. If internal workspace cookies restrict google sign-in inside the preview frame, our secure local developer environment bypass activates automatically.
            </p>
          </div>
        </motion.div>

        {/* System security tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center items-center gap-1.5 text-[10px] text-slate-500 font-mono"
        >
          <ShieldCheck size={13} className="text-indigo-500/60" />
          <span>AES-256 SECURED VIA FIREBASE CLOUD SHIELD</span>
        </motion.div>
      </div>
    </div>
  );
}
