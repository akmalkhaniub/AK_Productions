"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eye, Upload, Play, Pause, RefreshCw, Edit2, Check, Video, MessageSquare, Volume2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface Segment {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

const PRESET_FILES = [
  { id: "silent_confrontation.mp4", name: "Silent Confrontation (Take 4)", desc: "Rainy platform dialogue confrontation between Ayesha and Imran." },
  { id: "silent_negotiation.mp4", name: "On-Set Negotiation (Take 1)", desc: "Silent exchange between director and producer under studio lights." }
];

export default function LipReadingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const restoredVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [selectedFile, setSelectedFile] = useState<string>("silent_confrontation.mp4");
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [restoredUrl, setRestoredUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Setup log helper
  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Video source init
  useEffect(() => {
    // Check if demo file exists locally, otherwise use simple synthetic blank
    setOriginalUrl(`http://localhost:8000/api/temp_videos/${selectedFile}`);
    setRestoredUrl("");
    setSegments([]);
    setIsPlaying(false);
    addLog(`Switched source video to preset: ${selectedFile}`);
  }, [selectedFile]);

  // Synchronize playbacks if both are showing
  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pause();
      restoredVideoRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current?.play();
      restoredVideoRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = e.currentTarget.currentTime;
    setCurrentTime(time);

    // Sync other video if it exists
    if (restoredVideoRef.current && e.currentTarget === videoRef.current) {
      if (Math.abs(restoredVideoRef.current.currentTime - time) > 0.3) {
        restoredVideoRef.current.currentTime = time;
      }
    }

    // Find active segment
    const activeIdx = segments.findIndex((s) => time >= s.start && time <= s.end);
    setActiveSegmentIndex(activeIdx);
  };

  // VSR restoration pipeline trigger
  const runRestoration = async (fileObj?: File, customSegs?: Segment[]) => {
    setIsAnalyzing(true);
    setRestoredUrl("");
    addLog(customSegs ? "Applying dialogue corrections and rebuilding audio..." : "Uploading silent footage to Gemini 2.5 Pro VSR...");

    try {
      const formData = new FormData();
      if (fileObj) {
        formData.append("file", fileObj);
      } else {
        formData.append("filename", selectedFile);
      }

      if (customSegs) {
        formData.append("custom_segments_json", JSON.stringify(customSegs));
      }

      const res = await fetch("http://localhost:8000/api/lip-reading/restore", {
        method: "POST",
        body: formData
      });
      const resJson = await res.json();

      if (resJson.status === "success") {
        setSegments(resJson.dialogue_segments);
        // Point to output restored file
        setRestoredUrl(`http://localhost:8000/api/temp_videos/${resJson.restored_video}`);
        
        // Append logs returned from the backend
        if (resJson.pipeline_logs) {
          resJson.pipeline_logs.forEach((l: string) => addLog(l));
        }
        addLog("Auditory restoration completed! Restored video is ready for playback.");
      } else {
        throw new Error(resJson.message || "Pipeline failed");
      }
    } catch (e: any) {
      addLog(`Error during restoration: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle custom upload
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalUrl(URL.createObjectURL(file));
    setRestoredUrl("");
    setSegments([]);
    setIsPlaying(false);
    addLog(`Uploaded silent footage: ${file.name}. Ready for VSR.`);
    runRestoration(file);
  };

  // Save changes to dialogue segment
  const handleSegmentChange = (idx: number, field: keyof Segment, val: string | number) => {
    setSegments((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  // Re-run dubbing using edited segments
  const applyCorrections = () => {
    setIsEditing(false);
    runRestoration(undefined, segments);
  };

  // Face Mesh canvas simulation loop
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    
    // Procedural landmark coordinates
    const baseMouthPoints = [
      { x: 120, y: 150 }, { x: 130, y: 145 }, { x: 140, y: 143 }, { x: 150, y: 145 },
      { x: 160, y: 150 }, { x: 150, y: 155 }, { x: 140, y: 157 }, { x: 130, y: 155 },
      { x: 125, y: 150 }, { x: 140, y: 148 }, { x: 155, y: 150 }, { x: 140, y: 152 }
    ];

    const jawPoints = [
      { x: 100, y: 100 }, { x: 102, y: 120 }, { x: 108, y: 140 }, { x: 118, y: 160 },
      { x: 130, y: 175 }, { x: 140, y: 178 }, { x: 150, y: 175 }, { x: 162, y: 160 },
      { x: 172, y: 140 }, { x: 178, y: 120 }, { x: 180, y: 100 }
    ];

    const drawMesh = () => {
      const isVideoPlaying = !videoRef.current?.paused;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only draw overlay if we are analyzing OR if video is playing/paused
      if (isAnalyzing || originalUrl) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"; // Sky-400 with opacity
        ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
        ctx.lineWidth = 1.2;

        // Calculate lip open height dynamic factor matching talking motion
        const timeFactor = Date.now() * 0.012;
        // Make lips open/close procedurally if the video is playing (simulating talk tracking)
        const mouthOpenRatio = isVideoPlaying ? Math.abs(Math.sin(timeFactor)) * 8 : 1;
        const analysisPulse = isAnalyzing ? Math.abs(Math.sin(Date.now() * 0.005)) * 3 : 0;

        // 1. Draw Lip Mesh
        ctx.beginPath();
        baseMouthPoints.forEach((p, idx) => {
          // Add Y displacement for upper/lower lip points to simulate movement
          let dy = 0;
          if (idx > 0 && idx < 4) dy = -mouthOpenRatio;
          if (idx > 4 && idx < 8) dy = mouthOpenRatio;
          if (idx === 9) dy = -mouthOpenRatio * 0.5;
          if (idx === 11) dy = mouthOpenRatio * 0.5;

          const px = p.x + (Math.random() - 0.5) * analysisPulse;
          const py = p.y + dy + (Math.random() - 0.5) * analysisPulse;

          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);

          // Draw small coordinate node
          ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
        });
        ctx.closePath();
        ctx.stroke();

        // 2. Draw Jaw Contours
        ctx.beginPath();
        ctx.strokeStyle = "rgba(224, 33, 138, 0.35)"; // Neon pink
        ctx.fillStyle = "rgba(224, 33, 138, 0.7)";
        jawPoints.forEach((p, idx) => {
          // Jaw moves down slightly when mouth opens
          const dy = (idx > 3 && idx < 8) ? mouthOpenRatio * 0.4 : 0;
          const px = p.x;
          const py = p.y + dy;

          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);

          ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4);
        });
        ctx.stroke();

        // 3. Draw Scanline overlay if analyzing
        if (isAnalyzing) {
          const scanY = (Date.now() * 0.15) % canvas.height;
          ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(10, scanY);
          ctx.lineTo(canvas.width - 10, scanY);
          ctx.stroke();
          
          // Draw text indicator
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 9px monospace";
          ctx.fillText("GEMINI VSR INFERENCE ACTIVE...", 15, scanY - 5);
        }
      }

      animId = requestAnimationFrame(drawMesh);
    };

    drawMesh();
    return () => cancelAnimationFrame(animId);
  }, [isAnalyzing, originalUrl]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent uppercase">
          <Eye className="h-3 w-3 animate-pulse" />
          Advanced R&D · Visual Speech Recognition
        </span>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl mt-1">
          AI Lip-Reading & Speech Reconstruction
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Restore audio tracks and extract dialogue from silent on-set footage by analyzing actor lip keypoints using Google Gemini 2.5 Pro.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Split-Screen Comparison Player */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Original Silent Video (with Lip Landmark Overlay) */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                <Video className="h-3 w-3" /> Original Silent Footage
              </span>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-slate-950 shadow-xl group">
                <video
                  ref={videoRef}
                  src={originalUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                
                {/* Lip Landmark Canvas */}
                <canvas 
                  ref={canvasRef} 
                  width={280} 
                  height={200}
                  className="absolute inset-0 pointer-events-none w-full h-full"
                />

                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-400/20 backdrop-blur">
                    LIP TRACKING ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Restored Video (With Audio) */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                <Volume2 className="h-3 w-3 text-accent" /> Restored Dialogue Audio
              </span>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-slate-950 shadow-xl flex items-center justify-center">
                {restoredUrl ? (
                  <video
                    ref={restoredVideoRef}
                    src={restoredUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-cover"
                    playsInline
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground/60" />
                    <div className="text-xs text-muted-foreground">Restored video will appear here after running Gemini VSR.</div>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-10">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold border backdrop-blur ${
                    restoredUrl 
                      ? "bg-accent/10 text-accent border-accent/20" 
                      : "bg-slate-900/80 text-muted-foreground border-border"
                  }`}>
                    {restoredUrl ? "AUDIO RESTORED" : "AWAITING SYNTHESIS"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Player controls */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                disabled={isAnalyzing || !originalUrl}
                className="inline-flex h-11 px-5 items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90 transition-all font-semibold glow-hover"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? "Pause" : "Play & Synced Preview"}</span>
              </button>

              <button
                onClick={() => runRestoration()}
                disabled={isAnalyzing || !originalUrl}
                className="inline-flex h-11 px-5 items-center justify-center gap-2 rounded-lg border border-border bg-card/60 text-foreground hover:bg-muted font-semibold transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                <span>Run VSR Reconstruction</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">Time: {currentTime.toFixed(2)}s</span>
            </div>
          </div>

        </div>

        {/* Right Col: Preset Ingestion, Reconstructed Script */}
        <div className="space-y-6">
          
          {/* Preset Selector */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent" />
              Source Footage
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">Preset Silent Takes</label>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_FILES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFile(f.id)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all hover:border-accent/40 ${
                      selectedFile === f.id
                        ? "bg-accent/5 border-accent text-accent"
                        : "border-border bg-card/40 text-foreground"
                    }`}
                  >
                    <div className="font-semibold">{f.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border/60 my-4" />

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">Or Upload Silent Video (.mp4)</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/30 p-4 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Custom Silent File</span>
              </button>
            </div>
          </div>

          {/* Reconstructed Dialogue timeline */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                Reconstructed Script
              </h3>
              
              {segments.length > 0 && (
                <button
                  onClick={() => isEditing ? applyCorrections() : setIsEditing(true)}
                  className="inline-flex h-8 px-3 items-center gap-1 text-xs font-semibold rounded bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  {isEditing ? <Check className="h-3 w-3 text-green-500" /> : <Edit2 className="h-3 w-3" />}
                  <span>{isEditing ? "Save & Rebuild" : "Edit Dialog"}</span>
                </button>
              )}
            </div>

            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <span className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <span className="text-xs text-muted-foreground">Gemini is translating lip movements...</span>
              </div>
            ) : segments.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                {segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      activeSegmentIndex === idx
                        ? "bg-accent/10 border-accent/60 shadow"
                        : "border-border bg-card/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-sky-400">{seg.speaker}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                      </span>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={seg.text}
                        onChange={(e) => handleSegmentChange(idx, "text", e.target.value)}
                        className="w-full text-xs bg-slate-900 border border-border rounded mt-1.5 p-1 text-foreground focus:outline-none focus:border-accent"
                        rows={2}
                      />
                    ) : (
                      <p className="text-xs text-foreground mt-1.5 leading-relaxed">"{seg.text}"</p>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-1 text-right">
                      Confidence: {(seg.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 text-muted-foreground">
                <MessageSquare className="h-8 w-8/40 opacity-40" />
                <div className="text-xs">No reconstructed script available yet.</div>
                <button
                  onClick={() => runRestoration()}
                  className="text-xs text-accent font-semibold hover:underline mt-1"
                >
                  Run Gemini Lip-Reading VSR
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Agent Activity Logs */}
      <div className="rounded-xl border border-border bg-slate-900/60 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          Restoration Agent Swarm Console Logs
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
