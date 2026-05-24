"use client";

import { useState } from 'react';

export default function ActingCoach() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalyzing(true);
      
      try {
        const res = await fetch('http://localhost:8000/api/analyze-performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: e.target.files[0].name })
        });
        const data = await res.json();
        setResult(data.data);
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-light tracking-tight mb-2">AI Acting Coach</h2>
        <p className="text-slate-400">Upload raw audition footage. The agent will extract prosody, pitch, and emotion.</p>
      </header>

      {!analyzing && !result && (
        <div className="glass rounded-3xl p-12 border border-slate-700 border-dashed flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-purple-500/50 transition-colors cursor-pointer">
          <input 
            type="file" 
            accept="audio/*,video/*" 
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="text-4xl">📤</span>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Drop Audition Tape Here</h3>
          <p className="text-slate-400 max-w-md">Supported formats: .mp4, .mov, .wav, .mp3</p>
        </div>
      )}

      {analyzing && (
        <div className="glass rounded-3xl p-12 border border-purple-500/30 flex flex-col items-center justify-center relative overflow-hidden h-[400px]">
          <div className="absolute inset-0 bg-purple-500/5 animate-pulse"></div>
          
          <div className="flex space-x-2 mb-8 items-end h-16">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 bg-purple-500 rounded-t-sm"
                style={{ 
                  height: `${Math.random() * 100}%`,
                  animation: `bounce ${0.5 + Math.random()}s infinite alternate ease-in-out` 
                }}
              ></div>
            ))}
          </div>
          
          <h3 className="text-xl font-medium text-purple-400 animate-pulse">Agent is extracting vocal prosody...</h3>
          <p className="text-slate-500 mt-2 text-sm font-mono">Running Wav2Vec2 Emotion Classification</p>
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes bounce {
              from { height: 10%; }
              to { height: 100%; }
            }
          `}} />
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass rounded-3xl p-8 border border-slate-700/50">
              <h3 className="text-lg font-medium text-slate-300 mb-6">Prosody & Pitch Contour</h3>
              <div className="flex items-end space-x-1 h-32 w-full">
                {result.waveform.map((val: number, i: number) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm opacity-80"
                    style={{ height: `${val * 100}%` }}
                  ></div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-500 font-mono border-t border-slate-800 pt-2">
                <span>00:00</span>
                <span>Scene Climax</span>
                <span>01:45</span>
              </div>
            </div>

            <div className="glass rounded-3xl p-8 border border-purple-500/30 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-[40px]"></div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Detected Emotion</h3>
              <p className="text-3xl font-bold text-white mb-2">{result.primary_emotion}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                {result.confidence}% Confidence
              </div>
              
              <div className="mt-8 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pacing</p>
                  <p className="text-slate-200">{result.pacing}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dynamic Range</p>
                  <p className="text-slate-200">{result.dynamic_range}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-8 border border-slate-700/50 border-l-4 border-l-cyan-500">
            <h3 className="text-sm font-medium text-cyan-500 uppercase tracking-widest mb-3 flex items-center">
              <span className="mr-2">🤖</span> Agent Director's Notes
            </h3>
            <p className="text-lg text-slate-300 leading-relaxed italic">
              "{result.director_notes}"
            </p>
          </div>
          
          <div className="flex justify-center mt-8">
            <button 
              onClick={() => {setResult(null); setFile(null);}}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              ← Analyze another tape
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
