"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Loader2, Play, CheckCircle2 } from 'lucide-react';

export default function AutoDubbing() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [language, setLanguage] = useState('Spanish');
  const [file, setFile] = useState<File | null>(null);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch('http://localhost:8000/api/auto-dub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, target_language: language })
      });
      const data = await res.json();
      setResult(data.data);
    } catch (error) {
      console.error("Dubbing failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Automated Video Dubbing</h1>
        <p className="text-muted-foreground">Translate dialogue, clone voices, and lip-sync video for global distribution.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <form onSubmit={handleProcess} className="border border-border rounded-xl p-8 bg-background shadow-sm">
            <div className="mb-6">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Upload Source Video</label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 hover:border-foreground/30 transition-colors cursor-pointer">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                />
                <Globe className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">{file ? file.name : "Drop video file here"}</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, MOV, or ProRes</p>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Target Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-border bg-muted/50 rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
              >
                <option value="Spanish">Spanish (Latin America)</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Urdu">Urdu</option>
                <option value="Arabic">Arabic</option>
                <option value="Turkish">Turkish</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !file}
              className="w-full h-12 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 disabled:opacity-40 flex items-center justify-center transition-colors shadow-sm"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing Pipeline...</>
              ) : 'Start Dubbing Pipeline'}
            </button>
          </form>

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-border rounded-xl p-6 bg-background"
            >
              <h3 className="text-foreground font-medium mb-4 flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Pipeline Active
              </h3>
              <ul className="space-y-3 text-sm font-mono text-muted-foreground">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-foreground" /> Uploading source file...</li>
                <li className="flex items-center opacity-70"><CheckCircle2 className="w-4 h-4 mr-2 text-foreground" /> Extracting audio track...</li>
                <li className="flex items-center opacity-50"><CheckCircle2 className="w-4 h-4 mr-2 text-foreground" /> Transcribing with Whisper...</li>
                <li className="animate-pulse flex items-center mt-2 text-foreground">→ Synthesizing new voice...</li>
              </ul>
            </motion.div>
          )}
        </div>

        <div>
          {!result && !loading && (
            <div className="h-full min-h-[400px] border border-border border-dashed rounded-xl flex flex-col items-center justify-center bg-background">
              <Globe className="w-10 h-10 text-muted-foreground mb-4 opacity-40" />
              <p className="text-muted-foreground font-medium text-center px-8">Upload a video and select a language to see the AI pipeline in action.</p>
            </div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border rounded-xl p-8 bg-background shadow-sm flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Dubbing Complete</h3>
                <span className="bg-muted border border-border text-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {result.confidence_score}% Sync
                </span>
              </div>

              <div className="flex-1 space-y-6">
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center border border-border relative overflow-hidden group cursor-pointer">
                  <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center bg-background group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-foreground ml-0.5" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-muted-foreground border border-border">
                    {result.output_video}
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Translation Preview</h4>
                  <p className="text-foreground italic mb-2">"{result.transcription_preview}"</p>
                  <p className="text-foreground font-medium">"{result.translation_preview}"</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Pipeline Logs</h4>
                  <ul className="space-y-1 text-xs font-mono text-muted-foreground bg-muted p-3 rounded-lg border border-border">
                    {result.pipeline_logs.map((log: string, idx: number) => (
                      <li key={idx} className="flex"><span className="text-foreground mr-2">&gt;</span> {log}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => setResult(null)}
                className="mt-6 w-full py-2 border border-border bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors text-sm font-medium"
              >
                Dub Another Video
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
