"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Search, Loader2, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DataIngestion() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/ingest-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        setResult(data.data);
      } else {
        setError(data.message || "Failed to extract script.");
      }
    } catch (err) {
      setError("Network error. Make sure backend is running.");
    } finally {
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
        <form onSubmit={handleIngest} className="flex gap-4">
          <div className="relative flex-1">
            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
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
            className="h-12 px-6 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 disabled:opacity-50 flex items-center transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Extract Script"}
          </button>
        </form>
      </div>

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-border rounded-xl p-16 flex flex-col items-center justify-center bg-background min-h-[300px]"
        >
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Scraping Subtitles & Inferring Context...</h3>
          <p className="text-muted-foreground mt-2 text-sm">GPT-4o-mini is structuring the raw data into a screenplay.</p>
        </motion.div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500">
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
              {result.characters_identified.map((char: str, i: number) => (
                <span key={i} className="px-2 py-1 text-xs font-medium rounded-md bg-background border border-border text-foreground">
                  {char}
                </span>
              ))}
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[500px]">
            {result.script.map((line: any, idx: number) => (
              <div key={idx} className="mb-6 last:mb-0">
                <div className="font-semibold text-foreground text-center mb-1">{line.speaker}</div>
                <div className="max-w-md mx-auto text-center">
                  <p className="text-foreground mb-1">{line.original_dialogue}</p>
                  <p className="text-muted-foreground text-sm italic">{line.english_translation}</p>
                </div>
              </div>
            ))}
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
