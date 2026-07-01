"use client";

import React, { useEffect, useRef, useState } from "react";
import { Focus, Upload, Play, Pause, RefreshCw, AlertTriangle, CheckCircle, Video, Sliders, Volume2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface ContinuityMarker {
  time: string;
  severity: "High" | "Medium" | "Low";
  issue: string;
  description: string;
  confidence: number;
}

const PRESET_GROUPS = [
  { 
    id: "confrontation", 
    name: "Confrontation Scene (Take 1 vs Take 2)", 
    take1: "take_1_confrontation.mp4",
    take2: "take_2_confrontation.mp4",
    desc: "Ayesha confronts Imran on the railway platform." 
  },
  { 
    id: "negotiation", 
    name: "On-Set Negotiation (Take 1 vs Take 2)", 
    take1: "take_1_negotiation.mp4",
    take2: "take_2_negotiation.mp4",
    desc: "Discussion under studio lights about budget lock." 
  }
];

export default function ContinuityDetectorPage() {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);

  // States
  const [selectedPresetId, setSelectedPresetId] = useState<string>("confrontation");
  const [video1Url, setVideo1Url] = useState<string>("");
  const [video2Url, setVideo2Url] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [markers, setMarkers] = useState<ContinuityMarker[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [activeMarkerIndex, setActiveMarkerIndex] = useState<number>(-1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(12); // Default mock duration
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [syncLocked, setSyncLocked] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [mutedIssues, setMutedIssues] = useState<number[]>([]);

  // Setup log helper
  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Sync preset urls
  useEffect(() => {
    const group = PRESET_GROUPS.find(g => g.id === selectedPresetId);
    if (group) {
      setVideo1Url(`http://localhost:8000/api/temp_videos/${group.take1}`);
      setVideo2Url(`http://localhost:8000/api/temp_videos/${group.take2}`);
      setMarkers([]);
      setOverallScore(null);
      setIsPlaying(false);
      addLog(`Switched takes to preset group: ${group.name}`);
    }
  }, [selectedPresetId]);

  // Sync play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      video1Ref.current?.pause();
      video2Ref.current?.pause();
      setIsPlaying(false);
    } else {
      video1Ref.current?.play();
      video2Ref.current?.play();
      setIsPlaying(true);
    }
  };

  // Handles time updates on Take 1 (drives Take 2 if sync locked)
  const handleTimeUpdate1 = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = e.currentTarget.currentTime;
    setCurrentTime(time);
    if (video1Ref.current && video1Ref.current.duration) {
      setDuration(video1Ref.current.duration);
    }

    if (syncLocked && video2Ref.current) {
      if (Math.abs(video2Ref.current.currentTime - time) > 0.15) {
        video2Ref.current.currentTime = time;
      }
    }

    // Check if within any marker's timestamp (+/- 1.0s window)
    const activeIdx = markers.findIndex((m) => {
      const markerTime = parseFloat(m.time);
      return Math.abs(time - markerTime) < 1.0;
    });
    setActiveMarkerIndex(activeIdx);
  };

  // Handles time updates on Take 2 (drives Take 1 if sync locked)
  const handleTimeUpdate2 = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = e.currentTarget.currentTime;
    if (syncLocked && video1Ref.current) {
      if (Math.abs(video1Ref.current.currentTime - time) > 0.15) {
        video1Ref.current.currentTime = time;
      }
    }
  };

  // Runs VSR comparison pipeline
  const runComparison = async (f1?: File, f2?: File) => {
    setIsAnalyzing(true);
    setMarkers([]);
    setOverallScore(null);
    addLog("Ingesting video files and launching Gemini 2.5 Pro Continuity Swarm...");

    try {
      const formData = new FormData();
      if (f1) formData.append("file1", f1);
      if (f2) formData.append("file2", f2);
      
      const group = PRESET_GROUPS.find(g => g.id === selectedPresetId);
      if (group) {
        formData.append("take1_name", group.take1);
        formData.append("take2_name", group.take2);
      }

      const res = await fetch("http://localhost:8000/api/continuity/compare-takes", {
        method: "POST",
        body: formData
      });
      const resJson = await res.json();

      if (resJson.status === "success") {
        setMarkers(resJson.markers);
        setOverallScore(resJson.overall_score);
        
        if (resJson.pipeline_logs) {
          resJson.pipeline_logs.forEach((l: string) => addLog(l));
        }
        addLog(`Continuity check finished! Overall score: ${resJson.overall_score}/100. Flagged ${resJson.markers.length} risks.`);
      } else {
        throw new Error(resJson.message || "Comparison failed");
      }
    } catch (e: any) {
      addLog(`Error performing continuity check: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Seeks both players to a time
  const seekToTime = (timeStr: string) => {
    const time = parseFloat(timeStr);
    if (!isNaN(time)) {
      if (video1Ref.current) video1Ref.current.currentTime = time;
      if (video2Ref.current) video2Ref.current.currentTime = time;
      setCurrentTime(time);
      addLog(`Jumped playback playheads to timestamp: ${timeStr}s`);
    }
  };

  // Handle custom upload 1
  const handleUpload1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideo1Url(URL.createObjectURL(file));
    addLog(`Uploaded Take 1 custom footage: ${file.name}`);
  };

  // Handle custom upload 2
  const handleUpload2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideo2Url(URL.createObjectURL(file));
    addLog(`Uploaded Take 2 custom footage: ${file.name}`);
  };

  // Mute an issue
  const toggleMuteIssue = (idx: number) => {
    setMutedIssues(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent uppercase">
            <Focus className="h-3 w-3 animate-pulse" />
            AI Production Suite · Script Supervisor
          </span>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl mt-1">
            Video Continuity Error Detector
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Compare two video takes side-by-side. Our vision agent analyzes differences in wardrobe, lighting, actor geography, and props.
          </p>
        </div>

        {overallScore !== null && (
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3 shadow shadow-accent/5">
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Continuity Score</div>
              <div className="text-2xl font-bold text-accent font-mono">{overallScore}/100</div>
            </div>
            <div className="h-8 border-r border-border" />
            <div className="text-left">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Status</div>
              <div className="text-xs font-semibold text-green-400 flex items-center gap-1 mt-0.5">
                <CheckCircle className="h-3.5 w-3.5" /> Scanned
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Side-by-Side Synced Video Player */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Take 1 Player */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                <Video className="h-3.5 w-3.5" /> Take 1 (Reference)
              </span>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-slate-950 shadow-xl group">
                <video
                  ref={video1Ref}
                  src={video1Url}
                  onTimeUpdate={handleTimeUpdate1}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-accent border border-accent/20 backdrop-blur">
                    TAKE 1
                  </span>
                </div>
              </div>
            </div>

            {/* Take 2 Player */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                <Video className="h-3.5 w-3.5 text-sky-400" /> Take 2 (Evaluation)
              </span>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-slate-950 shadow-xl">
                <video
                  ref={video2Ref}
                  src={video2Url}
                  onTimeUpdate={handleTimeUpdate2}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-400/20 backdrop-blur">
                    TAKE 2
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Synced Timeline Progress Bar */}
          {duration > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-4 shadow flex flex-col gap-2 relative">
              <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                <span>0.00s</span>
                <span className="text-accent uppercase tracking-widest font-bold">Continuity Timeline Visualizer</span>
                <span>{duration.toFixed(2)}s</span>
              </div>
              
              {/* Progress track containing colored error spikes */}
              <div className="w-full h-4 bg-slate-900 rounded-lg relative overflow-visible border border-border/60">
                
                {/* Active Playhead progress */}
                <div 
                  className="h-full bg-slate-800 rounded-l-lg absolute top-0 left-0 transition-all duration-75"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />

                {/* Marker indicators on timeline */}
                {markers.map((m, idx) => {
                  const markerTime = parseFloat(m.time);
                  const pct = (markerTime / duration) * 100;
                  const isMuted = mutedIssues.includes(idx);
                  if (pct < 0 || pct > 100) return null;

                  return (
                    <button
                      key={idx}
                      onClick={() => seekToTime(m.time)}
                      className={`absolute top-0 w-3 h-full -ml-1.5 transform hover:scale-125 transition-transform flex items-center justify-center ${
                        isMuted 
                          ? "opacity-35" 
                          : m.severity === "High" 
                          ? "text-red-500" 
                          : m.severity === "Medium"
                          ? "text-orange-400"
                          : "text-yellow-400"
                      }`}
                      style={{ left: `${pct}%` }}
                      title={`${m.issue} at ${m.time}s`}
                    >
                      <span className="h-3 w-1.5 rounded bg-current shadow-md shadow-black" />
                    </button>
                  );
                })}

                {/* Active seek thumb line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-accent z-20"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />

              </div>
            </div>
          )}

          {/* Sync & Playback Controls */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              
              {/* Play / Pause button */}
              <button
                onClick={handlePlayPause}
                className="inline-flex h-11 px-5 items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90 transition-all font-semibold glow-hover"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? "Pause Sync" : "Play Synced"}</span>
              </button>

              {/* Run Comparison agent */}
              <button
                onClick={() => runComparison()}
                disabled={isAnalyzing}
                className="inline-flex h-11 px-5 items-center justify-center gap-2 rounded-lg border border-border bg-card/60 text-foreground hover:bg-muted font-semibold transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                <span>Run Vision Continuity Scan</span>
              </button>

            </div>

            {/* Sync Playhead locking checkbox */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncLocked}
                  onChange={(e) => setSyncLocked(e.target.checked)}
                  className="rounded border-border accent-accent h-4 w-4"
                />
                <span>Sync Playheads Lock</span>
              </label>
              
              <div className="h-4 w-[1px] bg-border" />
              
              <span className="text-xs font-mono text-muted-foreground">Time: {currentTime.toFixed(2)}s</span>
            </div>
          </div>

        </div>

        {/* Right Col: Setup Inputs, Issues Timeline */}
        <div className="space-y-6">
          
          {/* Setup / Ingestion */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sliders className="h-4 w-4 text-accent" />
              Continuity Config
            </h3>
            
            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">Preset Scene Takes</label>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedPresetId(g.id)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all hover:border-accent/40 ${
                      selectedPresetId === g.id
                        ? "bg-accent/5 border-accent text-accent"
                        : "border-border bg-card/40 text-foreground"
                    }`}
                  >
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/60 my-4" />

            {/* Double video upload */}
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground font-semibold">Or Upload Custom Takes</label>
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={file1InputRef}
                  accept="video/*"
                  onChange={handleUpload1}
                  className="hidden"
                />
                <button
                  onClick={() => file1InputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card/30 py-2.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Take 1</span>
                </button>

                <input
                  type="file"
                  ref={file2InputRef}
                  accept="video/*"
                  onChange={handleUpload2}
                  className="hidden"
                />
                <button
                  onClick={() => file2InputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-card/30 py-2.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Take 2</span>
                </button>
              </div>

            </div>

          </div>

          {/* Issues feed */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex flex-col h-[400px]">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Detected Errors
            </h3>
            
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <span className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <span className="text-xs text-muted-foreground">Swarm comparison processing frames...</span>
              </div>
            ) : markers.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                {markers.map((m, idx) => {
                  const isActive = activeMarkerIndex === idx;
                  const isMuted = mutedIssues.includes(idx);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-sm transition-all relative ${
                        isMuted
                          ? "border-border bg-slate-950/40 opacity-55"
                          : isActive
                          ? "bg-accent/15 border-accent/60 shadow"
                          : "border-border bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.severity === "High" 
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : m.severity === "Medium"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {m.severity} Severity
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => seekToTime(m.time)}
                            className="text-xs text-accent font-semibold hover:underline font-mono"
                          >
                            {parseFloat(m.time).toFixed(1)}s
                          </button>
                          
                          <button
                            onClick={() => toggleMuteIssue(idx)}
                            className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                          >
                            {isMuted ? "Unmute" : "Mute"}
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-foreground mt-2">{m.issue}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                      
                      <div className="text-[10px] text-muted-foreground mt-2 text-right">
                        VSR Confidence: {m.confidence}%
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 opacity-40" />
                <div className="text-xs">No scan performed yet.</div>
                <button
                  onClick={() => runComparison()}
                  className="text-xs text-accent font-semibold hover:underline mt-1"
                >
                  Run Gemini Continuity Analysis
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Agent Activity Logs */}
      <div className="rounded-xl border border-border bg-slate-900/60 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Focus className="h-4 w-4 text-muted-foreground" />
          Supervisor Swarm Execution Logs
        </h4>
        <div className="h-32 overflow-y-auto font-mono text-xs text-muted-foreground space-y-1 bg-slate-950 p-4 rounded-lg border border-border/40">
          {logs.map((log, index) => (
            <div key={index} className="leading-relaxed">{log}</div>
          ))}
          {logs.length === 0 && <div className="text-muted-foreground/40">Console waiting for actions...</div>}
        </div>
      </div>

    </div>
  );
}
