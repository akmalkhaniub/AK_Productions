"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clapperboard, Loader2, Play, Wrench, CheckCircle2, ArrowRight, Network, Lightbulb } from 'lucide-react';
import { apiUrl } from '@/lib/api';

const EXAMPLES = [
  "Plan a remake: find a 1970s thriller IP, then break down our Library script and flag continuity risks.",
  "I have a script in the Library — produce a full production breakdown and tell me what to shoot first.",
  "Scout a sci-fi property from the 1980s and outline a development plan.",
];

export default function Showrunner() {
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!goal.trim()) return;
    setRunning(true); setResult(null); setError("");
    try {
      const res = await fetch(apiUrl('/api/showrunner/run'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (data.status === 'Completed') setResult(data);
      else setError(data.message || "The Showrunner could not complete the plan.");
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8 flex items-start gap-3">
        <Network className="w-7 h-7 text-accent mt-1" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Showrunner · Orchestrator</h1>
          <p className="text-muted-foreground">Give a production goal. The Showrunner plans and delegates to the specialist agents — then synthesizes a plan.</p>
        </div>
      </header>

      {!result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-xl bg-card shadow-sm p-6">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Find a 1970s thriller to remake, break down our Library script, and flag continuity risks."
            rows={3}
            className="w-full border border-border bg-muted/50 rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted-foreground resize-none"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setGoal(ex)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors">
                {ex.length > 52 ? ex.slice(0, 52) + '…' : ex}
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={run} disabled={running || !goal.trim()} className="h-11 px-6 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-40 flex items-center transition-colors glow-hover">
              {running ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Orchestrating…</> : <><Play className="w-4 h-4 mr-2" /> Run Showrunner <ArrowRight className="w-4 h-4 ml-2" /></>}
            </button>
          </div>
          {error && <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">{error}</p>}
        </motion.div>
      )}

      {running && (
        <div className="border border-border rounded-xl p-12 mt-6 flex flex-col items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
          <p className="text-foreground font-medium">Showrunner is planning & delegating…</p>
          <p className="text-muted-foreground text-sm mt-1">Calling specialist agents and synthesizing a plan.</p>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="border border-border rounded-xl bg-card shadow-sm p-6">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Production Plan</h3>
            <p className="text-lg text-foreground leading-relaxed">{result.summary}</p>
          </div>

          {/* Orchestration trace */}
          {result.agent_trace?.length > 0 && (
            <div className="border border-border rounded-xl bg-muted/30 p-5">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium flex items-center"><Wrench className="w-3.5 h-3.5 mr-2" /> Orchestration Trace</h3>
              <ol className="space-y-2">
                {result.agent_trace.map((s: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-foreground"><CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 shrink-0" /><span className="font-mono text-xs sm:text-sm">{s}</span></li>
                ))}
              </ol>
            </div>
          )}

          {/* Sub-agent delegations */}
          {result.delegations?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.delegations.map((d: any, i: number) => (
                <div key={i} className="border border-border rounded-xl bg-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clapperboard className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">{d.agent}</span>
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {JSON.stringify(d.data?.script_title || d.data?.original_title || d.data, null, 2).slice(0, 600)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="border border-border rounded-xl bg-card p-6">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium flex items-center"><Lightbulb className="w-3.5 h-3.5 mr-2" /> Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((r: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-foreground"><span className="text-accent mr-2">•</span>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <button onClick={() => { setResult(null); setGoal(""); }} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">← New goal</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
