"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, PlaySquare, Video, FileText } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';

export default function ScriptViewer() {
  const params = useParams();
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScript = async () => {
      try {
        const res = await fetch(apiUrl(`/api/library/${params.id}`));
        const data = await res.json();
        if (data.status === 'success') {
          setScript(data.data);
        } else {
          setError(data.message || "Failed to load script.");
        }
      } catch (err) {
        setError("Network error. Backend might be offline.");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchScript();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading Studio Viewer...</p>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 mb-6">
          {error || "Script not found"}
        </div>
        <Link 
          href="/library"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Link>
      </div>
    );
  }

  const { data } = script;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header bar */}
      <header className="h-16 border-b border-border bg-background flex items-center px-6 shrink-0 justify-between">
        <div className="flex items-center">
          <Link href="/library" className="mr-6 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-foreground tracking-tight line-clamp-1">{script.title}</h1>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-3">ID: {script.video_id}</span>
              <span suppressHydrationWarning>Imported: {new Date(script.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex gap-2">
          {script.characters_identified.map((char: string, i: number) => (
             <span key={i} className="px-2 py-1 text-xs font-medium rounded-md bg-muted border border-border text-muted-foreground">
               {char}
             </span>
          ))}
        </div>
      </header>

      {/* Split Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Pane: Video Player */}
        <div className="w-full lg:w-1/2 border-r border-border bg-black flex flex-col relative shrink-0 h-[40vh] lg:h-auto">
          <iframe 
            src={`https://www.youtube.com/embed/${script.video_id}?autoplay=0&rel=0`}
            title="YouTube video player" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="w-full h-full absolute inset-0"
          ></iframe>
        </div>

        {/* Right Pane: Script Viewer */}
        <div className="w-full lg:w-1/2 flex flex-col bg-background overflow-y-auto">
          <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
            
            {/* Scene Header */}
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold uppercase tracking-widest text-foreground mb-4">{script.title}</h2>
              <div className="inline-block px-4 py-1 border border-foreground/20 rounded-full mb-6">
                <p className="text-sm font-medium text-muted-foreground">SCENE DESCRIPTION</p>
              </div>
              <p className="text-lg text-foreground/90 italic leading-relaxed">
                {script.scene_description}
              </p>
            </div>

            {/* Visual Sequences (If Gemini is used) */}
            {data.actor_sequences && (
              <div className="mb-12 bg-muted/30 border border-border rounded-xl p-6">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-6 flex items-center">
                  <PlaySquare className="w-4 h-4 mr-2" />
                  Visual Topography
                </h3>
                <div className="space-y-6">
                  {data.actor_sequences.map((seq: any, idx: number) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-foreground/30">
                      <div className="font-semibold text-foreground flex justify-between">
                        <span>{seq.character}</span>
                        <span className="text-xs font-mono text-muted-foreground bg-background border border-border px-2 py-0.5 rounded cursor-pointer hover:bg-muted transition-colors">
                          {seq.appearance_timestamps}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-1">{seq.visual_actions}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* The Dialogue */}
            <div className="space-y-10">
              <div className="flex items-center justify-center w-full mb-8">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider px-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Script
                </h3>
                <div className="h-px bg-border flex-1"></div>
              </div>

              {data.script.map((line: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="font-bold text-foreground text-center mb-3 uppercase tracking-widest text-lg">{line.speaker}</div>
                  <div className="max-w-sm mx-auto text-center space-y-2">
                    <p className="text-2xl text-foreground mb-2 font-arabic leading-relaxed" dir="rtl">{line.dialogue.urdu_script}</p>
                    <p className="text-foreground/90 font-medium text-lg">{line.dialogue.roman_urdu}</p>
                    <p className="text-muted-foreground text-sm italic">({line.dialogue.english})</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 pt-8 border-t border-border text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">END OF SCENE</p>
              <div className="w-12 h-1 bg-foreground mx-auto rounded-full opacity-20"></div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
