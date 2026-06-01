"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic2, Loader2, ArrowRight, Database, FileText, BarChart3, AlertTriangle } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';

export default function ActingCoach() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  // Library scripts for agent-to-agent comparison
  const [scripts, setScripts] = useState<any[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState(0);
  const [selectedScript, setSelectedScript] = useState<any>(null);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const res = await fetch(apiUrl('/api/library'));
        const data = await res.json();
        if (data.status === 'success') setScripts(data.data);
      } catch (err) {
        console.error("Failed to fetch library");
      }
    };
    fetchScripts();
  }, []);

  const handleScriptSelect = (id: number) => {
    setSelectedScriptId(id);
    const found = scripts.find(s => s.id === id);
    setSelectedScript(found || null);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(apiUrl('/api/analyze-performance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: file ? file.name : "audition_take_1.wav",
          script_id: selectedScriptId 
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResult(data.data);
      } else {
        setError(data.message || "Analysis failed");
      }
    } catch (err) {
      setError("Network error. Make sure backend is running.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">AI Acting Coach</h1>
        <p className="text-muted-foreground">Upload an audition tape and compare the performance against a script from your Library.</p>
      </header>

      {!result && !analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Step 1: Select Reference Script */}
          <div className="border border-border rounded-xl bg-background shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="font-medium text-foreground flex items-center">
                <Database className="w-4 h-4 mr-2 text-muted-foreground" />
                Step 1: Select Reference Script from Library
              </h3>
              <p className="text-xs text-muted-foreground mt-1">The Acting Coach agent will read the Data Ingestion agent's output to compare against.</p>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
              {scripts.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm mb-4">No scripts in Library yet.</p>
                  <Link href="/data-ingestion" className="text-sm text-foreground underline underline-offset-4">Ingest a YouTube video first →</Link>
                </div>
              ) : (
                scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => handleScriptSelect(script.id)}
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

          {/* Step 2: Upload Audio + Launch */}
          <div className="border border-border rounded-xl bg-background shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-muted/30">
              <h3 className="font-medium text-foreground flex items-center">
                <Mic2 className="w-4 h-4 mr-2 text-muted-foreground" />
                Step 2: Upload Audition Audio
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Upload a .wav or .mp3 of the actor performing the selected script.</p>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 hover:border-foreground/30 transition-colors cursor-pointer mb-6">
                  <input 
                    type="file" 
                    accept="audio/*,video/*" 
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <Mic2 className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">{file ? file.name : "Drop audition tape here"}</p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, WAV, MP3 supported</p>
                </div>

                {selectedScript && (
                  <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Reference Script Selected</p>
                    <p className="text-sm font-medium text-foreground">{selectedScript.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedScript.characters_identified?.join(", ")}</p>
                  </div>
                )}
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={!selectedScriptId && !file}
                className="w-full h-12 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-40 flex items-center justify-center transition-colors shadow-sm"
              >
                Analyze Performance
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {analyzing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-border rounded-xl p-16 flex flex-col items-center justify-center bg-background min-h-[400px]"
        >
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Gemini 1.5 Pro is analyzing the performance...</h3>
          <p className="text-muted-foreground mt-2 text-sm max-w-md text-center">
            The Acting Coach agent is reading the script from the Library database and comparing it against the actor's delivery.
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center"><Database className="w-3 h-3 mr-1" /> Reading Library</span>
            <span>→</span>
            <span className="flex items-center"><Mic2 className="w-3 h-3 mr-1" /> Analyzing Audio</span>
            <span>→</span>
            <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> Generating Notes</span>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 mb-8">
          {error}
        </div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-border rounded-xl p-6 bg-background text-center">
              <p className="text-4xl font-bold text-foreground">{result.confidence}<span className="text-lg text-muted-foreground">%</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Confidence</p>
            </div>
            <div className="border border-border rounded-xl p-6 bg-background">
              <p className="text-lg font-semibold text-foreground">{result.primary_emotion}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Detected Emotion</p>
            </div>
            <div className="border border-border rounded-xl p-6 bg-background">
              <p className="text-sm font-medium text-foreground">{result.pacing}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Pacing</p>
            </div>
            <div className="border border-border rounded-xl p-6 bg-background">
              <p className="text-sm font-medium text-foreground">{result.dynamic_range}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Dynamic Range</p>
            </div>
          </div>

          {/* Script-specific metrics */}
          {result.script_accuracy && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-border rounded-xl p-6 bg-background">
                <p className="text-sm font-medium text-foreground">{result.script_accuracy}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Script Accuracy</p>
              </div>
              <div className="border border-border rounded-xl p-6 bg-background">
                <p className="text-sm font-medium text-foreground">{result.character_consistency}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Character Consistency</p>
              </div>
              <div className="border border-border rounded-xl p-6 bg-background">
                <p className="text-sm font-medium text-foreground">{result.scene_understanding}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">Scene Understanding</p>
              </div>
            </div>
          )}

          {/* Waveform */}
          <div className="border border-border rounded-xl p-8 bg-background">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Prosody & Pitch Contour
            </h3>
            <div className="flex items-end space-x-1 h-32 w-full">
              {result.waveform?.map((val: number, i: number) => (
                <div 
                  key={i} 
                  className="flex-1 bg-foreground/80 rounded-t-sm"
                  style={{ height: `${val * 100}%` }}
                ></div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground font-mono border-t border-border pt-2">
              <span>00:00</span>
              <span>Scene Climax</span>
              <span>01:45</span>
            </div>
          </div>

          {/* Director's Notes */}
          <div className="border border-border rounded-xl p-8 bg-background border-l-4 border-l-foreground">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
              🤖 Director's Notes (Gemini 1.5 Pro)
            </h3>
            <p className="text-lg text-foreground leading-relaxed italic">
              "{result.director_notes}"
            </p>
          </div>

          {/* Improvement Areas */}
          {result.improvement_areas && result.improvement_areas.length > 0 && (
            <div className="border border-border rounded-xl p-8 bg-background">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Areas for Improvement
              </h3>
              <ul className="space-y-3">
                {result.improvement_areas.map((area: string, i: number) => (
                  <li key={i} className="flex items-start text-foreground">
                    <span className="text-muted-foreground mr-3 font-mono text-sm">{i + 1}.</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center mt-8">
            <button 
              onClick={() => { setResult(null); setFile(null); setError(""); }}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              ← Analyze another performance
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
