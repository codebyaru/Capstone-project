import React, { useState } from "react";
import {
  Layers,
  Bot,
  Cpu,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
  Terminal,
  Mail,
  Sliders,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
import Particles from "./Particles";

interface LandingPageProps {
  onEnter: () => void;
  onSandboxBypass: () => Promise<void>;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function LandingPage({
  onEnter,
  onSandboxBypass,
  theme,
  onToggleTheme
}: LandingPageProps) {
  const [isBypassing, setIsBypassing] = useState(false);

  const handleSandboxAction = async () => {
    setIsBypassing(true);
    try {
      await onSandboxBypass();
    } finally {
      setIsBypassing(false);
    }
  };

  const agents = [
    {
      id: "agent-1",
      number: "01",
      name: "Agent 1: Systems Architect Profiler",
      icon: <Bot className="w-4 h-4" />,
      tagline: "AI-Driven Interviewing",
      description:
        "Engages you in an in-depth conversational interview about your engineering history, compiling a rich, database-linked Technical Capability Profile.",
      color: "var(--accent)"
    },
    {
      id: "agent-2",
      number: "02",
      name: "Agent 2: Market Discovery Scout",
      icon: <Sliders className="w-4 h-4" />,
      tagline: "Vector-Similarity Mapping",
      description:
        "Analyzes live market channels to calculate real-time vector matches, mapping your deep skillsets and technical insights to high-value opportunities.",
      color: "var(--secondary)"
    },
    {
      id: "agent-3",
      number: "03",
      name: "Agent 3: Proposal & Outreach Hub",
      icon: <Mail className="w-4 h-4" />,
      tagline: "Workspace Autopilot",
      description:
        "Generates hyper-tailored outreach letters, saving them directly into your Gmail drafts and compiling clean project proposals inside Google Drive.",
      color: "var(--info)"
    }
  ];

  return (
    <div
      className="min-h-screen font-sans relative overflow-hidden flex flex-col justify-between dossier-grid antialiased"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
      id="landing-page-root"
    >
      {/* Background Interactive Particles */}
      <Particles density={40} />

      {/* Decorative ambient washes matching LoginPage */}
      <div
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px]"
        style={{ backgroundColor: "var(--accent-soft)", opacity: 0.4 }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px]"
        style={{ backgroundColor: "var(--secondary-soft)", opacity: 0.4 }}
      />

      {/* Header bar matching dashboard and LoginPage layout */}
      <header
        className="border-b backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40"
        style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md border"
            style={{ backgroundColor: "var(--accent)", borderColor: "var(--accent-strong)" }}
          >
            <Layers size={18} style={{ color: "var(--accent-contrast)" }} />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-semibold font-mono tracking-wider uppercase" style={{ color: "var(--text)" }}>
              Job Genius AI
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Light/Dark mode selector */}
          <button
            type="button"
            onClick={onToggleTheme}
            id="landing-theme-toggle"
            className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer hover:scale-102 active:scale-98"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            aria-label="Toggle light and dark mode"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={onEnter}
            className="text-xs font-mono font-semibold px-4 py-2 rounded-lg border transition-all cursor-pointer hover:bg-neutral-800/10 dark:hover:bg-neutral-200/10"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)"
            }}
            id="btn-landing-signin"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-20 relative z-10 max-w-5xl mx-auto w-full gap-14">
        <div className="text-center space-y-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            // className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[10px] sm:text-xs font-mono font-bold tracking-wider"
            style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)" }}
          >
            {/* <Sparkles size={12} style={{ color: "var(--accent)" }} /> */}
            {/* <span style={{ color: "var(--secondary)" }}>AUTONOMOUS MULTI-AGENT TALENT ACQUISITION</span> */}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-[52px] font-display font-semibold tracking-tight leading-[1.1]"
            style={{ color: "var(--text)" }}
          >
            The Career Partner for <br />
            <span
              className="bg-gradient-to-r from-[var(--accent)] to-[var(--secondary)] bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, var(--accent) 0%, var(--secondary) 100%)"
              }}
            >
              Elite Systems Engineers
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Turn your skills and experience into a dynamic career engine.
            Our AI agents profile, match, and connect you with opportunities that matter.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3"
          >
            <button
              onClick={onEnter}
              className="w-full sm:w-auto font-semibold text-xs sm:text-sm px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-contrast)" }}
              id="landing-cta-get-started"
            >
              <span>Initialize Career Dashboard</span>
              <ChevronRight size={15} />
            </button>

            <button
              onClick={handleSandboxAction}
              disabled={isBypassing}
              className="w-full sm:w-auto font-mono text-xs px-6 py-3.5 rounded-lg flex items-center justify-center gap-2 border transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: "var(--text-muted)" }}
              id="landing-cta-sandbox"
            >
              {isBypassing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Terminal size={13} style={{ color: "var(--secondary)" }} />
              )}
              <span>Bypass to Local Sandbox</span>
            </button>
          </motion.div>
        </div>

        {/* Feature Cards / Showcase of the Multi-Agent Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + index * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-xl border flex flex-col justify-between h-72 relative blueprint-corners group cursor-pointer transition-shadow"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              onClick={onEnter}
            >
              <div>
                <div className="flex justify-between items-center">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center border"
                    style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border)", color: agent.color }}
                  >
                    {agent.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: "var(--text-faint)" }}>
                    STAGE {agent.number}
                  </span>
                </div>

                <h3 className="text-sm font-semibold mt-5" style={{ color: "var(--text)" }}>
                  {agent.name}
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider block mt-0.5" style={{ color: agent.color }}>
                  {agent.tagline}
                </span>

                <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {agent.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--secondary)" }}>
                <span>Activate Stage</span>
                <ChevronRight size={11} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Schematic Diagram of pipeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-full max-w-4xl p-6 rounded-xl border space-y-5"
          style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border)" }}
        >
          <div className="text-center md:text-left space-y-1">
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase" style={{ color: "var(--secondary)" }}>
              Data Pipeline & Agent Orchestration Flow
            </h3>
            <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              How capabilities flow synchronously through persistent secure layers to yield direct workspace outcomes.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 relative">
            {/* Visual connector lines */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed hidden md:block z-0" style={{ borderColor: "var(--border-strong)", transform: "translateY(-50%)" }} />

            <div className="flex-1 p-4 rounded-lg border relative z-10 text-center space-y-2" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono text-xs font-bold" style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}>
                1
              </div>
              <h4 className="text-xs sm:text-sm font-semibold">User Profile Session</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Interactive session maps architectural triumphs and core stack parameters.
              </p>
            </div>

            <div className="flex items-center justify-center shrink-0 z-10 md:rotate-0 rotate-90">
              <ChevronRight size={16} className="text-[var(--text-faint)]" />
            </div>

            <div className="flex-1 p-4 rounded-lg border relative z-10 text-center space-y-2" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono text-xs font-bold" style={{ backgroundColor: "var(--secondary-soft)", color: "var(--secondary)" }}>
                2
              </div>
              <h4 className="text-xs sm:text-sm font-semibold">Firestore Cloud Storage</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Persistent profile telemetry compiled and stored securely with local sandbox cache layers.
              </p>
            </div>

            <div className="flex items-center justify-center shrink-0 z-10 md:rotate-0 rotate-90">
              <ChevronRight size={16} className="text-[var(--text-faint)]" />
            </div>

            <div className="flex-1 p-4 rounded-lg border relative z-10 text-center space-y-2" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-mono text-xs font-bold" style={{ backgroundColor: "var(--info-soft)", color: "var(--info)" }}>
                3
              </div>
              <h4 className="text-xs sm:text-sm font-semibold">Google Workspace Sync</h4>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Auth session builds docs and creates draft pitches instantly inside your workspace.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-5 text-center text-[10px] font-mono flex flex-col sm:flex-row items-center justify-between px-6 gap-3 z-10"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-raised)", color: "var(--text-faint)" }}
      >
        <p>© 2026 The Job Genius AI • Multi-Agent Pipeline Prototype</p>
        <div className="flex items-center gap-1.5 justify-center">
          <ShieldCheck size={13} style={{ color: "var(--secondary)" }} />
          <span>FIREBASE CLOUD SECURED • AES-256</span>
        </div>
      </footer>
    </div>
  );
}
