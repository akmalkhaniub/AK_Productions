"use client";

import { motion } from "framer-motion";
import { Sparkles, Clapperboard, Mic2, FileText, Focus, ArrowRight } from "lucide-react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-start space-y-4 max-w-3xl"
      >
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl text-foreground">
          Studio OS infrastructure for modern productions.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          AK Productions leverages advanced LLMs, Computer Vision, and Audio AI to accelerate pre-production, optimize on-set workflows, and automate post-production localization.
        </p>
      </motion.section>

      {/* Agents Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
              <Sparkles className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">IP Discovery</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Programmatically scans historical literature databases to identify public domain narratives with high market viability for modern remakes.
            </p>
          </div>
          <Link href="/ip-discovery" className="inline-flex items-center text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
            Access Module
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
              <Clapperboard className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI Acting Coach</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Analyzes character dialogue syntax to provide continuous directorial feedback loops on prosody, subtext, and emotional resonance.
            </p>
          </div>
          <Link href="/acting-coach" className="inline-flex items-center text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
            Access Module
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
              <Mic2 className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Auto-Dubbing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              A high-fidelity localization engine. Automatically translates audio, clones voice timbre, and generates localized lip-sync video data.
            </p>
          </div>
          <Link href="/auto-dubbing" className="inline-flex items-center text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
            Access Module
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
              <FileText className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Script Breakdown</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Ingests raw PDF screenplays and automatically constructs comprehensive production metadata including props, wardrobe, and preliminary budgets.
            </p>
          </div>
          <Link href="/script-breakdown" className="inline-flex items-center text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
            Access Module
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group relative flex flex-col justify-between rounded-xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:border-foreground/20">
          <div>
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
              <Focus className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Continuity Agent</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              A vision-language model architecture that continuously scans frame sequences to dynamically catch wardrobe and prop discrepancies on-set.
            </p>
          </div>
          <Link href="/continuity-agent" className="inline-flex items-center text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">
            Access Module
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
