"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, DollarSign, Database, Wrench, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';

export default function ScriptBreakdown() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Library scripts — the agent breaks down a real ingested script
  const [scripts, setScripts] = useState<any[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/library'));
        const data = await res.json();
        if (data.status === 'success') setScripts(data.data);
      } catch {
        console.error("Failed to fetch library");
      }
    })();
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch(apiUrl('/api/script-breakdown'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: selectedScriptId }),
      });
      const data = await res.json();
      if (data.status === 'success' && data.data?.status !== 'error') {
        setResult(data.data);
      } else {
        setError(data.data?.message || data.message || "Breakdown failed");
      }
    } catch {
      setError("Network error. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Cast':
      case 'VFX':
        return 'bg-foreground/10 text-foreground border-foreground/20';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">AI Script Breakdown & Budgeting</h1>
        <p className="text-muted-foreground">An autonomous agent reads a script from your Library — using tools to browse and inspect it — then extracts production elements and estimates costs.</p>
      </header>

      {!loading && !result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step 1: pick a script */}
          <div className="border border-border rounded-xl bg-background shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="font-medium text-foreground flex items-center">
                <Database className="w-4 h-4 mr-2 text-muted-foreground" />
                Step 1: Choose a script from the Library
              </h3>
              <p className="text-xs text-muted-foreground mt-1">The agent will call <span className="font-mono">get_script</span> to read the real dialogue before breaking it down.</p>
            </div>
            <div className="p-4 max-h-[420px] overflow-y-auto space-y-3">
              {scripts.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm mb-4">No scripts in the Library yet.</p>
                  <Link href="/data-ingestion" className="text-sm text-foreground underline underline-offset-4">Ingest a YouTube video first →</Link>
                </div>
              ) : (
                scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => setSelectedScriptId(script.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedScriptId === script.id
                        ? 'border-foreground bg-muted'
                        : 'border-border hover:border-foreground/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-medium text-foreground text-sm line-clamp-1">{script.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{script.scene_description}</div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {script.characters_identified?.slice(0, 3).map((c: string, i: number) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Step 2: launch */}
          <div className="border border-border rounded-xl bg-background shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="font-medium text-foreground flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-muted-foreground" />
                Step 2: Run the breakdown agent
              </h3>
              <p className="text-xs text-muted-foreground mt-1">The agent autonomously decides which tools to call until it submits a structured breakdown.</p>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              {selectedScriptId === 0 ? (
                <p className="text-muted-foreground text-sm">Select a script to enable the agent.</p>
              ) : (
                <p className="text-foreground text-sm mb-6">Ready to break down <span className="font-medium">{scripts.find(s => s.id === selectedScriptId)?.title}</span>.</p>
              )}
              <button
                onClick={handleRun}
                disabled={selectedScriptId === 0}
                className="h-12 px-6 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-40 flex items-center justify-center transition-colors shadow-sm"
              >
                <Wrench className="w-4 h-4 mr-2" /> Run Breakdown Agent
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              {error && <p className="text-sm text-amber-600 dark:text-amber-400 mt-4">{error}</p>}
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border rounded-xl p-16 flex flex-col items-center justify-center bg-background min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Agent working…</h3>
          <p className="text-muted-foreground mt-2 text-sm">Browsing the Library, reading the script, and identifying production elements.</p>
        </motion.div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Agent trace */}
          {result.agent_trace?.length > 0 && (
            <div className="border border-border rounded-xl bg-muted/30 p-5">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium flex items-center">
                <Wrench className="w-3.5 h-3.5 mr-2" /> Agent Tool Calls
              </h3>
              <ol className="space-y-2">
                {result.agent_trace.map((step: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="font-mono text-xs sm:text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 border border-border rounded-xl p-8 bg-background shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Project</h3>
              <h2 className="text-2xl font-bold text-foreground mb-6">{result.script_title}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Scenes</p>
                  <p className="text-xl font-bold text-foreground">{result.total_scenes}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Speaking Roles</p>
                  <p className="text-xl font-bold text-foreground">{result.speaking_roles}</p>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 border border-border rounded-xl p-8 bg-background shadow-sm flex flex-col justify-center">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-muted-foreground mr-2" />
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">AI Estimated Budget</h3>
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">{result.estimated_budget_range}</p>
              <p className="text-xs text-muted-foreground">Based on current market rental rates & SAG minimums</p>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
            <div className="bg-muted/30 px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-medium text-foreground flex items-center"><FileText className="w-4 h-4 mr-2" /> Extracted Elements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Item / Description</th>
                    <th className="px-6 py-4 font-medium">Scene(s)</th>
                    <th className="px-6 py-4 font-medium">Notes</th>
                    <th className="px-6 py-4 font-medium text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.elements.map((el: any) => (
                    <tr key={el.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getCategoryStyle(el.category)}`}>{el.category}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{el.item}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">{el.scene}</td>
                      <td className="px-6 py-4 text-muted-foreground italic">{el.notes}</td>
                      <td className="px-6 py-4 text-right text-foreground font-medium">{el.cost_est}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button onClick={() => { setResult(null); setSelectedScriptId(0); }} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              ← Break down another script
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
