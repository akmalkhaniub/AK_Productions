"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Search, Loader2, PlaySquare, Video, ArrowLeft } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';

export default function Library() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await fetch(apiUrl('/api/library'));
        const data = await res.json();
        if (data.status === 'success') {
          setScripts(data.data);
        } else {
          setError(data.message || "Failed to load library.");
        }
      } catch (err) {
        setError("Network error. Backend might be offline.");
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  const filteredScripts = scripts.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    (s.characters_identified && s.characters_identified.some((c: string) => c.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2 flex items-center">
            <Database className="w-8 h-8 mr-3 text-muted-foreground" />
            Script Library
          </h1>
          <p className="text-muted-foreground">All your ingested YouTube dramas and extracted screenplays, securely saved in PostgreSQL.</p>
        </div>
        <Link 
          href="/data-ingestion"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ingestion
        </Link>
      </header>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by title or character name..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading Master Database...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      ) : filteredScripts.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-xl bg-background">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-1">Library is Empty</h3>
          <p className="text-muted-foreground mb-6">You haven't ingested any YouTube scripts yet, or your search didn't match anything.</p>
          <Link 
            href="/data-ingestion"
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground text-background px-6 text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Start Ingesting
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredScripts.map((script, idx) => (
            <Link href={`/library/${script.id}`} key={script.id}>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border border-border rounded-xl overflow-hidden bg-background shadow-sm hover:shadow-md transition-all hover:border-foreground/30 flex flex-col h-full cursor-pointer group"
              >
                <div className="p-6 border-b border-border bg-muted/30 group-hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-foreground line-clamp-1 group-hover:text-foreground/80 transition-colors">{script.title}</h2>
                    <span suppressHydrationWarning className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                      {new Date(script.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 min-h-[40px]">{script.scene_description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {script.characters_identified.map((char: string, i: number) => (
                      <span key={i} className="px-2 py-1 text-xs font-medium rounded-md bg-background border border-border text-foreground">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="p-6 flex-1 max-h-[300px] overflow-y-hidden relative">
                  {script.data?.actor_sequences && (
                    <div className="mb-6 pb-6 border-b border-border">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                        <PlaySquare className="w-3 h-3 mr-1" />
                        Visual Sequences
                      </h4>
                      <div className="space-y-4">
                        {script.data.actor_sequences.slice(0, 2).map((seq: any, i: number) => (
                           <div key={i} className="text-sm border-l-2 border-foreground/30 pl-3">
                             <span className="font-semibold">{seq.character}</span> <span className="text-xs font-mono text-muted-foreground">({seq.appearance_timestamps})</span>
                             <p className="text-muted-foreground truncate">{seq.visual_actions}</p>
                           </div>
                        ))}
                        {script.data.actor_sequences.length > 2 && (
                          <p className="text-xs text-muted-foreground italic pl-3">+ {script.data.actor_sequences.length - 2} more sequences</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                      <Video className="w-3 h-3 mr-1" />
                      Dialogue Snippet
                    </h4>
                    {script.data?.script?.slice(0, 3).map((line: any, i: number) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <span className="text-xs font-bold text-foreground uppercase">{line.speaker}:</span>
                        <p className="text-sm font-medium text-foreground/90 mt-1">{line.dialogue.roman_urdu}</p>
                        <p className="text-xs text-muted-foreground italic">{line.dialogue.english}</p>
                      </div>
                    ))}
                    {script.data?.script?.length > 3 && (
                      <p className="text-xs text-muted-foreground italic mt-2">+ {script.data.script.length - 3} more lines</p>
                    )}
                  </div>
                  
                  {/* Fade out bottom text to indicate clickability */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-xs font-medium text-foreground bg-background/80 px-3 py-1 rounded-full border border-border backdrop-blur-sm shadow-sm">View Full Script</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
