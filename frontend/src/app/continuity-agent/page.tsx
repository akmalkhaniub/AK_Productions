"use client";

import { useState } from 'react';

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
        const res = await fetch('http://localhost:8000/api/check-continuity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: e.target.files[0].name })
        });
        const data = await res.json();
        setResult(data.data);
      } catch (error) {
        console.error("Continuity check failed", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'High') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (severity === 'Medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light tracking-tight mb-2">AI Continuity Editor</h2>
          <p className="text-slate-400">Upload a rough cut. The agent will track objects across frames to find continuity errors.</p>
        </div>
        {result && (
          <div className="text-right">
            <span className="text-4xl font-bold text-white">{result.overall_score}<span className="text-lg text-slate-500">/100</span></span>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Continuity Score</p>
          </div>
        )}
      </header>

      {!loading && !result && (
        <div className="glass rounded-3xl p-16 border border-slate-700 border-dashed flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-rose-500/50 transition-colors cursor-pointer bg-slate-900/30">
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(243,24,96,0.1)]">
            <span className="text-5xl">🎞️</span>
          </div>
          <h3 className="text-2xl font-medium text-white mb-2">Upload Rough Cut</h3>
          <p className="text-slate-400 max-w-md">Computer vision models will analyze every single frame for logic and visual consistency.</p>
        </div>
      )}

      {loading && (
        <div className="glass rounded-3xl p-16 border border-rose-500/30 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 gap-2 opacity-10 p-4">
            {[...Array(32)].map((_, i) => (
              <div key={i} className="bg-rose-500 rounded-sm animate-pulse" style={{ animationDelay: \`\${Math.random() * 2}s\` }}></div>
            ))}
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-medium text-white">Scanning 24,500 Frames...</h3>
            <p className="text-rose-400 mt-2 font-mono text-sm tracking-widest">RUNNING YOLO-v8 OBJECT TRACKING</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="glass rounded-3xl p-8 border border-slate-700/50">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse mr-3"></span>
              Detected Discrepancies ({result.errors_found})
            </h3>
            
            <div className="space-y-4">
              {result.timeline_markers.map((marker: any) => (
                <div key={marker.id} className="bg-slate-900/80 rounded-xl p-6 border border-slate-700/50 hover:border-rose-500/30 transition-colors group flex flex-col md:flex-row gap-6">
                  
                  <div className="md:w-48 flex flex-col items-start border-r border-slate-800 pr-6">
                    <span className="font-mono text-2xl text-white font-light group-hover:text-rose-400 transition-colors">{marker.time}</span>
                    <span className={\`mt-2 px-3 py-1 text-xs border rounded-full font-medium \${getSeverityBadge(marker.severity)}\`}>
                      {marker.severity} Priority
                    </span>
                  </div>

                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-slate-200 mb-2">{marker.issue}</h4>
                    <p className="text-slate-400 text-sm">{marker.description}</p>
                    
                    <div className="mt-4 flex items-center">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500" style={{ width: \`\${marker.confidence}%\` }}></div>
                      </div>
                      <span className="ml-3 text-xs font-mono text-slate-500">{marker.confidence}% AI Confidence</span>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center">
                    <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all">
                      ▶
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => {setResult(null); setFile(null);}}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              ← Analyze another cut
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
