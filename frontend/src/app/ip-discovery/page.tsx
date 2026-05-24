"use client";

import { useState } from 'react';

export default function IPDiscovery() {
  const [genre, setGenre] = useState('');
  const [era, setEra] = useState('1970s');
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState<any>(null);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPitch(null);
    
    try {
      const res = await fetch('http://localhost:8000/api/discover-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, era })
      });
      const data = await res.json();
      setPitch(data.data);
    } catch (error) {
      console.error("Failed to fetch pitch", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-light tracking-tight mb-2">IP Discovery Agent</h2>
        <p className="text-slate-400">Find the perfect retro property to remake for modern audiences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleDiscover} className="glass p-6 rounded-2xl border border-slate-700/50">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Genre</label>
              <input 
                type="text" 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Sci-Fi, Paranoia Thriller"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                required
              />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-2">Source Era</label>
              <select 
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="1960s">1960s</option>
                <option value="1970s">1970s</option>
                <option value="1980s">1980s</option>
                <option value="1990s">1990s</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-medium py-3 px-4 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-cyan-400/30"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Agent Scanning...
                </>
              ) : 'Discover IP'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          {loading && (
            <div className="h-full min-h-[400px] glass rounded-2xl flex flex-col items-center justify-center border border-cyan-500/20 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-16 h-16 border-t-2 border-b-2 border-l-2 border-cyan-400 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
              <p className="text-cyan-400 animate-pulse font-medium tracking-wide">Cross-referencing historical archives...</p>
              <p className="text-slate-500 text-sm mt-2 font-mono">Analyzing thematic resonances</p>
            </div>
          )}

          {!loading && pitch && (
            <div className="glass rounded-2xl p-8 border border-purple-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)]">
              <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-purple-500/20 blur-[60px] pointer-events-none"></div>
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">{pitch.original_title}</h3>
                  <div className="flex items-center space-x-3">
                    <span className="bg-slate-800 text-cyan-400 text-xs font-mono px-2 py-1 rounded border border-slate-700">{pitch.year}</span>
                    <span className="text-slate-400 text-sm">{pitch.genre}</span>
                  </div>
                </div>
                <div className="glass px-4 py-2 rounded-full border border-green-500/30 text-green-400 font-bold flex items-center shadow-[0_0_15px_rgba(34,197,94,0.15)] bg-green-500/5">
                  <span className="text-xl mr-1">🔥</span> {pitch.match_score}% Match
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="border-l-2 border-slate-700 pl-4 py-1">
                  <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Original Logline</h4>
                  <p className="text-slate-300 italic text-lg">"{pitch.logline}"</p>
                </div>
                
                <div className="p-6 bg-slate-800/40 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                  <h4 className="text-xs uppercase tracking-widest text-purple-400 mb-3 font-semibold flex items-center">
                    <span className="mr-2">✨</span> Modern Twist
                  </h4>
                  <p className="text-white text-lg leading-relaxed">{pitch.modern_twist}</p>
                </div>

                <div className="p-6 bg-cyan-900/10 rounded-xl border border-cyan-500/20">
                  <h4 className="text-xs uppercase tracking-widest text-cyan-500 mb-3 font-semibold flex items-center">
                    <span className="mr-2">🎯</span> Why Now?
                  </h4>
                  <p className="text-cyan-100/80 leading-relaxed">{pitch.why_now}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !pitch && (
            <div className="h-full min-h-[400px] glass rounded-2xl flex flex-col items-center justify-center border border-slate-800 border-dashed bg-slate-900/30">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700 text-2xl">
                🔎
              </div>
              <p className="text-slate-400 font-medium">Ready to uncover the next blockbuster.</p>
              <p className="text-slate-600 text-sm mt-1">Configure parameters and launch the agent.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
