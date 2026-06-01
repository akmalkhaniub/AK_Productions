"use client";

import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { motion } from 'framer-motion';

export default function ContinuityAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLoading(true);
      setResult(null);
      
      try {
        const res = await fetch(apiUrl('/api/check-continuity'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: e.target.files[0].name })
        });
        const data = await res.json();
        setResult(data.data);
      } catch (error) {
        console.error("Continuity check failed", error);
        // Fallback mock data in case backend fails
        setTimeout(() => {
          setResult({
            overall_score: 85,
            errors_found: 2,
            timeline_markers: [
              { id: 1, time: "01:24:12", issue: "Coffee cup vanishes", description: "The actor is holding a mug, but in the reverse shot, their hand is empty.", severity: "High", confidence: 98 },
              { id: 2, time: "02:11:05", issue: "Tie knot changes", description: "The protagonist's tie knot is slightly different between the two takes.", severity: "Low", confidence: 64 }
            ]
          });
        }, 2000);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Continuity Editor</h1>
          <p className="text-muted-foreground">Upload a sequence. Computer vision models will track objects across frames to identify spatial logic errors.</p>
        </div>
        {result && (
          <div className="text-right">
            <span className="text-4xl font-bold text-foreground">{result.overall_score}<span className="text-lg text-muted-foreground">/100</span></span>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Continuity Score</p>
          </div>
        )}
      </header>

      {!loading && !result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-dashed border-border rounded-xl p-16 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 hover:border-foreground/30 transition-colors cursor-pointer bg-background"
        >
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <UploadCloud className="w-8 h-8 text-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">Select Video Sequence</h3>
          <p className="text-sm text-muted-foreground max-w-md">MP4, MOV, or ProRes up to 5GB. The visual model processes at 24fps.</p>
        </motion.div>
      )}

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-border rounded-xl p-16 flex flex-col items-center justify-center relative bg-background min-h-[400px]"
        >
          <div className="w-12 h-12 border-4 border-muted border-t-foreground rounded-full animate-spin mb-6"></div>
          <h3 className="text-lg font-medium text-foreground">Running Visual Model...</h3>
          <p className="text-muted-foreground mt-2 font-mono text-xs tracking-widest">ANALYZING SPATIAL TOPOGRAPHY</p>
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-xl border border-border bg-background p-8 shadow-sm">
            <h3 className="text-lg font-medium text-foreground mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-foreground mr-2" />
              Detected Discrepancies ({result.errors_found})
            </h3>
            
            <div className="space-y-4">
              {result.timeline_markers.map((marker: any) => (
                <div key={marker.id} className="bg-background rounded-lg p-6 border border-border hover:border-foreground/30 transition-colors flex flex-col md:flex-row gap-6">
                  
                  <div className="md:w-48 flex flex-col items-start border-r border-border pr-6">
                    <span className="font-mono text-xl text-foreground font-medium">{marker.time}</span>
                    <span className="mt-2 px-2.5 py-0.5 text-xs border border-border bg-muted rounded-full font-medium text-foreground">
                      {marker.severity} Priority
                    </span>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-foreground mb-1">{marker.issue}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{marker.description}</p>
                    
                    <div className="mt-4 flex items-center">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground" style={{ width: `${marker.confidence}%` }}></div>
                      </div>
                      <span className="ml-3 text-xs font-mono text-muted-foreground">{marker.confidence}% CONFIDENCE</span>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center pl-4 border-l border-border">
                    <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                      <Play className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <button 
              onClick={() => {setResult(null); setFile(null);}}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              ← Analyze another sequence
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
