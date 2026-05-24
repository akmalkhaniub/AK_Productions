"use client";

import { useState } from 'react';

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
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-light tracking-tight mb-2">Automated Video Dubbing</h2>
        <p className="text-slate-400">Translate dialogue, clone voices, and lip-sync video in one click.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <form onSubmit={handleProcess} className="glass rounded-3xl p-8 border border-slate-700/50">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Upload Source Video</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 transition-all cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
              >
                <option value="Spanish">Spanish (Latin America)</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Urdu">Urdu</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !file}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-emerald-400/30"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Pipeline...
                </>
              ) : 'Start Dubbing Pipeline'}
            </button>
          </form>

          {loading && (
            <div className="glass rounded-3xl p-6 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-emerald-500 w-full animate-[progress_3.5s_ease-in-out_forwards]"></div>
              <h3 className="text-emerald-400 font-medium mb-3 flex items-center">
                <span className="animate-spin mr-2">⚙️</span> Pipeline Active
              </h3>
              <ul className="space-y-2 text-sm font-mono text-slate-400">
                <li className="flex items-center"><span className="text-emerald-500 mr-2">✓</span> Uploading source file...</li>
                <li className="flex items-center opacity-70"><span className="text-emerald-500 mr-2">✓</span> Extracting audio track...</li>
                <li className="flex items-center opacity-50"><span className="text-emerald-500 mr-2">✓</span> Transcribing with Whisper...</li>
                <li className="animate-pulse flex items-center mt-2 text-slate-300">➜ Synthesizing new voice...</li>
              </ul>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes progress {
                  0% { width: 0%; }
                  50% { width: 60%; }
                  100% { width: 100%; }
                }
              `}} />
            </div>
          )}
        </div>

        <div>
          {!result && !loading && (
            <div className="h-full min-h-[400px] glass rounded-3xl flex flex-col items-center justify-center border border-slate-700/50 border-dashed bg-slate-900/30">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700 text-2xl">
                🌐
              </div>
              <p className="text-slate-400 font-medium text-center px-8">Upload a video and select a language to see the AI pipeline in action.</p>
            </div>
          )}

          {result && (
            <div className="h-full glass rounded-3xl p-8 border border-emerald-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)] flex flex-col">
              <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500/20 blur-[60px] pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-2xl font-bold text-white">Dubbing Complete</h3>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                  {result.confidence_score}% Sync Accuracy
                </span>
              </div>

              <div className="flex-1 space-y-6 relative z-10">
                <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 relative overflow-hidden group cursor-pointer">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">
                    <span className="text-white text-2xl ml-1">▶</span>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-xs font-mono text-emerald-400">
                    {result.output_video}
                  </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Translation Preview</h4>
                  <p className="text-slate-300 italic mb-2">"{result.transcription_preview}"</p>
                  <p className="text-emerald-400 font-medium">"{result.translation_preview}"</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-widest text-emerald-500 mb-2">Pipeline Logs</h4>
                  <ul className="space-y-1 text-xs font-mono text-slate-400 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {result.pipeline_logs.map((log: string, idx: number) => (
                      <li key={idx} className="flex"><span className="text-emerald-500 mr-2">&gt;</span> {log}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => setResult(null)}
                className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Dub Another Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
