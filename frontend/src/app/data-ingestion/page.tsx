"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Search, Loader2, Database, ArrowRight, Zap, PlaySquare, Settings2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DataIngestion() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [useGemini, setUseGemini] = useState(false);
  const [step, setStep] = useState(0);
  
  // Configuration State
  const [selectedModel, setSelectedModel] = useState("openai");
  const [duration, setDuration] = useState(0); // 0 = full video

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError("");
    setResult(null);
    setStep(0);

    const interval = setInterval(() => {
      setStep(prev => prev + 1);
    }, useGemini ? 7000 : 2000);

    const endpoint = useGemini ? 'http://localhost:8000/api/analyze-video' : 'http://localhost:8000/api/ingest-youtube';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          model: selectedModel,
          duration: duration 
        })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        setResult(data.data);
        setUrl(""); // Clear input on success
      } else {
        setError(data.message || "Failed to process video.");
      }
    } catch (err) {
      setError("Network error. Make sure backend is running.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Data Ingestion Engine</h1>
          <p className="text-muted-foreground">Extract dialogue from YouTube videos and format it into a structured screenplay dataset.</p>
        </div>
        <Link 
          href="/library"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Database className="w-4 h-4 mr-2" />
          View Library
        </Link>
      </header>

      <div className="border border-border rounded-xl p-8 bg-background shadow-sm mb-8">
        <form onSubmit={handleIngest}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-border pb-8">
            {/* Action Type Selection Dropdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center"><Zap className="w-4 h-4 mr-2"/> Extraction Mode</h3>
              <div className="space-y-2">
                <select
                  value={useGemini ? "deep" : "fast"}
                  onChange={(e) => setUseGemini(e.target.value === "deep")}
                  className="w-full border border-border bg-muted/50 rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all cursor-pointer"
                >
                  <option value="fast">Fast Transcript Extraction (Captions-based)</option>
                  <option value="deep">Deep Video Analysis (Multimodal MP4)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {useGemini 
                    ? "Downloads the MP4 for visual topography, camera angles, and actor sequence tracking."
                    : "Uses YouTube Closed Captions for instant trilingual screenplay generation."}
                </p>
              </div>
            </div>

            {/* Configuration Panel - AI Model Dropdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center"><Settings2 className="w-4 h-4 mr-2"/> Configuration</h3>
              
              <div className="space-y-2">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border border-border bg-muted/50 rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all cursor-pointer"
                >
                  <option value="openai">OpenAI GPT-4o-mini (Cost-efficient)</option>
                  <option value="gemini">Google Gemini 1.5 Pro (Multimodal)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Select the underlying LLM to parse and format subtitles/visual actions.
                </p>
              </div>

              {useGemini && (
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center"><Clock className="w-3 h-3 mr-1"/> Download Duration Limit</label>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{duration === 0 ? "Full Video" : `${duration / 60} minutes`}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="600" 
                    step="60"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full accent-foreground cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground">Limit the downloader to the first few minutes of the video to save time and bandwidth.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input 
                type="text" 
                placeholder="Paste YouTube URL (e.g., Pakistani Drama Episode)" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !url}
              suppressHydrationWarning
              className="h-12 px-6 rounded-md bg-zinc-950 text-zinc-50 hover:bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium disabled:opacity-40 flex items-center justify-center transition-colors shadow-md cursor-pointer border border-zinc-200 dark:border-zinc-800"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (useGemini ? "Download & Analyze" : "Extract Script")}
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-border rounded-xl p-12 flex flex-col items-center justify-center bg-background min-h-[350px]"
        >
          <Loader2 className="w-10 h-10 animate-spin text-foreground mb-6" />
          <h3 className="text-xl font-semibold text-foreground mb-6">
            {useGemini ? "Multimodal Video Analysis Pipeline" : "Fast Script Ingestion Pipeline"}
          </h3>
          
          <div className="w-full max-w-md bg-muted/50 rounded-lg border border-border p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Pipeline Status</h4>
            <ul className="space-y-3 text-sm font-mono">
              {!useGemini ? (
                <>
                  <li className={`flex items-center gap-2 ${step >= 0 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 0 ? "✓" : "→"} 1. Fetching YouTube captions stream
                  </li>
                  <li className={`flex items-center gap-2 ${step >= 1 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 1 ? "✓" : step === 1 ? "→" : "•"} 2. Extracting Urdu & English tracks
                  </li>
                  <li className={`flex items-center gap-2 ${step >= 2 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 2 ? "✓" : step === 2 ? "→" : "•"} 3. Parsing screenplay syntax with {selectedModel === 'openai' ? 'GPT-4o-mini' : 'Gemini 1.5 Pro'}
                  </li>
                  <li className={`flex items-center gap-2 ${step >= 3 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 3 ? "✓" : step === 3 ? "→" : "•"} 4. Mapping characters & dialogue structures
                  </li>
                </>
              ) : (
                <>
                  <li className={`flex items-center gap-2 ${step >= 0 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 0 ? "✓" : "→"} 1. Connecting to YouTube downloader
                  </li>
                  <li className={`flex items-center gap-2 ${step >= 1 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 1 ? "✓" : step === 1 ? "→" : "•"} 2. Downloading video stream to local backend
                  </li>
                  <li className={`flex items-center gap-2 ${step >= 2 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 2 ? "✓" : step === 2 ? "→" : "•"} 3. Uploading file to Google Vertex AI storage
                  </li>
                  <li className={`flex items-center gap-2 ${step >= 3 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 3 ? "✓" : step === 3 ? "→" : "•"} 4. Analyzing scene layout & actor actions (Gemini 1.5 Pro)
                  </li>
                  <li className={`flex items-center gap-2 ${step >= 4 ? 'text-foreground font-semibold' : 'text-muted-foreground/40'}`}>
                    {step > 4 ? "✓" : step === 4 ? "→" : "•"} 5. Compiling trilingual dialogue tracks
                  </li>
                </>
              )}
            </ul>
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
          className="border border-border rounded-xl overflow-hidden bg-background"
        >
          <div className="bg-muted p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground mb-1">{result.title}</h2>
            <p className="text-muted-foreground text-sm">{result.scene_description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.characters_identified.map((char: string, i: number) => (
                <span key={i} className="px-2 py-1 text-xs font-medium rounded-md bg-background border border-border text-foreground">
                  {char}
                </span>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2">
            {/* Visual Sequences (If Gemini is used) */}
            {result.actor_sequences && (
              <div className="p-6 border-b md:border-b-0 md:border-r border-border max-h-[500px] overflow-y-auto bg-muted/30">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-6 flex items-center">
                  <PlaySquare className="w-4 h-4 mr-2" />
                  Visual Actor Sequences
                </h3>
                <div className="space-y-6">
                  {result.actor_sequences.map((seq: any, idx: number) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-foreground/30">
                      <div className="font-semibold text-foreground">{seq.character}</div>
                      <div className="text-xs font-mono text-muted-foreground mb-1">{seq.appearance_timestamps}</div>
                      <p className="text-sm text-foreground/80">{seq.visual_actions}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Script / Dialogue */}
            <div className={`p-6 overflow-y-auto max-h-[500px] ${!result.actor_sequences ? 'md:col-span-2' : ''}`}>
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-6 flex items-center">
                <Video className="w-4 h-4 mr-2" />
                Screenplay
              </h3>
              {result.script.map((line: any, idx: number) => (
                <div key={idx} className="mb-8 last:mb-0">
                  <div className="font-semibold text-foreground text-center mb-2 uppercase tracking-wider">{line.speaker}</div>
                  <div className="max-w-md mx-auto text-center space-y-1">
                    <p className="text-xl text-foreground mb-1 font-arabic" dir="rtl">{line.dialogue.urdu_script}</p>
                    <p className="text-foreground/90 font-medium">{line.dialogue.roman_urdu}</p>
                    <p className="text-muted-foreground text-sm italic">{line.dialogue.english}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-muted p-4 border-t border-border flex justify-end">
            <Link 
              href="/library"
              className="inline-flex h-9 items-center justify-center rounded-md bg-foreground text-background px-4 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Saved to Database
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
