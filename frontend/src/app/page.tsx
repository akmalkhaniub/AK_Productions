"use client";

import { motion } from "framer-motion";
import { Sparkles, Clapperboard, Mic2, FileText, Focus, ArrowRight, Radar, Video } from "lucide-react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const agents = [
  { name: "Data Ingestion", href: "/data-ingestion", icon: Video, desc: "Paste a YouTube URL — the engine downloads it, watches it with Gemini, and emits a structured trilingual screenplay." },
  { name: "IP Discovery", href: "/ip-discovery", icon: Sparkles, desc: "Scans historical narratives to surface public-domain stories with high market viability for modern remakes." },
  { name: "Script Breakdown", href: "/script-breakdown", icon: FileText, desc: "An autonomous agent reads a Library script with tools, then extracts cast, props, wardrobe, VFX and a budget." },
  { name: "AI Acting Coach", href: "/acting-coach", icon: Clapperboard, desc: "Compares an audition against the written scene for prosody, subtext, and emotional resonance." },
  { name: "Auto-Dubbing", href: "/auto-dubbing", icon: Mic2, desc: "Localization engine: translates audio, clones voice timbre, and generates lip-synced video." },
  { name: "Continuity Agent", href: "/continuity-agent", icon: Focus, desc: "A vision-language pipeline that scans frame sequences to catch wardrobe and prop discrepancies on-set." },
  { name: "Studio Intelligence", href: "/industry-intel", icon: Radar, desc: "A daily agentic brief of what dropped across the channels your studio tracks — and why it matters." },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-start space-y-5 max-w-3xl pt-6"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          AI-Native Film Production
        </span>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl text-foreground leading-[1.05]">
          Studio OS for the{" "}
          <span className="gradient-text">modern production house</span>.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          A network of specialized AI agents — multimodal video analysis, autonomous script breakdown, localization, and industry intelligence — sharing one persistent knowledge base.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/pipeline" className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 glow-hover">
            Start Pipeline <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/library" className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card/50 px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Browse Library
          </Link>
        </div>
      </motion.section>

      {/* Agents grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <motion.div
              key={agent.href}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-all glow-hover hover:border-accent/40"
            >
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{agent.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{agent.desc}</p>
              </div>
              <Link href={agent.href} className="inline-flex items-center text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                Access Module
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
