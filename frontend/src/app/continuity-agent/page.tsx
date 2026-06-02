"use client";

import { useState, useEffect } from 'react';
import { Focus, CheckCircle2, AlertCircle, Database, Loader2, Wrench } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ContinuityAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [scripts, setScripts] = useState<any[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/library'));
        const data = await res.json();
        if (data.status === 'success') setScripts(data.data);
      } catch { /* ignore */ }
    })();
  }, []);

  const run = async () => {
    setLoading(true); setResult(null); setError("");
    try {
      const res = await fetch(apiUrl('/api/check-continuity'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: selectedScriptId }),
      });
      const data = await res.json();
      setResult(data.data);
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const sevStyle = (s: string) =>
    s === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20'
    : s === 'Medium' ? 'bg-accent/10 text-accent border-accent/20'
    : 'bg-muted text-muted-foreground border-border';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="mb-8 flex justify-between items-end">
        <div className="flex items-start gap-3">
          <Focus className="w-7 h-7 text-accent mt-1" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Continuity Agent</h1>
            <p className="text-muted-foreground">An agent reads a Library script and flags continuity risks — wardrobe, props, timeline, lighting.</p>
          </div>
        </div>
        {result && (
          <div className="text-right shrink-0">
            <span className="text-4xl font-bold text-accent">{result.overall_score}<span className="text-lg text-muted-foreground">/100</span></span>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Continuity Score</p>
          </div>
        )}
      </header>

      {!loading && !result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="font-medium text-foreground flex items-center"><Database className="w-4 h-4 mr-2 text-muted-foreground" /> Choose a script to analyze</h3>
          </div>
          <div className="p-4 max-h-[360px] overflow-y-auto space-y-3">
            {scripts.length === 0 ? (
              <div className="text-center py-10">
                <Database className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm mb-4">No scripts in the Library yet.</p>
                <Link href="/library" className="text-sm text-accent underline underline-offset-4">Seed or ingest a script first →</Link>
              </div>
            ) : scripts.map((s) => (
              <button key={s.id} onClick={() => setSelectedScriptId(s.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${selectedScriptId === s.id ? 'border-accent bg-muted' : 'border-border hover:border-accent/30 hover:bg-muted/50'}`}>
                <div className="font-medium text-foreground text-sm line-clamp-1">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.scene_description}</div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-border flex justify-end">
            <button onClick={run} disabled={!selectedScriptId} className="h-11 px-6 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-40 flex items-center transition-colors">
              <Focus className="w-4 h-4 mr-2" /> Run Continuity Agent
            </button>
          </div>
          {error && <p className="px-4 pb-4 text-sm text-amber-600 dark:text-amber-400">{error}</p>}
        </motion.div>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border rounded-xl p-16 flex flex-col items-center justify-center bg-background min-h-[360px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
          <h3 className="text-lg font-medium text-foreground">Agent scanning for continuity risks…</h3>
          <p className="text-muted-foreground mt-2 font-mono text-xs tracking-widest">READING SCRIPT · ANALYZING SCENES</p>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {result.agent_trace?.length > 0 && (
            <div className="border border-border rounded-xl bg-muted/30 p-5">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium flex items-center"><Wrench className="w-3.5 h-3.5 mr-2" /> Agent Tool Calls</h3>
              <ol className="space-y-2">
                {result.agent_trace.map((s: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-foreground"><CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 shrink-0" /><span className="font-mono text-xs sm:text-sm">{s}</span></li>
                ))}
              </ol>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <h3 className="text-lg font-medium text-foreground mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-accent mr-2" />
              Detected Discrepancies ({result.errors_found})
            </h3>
            <div className="space-y-4">
              {result.timeline_markers.map((marker: any) => (
                <div key={marker.id} className="bg-background rounded-lg p-6 border border-border hover:border-accent/30 transition-colors flex flex-col md:flex-row gap-6">
                  <div className="md:w-48 flex flex-col items-start md:border-r border-border md:pr-6">
                    <span className="font-mono text-lg text-foreground font-medium">{marker.time || '—'}</span>
                    <span className={`mt-2 px-2.5 py-0.5 text-xs border rounded-full font-medium ${sevStyle(marker.severity)}`}>{marker.severity} Priority</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-foreground mb-1">{marker.issue}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{marker.description}</p>
                    <div className="mt-4 flex items-center">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${marker.confidence}%` }}></div>
                      </div>
                      <span className="ml-3 text-xs font-mono text-muted-foreground">{marker.confidence}% CONFIDENCE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <button onClick={() => { setResult(null); setSelectedScriptId(0); }} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">← Analyze another script</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
