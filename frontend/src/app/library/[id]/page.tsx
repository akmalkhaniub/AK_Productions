"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, PlaySquare, Video, FileText, MessageSquare, Trash2, Sparkles, Send, Plus, X } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import Link from 'next/link';

interface Annotation {
  id: number;
  line_index: number;
  category: "dialogue" | "topography";
  author: string;
  text: string;
  created_at: string;
}

export default function ScriptViewer() {
  const params = useParams();
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Annotations States
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedLine, setSelectedLine] = useState<{
    index: number;
    category: "dialogue" | "topography";
    speaker?: string;
    text: string;
  } | null>(null);

  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("AI Acting Coach");

  // Load script details
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

  // Load annotations
  const fetchAnnotations = async () => {
    if (!params.id) return;
    try {
      const res = await fetch(apiUrl(`/api/library/${params.id}/annotations`));
      const data = await res.json();
      if (data.status === 'success') {
        setAnnotations(data.data);
      }
    } catch (err) {
      console.error("Failed to load annotations:", err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchScript();
      fetchAnnotations();
    }
  }, [params.id]);

  // Handle adding custom comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLine || !newComment.trim() || !params.id) return;
    setIsSubmittingComment(true);

    try {
      const res = await fetch(apiUrl(`/api/library/${params.id}/annotations`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_index: selectedLine.index,
          category: selectedLine.category,
          author: "User",
          text: newComment
        })
      });
      const resJson = await res.json();
      if (resJson.status === 'success') {
        setNewComment("");
        await fetchAnnotations();
      }
    } catch (err) {
      console.error("Error creating comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle requesting AI Agent Critique
  const handleRequestAgentFeedback = async () => {
    if (!selectedLine || !params.id) return;
    setIsRequestingFeedback(true);

    try {
      const res = await fetch(apiUrl(`/api/library/${params.id}/annotations/agent-feedback`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_index: selectedLine.index,
          category: selectedLine.category,
          agent_type: selectedAgent,
          speaker: selectedLine.speaker || "",
          dialogue_text: selectedLine.text
        })
      });
      const resJson = await res.json();
      if (resJson.status === 'success') {
        await fetchAnnotations();
      }
    } catch (err) {
      console.error("Error fetching agent feedback:", err);
    } finally {
      setIsRequestingFeedback(false);
    }
  };

  // Handle deleting annotation
  const handleDeleteAnnotation = async (annId: number) => {
    if (!params.id) return;
    try {
      const res = await fetch(apiUrl(`/api/library/${params.id}/annotations/${annId}`), {
        method: "DELETE"
      });
      const resJson = await res.json();
      if (resJson.status === 'success') {
        await fetchAnnotations();
      }
    } catch (err) {
      console.error("Error deleting annotation:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
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

  // Filter comments for active selection
  const activeLineComments = selectedLine
    ? annotations.filter(a => a.line_index === selectedLine.index && a.category === selectedLine.category)
    : [];

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
             <span key={i} className="px-2 py-1 text-xs font-medium rounded-md bg-accent/10 border border-accent/20 text-accent">
               {char}
             </span>
          ))}
        </div>
      </header>

      {/* Responsive 3-Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Pane 1: Video Player (30%) */}
        <div className="w-full lg:w-[30%] border-r border-border bg-black flex flex-col relative shrink-0 h-[30vh] lg:h-auto">
          <div className="absolute top-0 inset-x-0 h-0.5 gradient-bg z-10" />
          <iframe
            src={`https://www.youtube.com/embed/${script.video_id}?autoplay=0&rel=0`}
            title="YouTube video player" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="w-full h-full absolute inset-0"
          ></iframe>
        </div>

        {/* Pane 2: Script Viewer (45%) */}
        <div className="w-full lg:w-[45%] border-r border-border flex flex-col bg-background overflow-y-auto">
          <div className="p-6 md:p-8 max-w-xl mx-auto w-full">
            
            {/* Scene Header */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold uppercase tracking-widest gradient-text mb-3">{script.title}</h2>
              <div className="inline-block px-3 py-0.5 border border-accent/30 bg-accent/10 rounded-full mb-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-accent">Scene Description</p>
              </div>
              <p className="text-sm text-foreground/90 italic leading-relaxed">
                {script.scene_description}
              </p>
            </div>

            {/* Visual Sequences (If Gemini is used) */}
            {data.actor_sequences && (
              <div className="mb-8 bg-muted/20 border border-border rounded-xl p-4">
                <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-4 flex items-center">
                  <PlaySquare className="w-3.5 h-3.5 mr-1.5" />
                  Visual Topography
                </h3>
                <div className="space-y-4">
                  {data.actor_sequences.map((seq: any, idx: number) => {
                    const textContent = seq.visual_actions;
                    const isSelected = selectedLine?.index === idx && selectedLine?.category === "topography";
                    const hasAnn = annotations.some(a => a.line_index === idx && a.category === "topography");

                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedLine({ index: idx, category: "topography", text: textContent })}
                        className={`relative pl-3 border-l-2 cursor-pointer p-2 rounded transition-all hover:bg-muted/40 ${
                          isSelected ? "border-accent bg-accent/5" : "border-border"
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground flex justify-between">
                          <span>{seq.character}</span>
                          <div className="flex items-center gap-1.5">
                            {hasAnn && <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
                            <span className="text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
                              {seq.appearance_timestamps}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-foreground/80 mt-1">{textContent}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* The Dialogue */}
            <div className="space-y-8">
              <div className="flex items-center justify-center w-full mb-6">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="font-medium text-xs text-muted-foreground uppercase tracking-wider px-3 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Script
                </h3>
                <div className="h-px bg-border flex-1"></div>
              </div>

              {data.script.map((line: any, idx: number) => {
                const textContent = line.dialogue.english;
                const isSelected = selectedLine?.index === idx && selectedLine?.category === "dialogue";
                const hasAnn = annotations.some(a => a.line_index === idx && a.category === "dialogue");

                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedLine({ index: idx, category: "dialogue", speaker: line.speaker, text: textContent })}
                    className={`relative p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/40 border ${
                      isSelected ? "border-accent/60 bg-accent/5" : "border-transparent"
                    }`}
                  >
                    <div className="font-bold text-accent text-center mb-2 uppercase tracking-widest text-xs flex items-center justify-center gap-1.5">
                      {line.speaker}
                      {hasAnn && <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
                    </div>
                    <div className="max-w-md mx-auto text-center space-y-2">
                      <p className="font-urdu text-2xl text-foreground leading-relaxed" dir="rtl" lang="ur">{line.dialogue.urdu_script}</p>
                      <p className="text-foreground/90 font-medium text-sm">{line.dialogue.roman_urdu}</p>
                      <p className="text-muted-foreground text-xs italic">({textContent})</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 pt-6 border-t border-border text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">End of Scene</p>
              <div className="w-10 h-0.5 bg-accent mx-auto rounded-full"></div>
            </div>

          </div>
        </div>

        {/* Pane 3: Annotations Sidebar (25%) */}
        <div className="w-full lg:w-[25%] flex flex-col bg-card overflow-hidden">
          
          {selectedLine ? (
            <div className="flex-1 flex flex-col h-full">
              
              {/* Context Header */}
              <div className="p-4 border-b border-border bg-slate-950/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-accent" />
                    Selected {selectedLine.category}
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mt-1 line-clamp-1">
                    {selectedLine.speaker ? `${selectedLine.speaker}: ` : ""}
                    {selectedLine.text}
                  </h4>
                </div>
                <button 
                  onClick={() => setSelectedLine(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Comments Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {activeLineComments.map((ann) => {
                  const isAgent = ann.author !== "User";

                  return (
                    <div 
                      key={ann.id}
                      className={`p-3 rounded-lg border text-xs space-y-2 relative transition-all ${
                        isAgent 
                          ? "bg-accent/5 border-accent/30 shadow-sm" 
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isAgent 
                            ? "bg-accent/15 text-accent border border-accent/25" 
                            : "bg-slate-900 text-muted-foreground border border-border"
                        }`}>
                          {ann.author}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteAnnotation(ann.id)}
                          className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete annotation"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <p className="text-foreground/90 leading-relaxed">{ann.text}</p>
                      
                      <div className="text-[8px] text-muted-foreground text-right" suppressHydrationWarning>
                        {new Date(ann.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}

                {activeLineComments.length === 0 && (
                  <div className="text-center p-8 text-xs text-muted-foreground/60 flex flex-col items-center justify-center space-y-2">
                    <MessageSquare className="h-8 w-8 opacity-30" />
                    <span>No annotations on this line yet.</span>
                  </div>
                )}
              </div>

              {/* Actions & Comment Input Form */}
              <div className="p-4 border-t border-border bg-slate-950/20 space-y-3">
                
                {/* Request AI Feedback panel */}
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-border/40">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-accent animate-pulse" />
                    AI Critique Swarm
                  </span>
                  
                  <div className="flex gap-1.5">
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="flex-1 rounded border border-border bg-slate-900 p-1 text-xs text-foreground outline-none focus:border-accent"
                    >
                      <option value="AI Acting Coach">Acting Coach</option>
                      <option value="AI Continuity Agent">Continuity Supervisor</option>
                      <option value="AI Creative Director">Creative Director</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleRequestAgentFeedback}
                      disabled={isRequestingFeedback}
                      className="inline-flex h-7 px-2.5 items-center justify-center rounded bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-all"
                    >
                      {isRequestingFeedback ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Request"}
                    </button>
                  </div>
                </div>

                {/* Comment Text Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type an annotation..."
                    className="flex-1 rounded-lg border border-border bg-slate-950 p-2 text-xs text-foreground outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90 disabled:opacity-50 transition-all"
                  >
                    {isSubmittingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </form>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 text-muted-foreground/60">
              <MessageSquare className="h-10 w-10 opacity-30 animate-bounce" />
              <div className="text-sm font-semibold text-foreground">Annotations Feed</div>
              <p className="text-xs max-w-[200px] leading-relaxed">
                Click or tap any screenplay dialogue block or visual sequence in the center pane to view critiques and post comments.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
