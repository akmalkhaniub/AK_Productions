"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Sparkles, Film, TrendingUp } from 'lucide-react';
import { apiUrl } from '@/lib/api';

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
      const res = await fetch(apiUrl('/api/discover-ip'), {
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
    <div className="max-w-5xl mx-auto py-10 px-4">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">IP Discovery Agent</h1>
        <p className="text-muted-foreground">Find forgotten intellectual properties ripe for a modern remake.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleDiscover} className="border border-border rounded-xl p-6 bg-background shadow-sm">
            <div className="mb-6">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Target Genre</label>
              <input 
                type="text" 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g., Sci-Fi, Paranoia Thriller"
                className="w-full border border-border bg-muted/50 rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground placeholder:text-muted-foreground transition-all"
                required
              />
            </div>
            <div className="mb-8">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Source Era</label>
              <select 
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full border border-border bg-muted/50 rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
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
              className="w-full h-12 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center transition-colors shadow-sm"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Agent Scanning...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Discover IP</>
              )}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full min-h-[400px] border border-border rounded-xl flex flex-col items-center justify-center bg-background"
            >
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">Cross-referencing historical archives...</p>
              <p className="text-muted-foreground text-sm mt-1">Analyzing thematic resonances</p>
            </motion.div>
          )}

          {!loading && pitch && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-border rounded-xl p-8 bg-background shadow-sm"
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{pitch.original_title}</h3>
                  <div className="flex items-center space-x-3">
                    <span className="bg-muted text-foreground text-xs font-mono px-2 py-1 rounded border border-border">{pitch.year}</span>
                    <span className="text-muted-foreground text-sm">{pitch.genre}</span>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-full border border-border bg-muted text-foreground font-bold flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {pitch.match_score}% Match
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-l-2 border-border pl-4 py-1">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-medium">Original Logline</h4>
                  <p className="text-foreground italic text-lg">"{pitch.logline}"</p>
                </div>
                
                <div className="p-6 bg-muted/30 rounded-xl border border-border">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium flex items-center">
                    <Sparkles className="w-3 h-3 mr-2" /> Modern Twist
                  </h4>
                  <p className="text-foreground text-lg leading-relaxed">{pitch.modern_twist}</p>
                </div>

                <div className="p-6 bg-muted/30 rounded-xl border border-border">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium flex items-center">
                    <Film className="w-3 h-3 mr-2" /> Why Now?
                  </h4>
                  <p className="text-foreground/80 leading-relaxed">{pitch.why_now}</p>
                </div>
              </div>
            </motion.div>
          )}

          {!loading && !pitch && (
            <div className="h-full min-h-[400px] border border-border border-dashed rounded-xl flex flex-col items-center justify-center bg-background">
              <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-40" />
              <p className="text-muted-foreground font-medium">Ready to uncover the next blockbuster.</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Configure parameters and launch the agent.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
