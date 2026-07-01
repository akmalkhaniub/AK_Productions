"use client";

import React, { useEffect, useState } from "react";
import { Network, Database, RefreshCw, AlertTriangle, CheckCircle, Plus, BookOpen, Layers, User, Trash2, Tag, Calendar, Play } from "lucide-react";

interface SeriesInfo {
  id: number;
  title: string;
  description: string;
  episode_count: number;
}

interface EpisodeInfo {
  id: number;
  episode_number: number;
  title: string;
}

interface LoreItem {
  id: number;
  category: "character" | "prop" | "timeline" | "geography";
  entity_name: string;
  lore_description: string;
  source_episodes: string;
}

interface NarrativeConflict {
  severity: "High" | "Medium" | "Low";
  issue: string;
  description: string;
  episodes: string;
  resolution: string;
}

export default function SeriesIntelligencePage() {
  const [seriesList, setSeriesList] = useState<SeriesInfo[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedSeriesData, setSelectedSeriesData] = useState<{
    id: number;
    title: string;
    description: string;
    episodes: EpisodeInfo[];
  } | null>(null);

  // Detail States
  const [loreItems, setLoreItems] = useState<LoreItem[]>([]);
  const [conflicts, setConflicts] = useState<NarrativeConflict[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"character" | "prop" | "timeline" | "geography">("character");
  const [logs, setLogs] = useState<string[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);

  // Form states for creating custom series
  const [newSeriesTitle, setNewSeriesTitle] = useState<string>("");
  const [newSeriesDesc, setNewSeriesDesc] = useState<string>("");
  const [isCreatingSeries, setIsCreatingSeries] = useState<boolean>(false);

  // Form states for adding custom episode script
  const [newEpNum, setNewEpNum] = useState<number>(1);
  const [newEpTitle, setNewEpTitle] = useState<string>("");
  const [newEpScript, setNewEpScript] = useState<string>("");
  const [isAddingEpisode, setIsAddingEpisode] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Load list of series
  const loadSeriesList = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/series");
      const resJson = await res.json();
      if (resJson.status === "success") {
        setSeriesList(resJson.data);
      }
    } catch (e: any) {
      addLog(`Error loading series list: ${e.message}`);
    }
  };

  useEffect(() => {
    loadSeriesList();
    addLog("Series Intelligence workspace loaded.");
  }, []);

  // Load details when a series is selected
  const selectSeries = async (seriesId: number) => {
    setSelectedSeriesId(seriesId);
    setOverallScore(null);
    setConflicts([]);
    setLoreItems([]);
    
    try {
      const res = await fetch(`http://localhost:8000/api/series/${seriesId}`);
      const resJson = await res.json();
      if (resJson.status === "success") {
        setSelectedSeriesData(resJson.data);
        addLog(`Selected series: "${resJson.data.title}". Loading episodes...`);
        
        // Fetch lore bible
        const loreRes = await fetch(`http://localhost:8000/api/series/${seriesId}/lore-bible`);
        const loreJson = await loreRes.json();
        if (loreJson.status === "success") {
          setLoreItems(loreJson.data);
        }
      }
    } catch (e: any) {
      addLog(`Error loading series details: ${e.message}`);
    }
  };

  // Run the narrative consistency sweep
  const runSweep = async () => {
    if (!selectedSeriesId) return;
    setIsAnalyzing(true);
    setConflicts([]);
    addLog("Initializing narrative consistency scan...");
    addLog("Analyzing continuity across characters, props, and timelines...");

    try {
      const res = await fetch(`http://localhost:8000/api/series/${selectedSeriesId}/run-narrative-sweep`, {
        method: "POST"
      });
      const resJson = await res.json();

      if (resJson.status === "success") {
        setConflicts(resJson.conflicts);
        setOverallScore(resJson.overall_score);
        
        // Refresh lore bible
        const loreRes = await fetch(`http://localhost:8000/api/series/${selectedSeriesId}/lore-bible`);
        const loreJson = await loreRes.json();
        if (loreJson.status === "success") {
          setLoreItems(loreJson.data);
        }

        if (resJson.pipeline_logs) {
          resJson.pipeline_logs.forEach((l: string) => addLog(l));
        }
        addLog(`Narrative check finished! Flagged ${resJson.conflicts.length} consistency violations.`);
      } else {
        throw new Error(resJson.message || "Sweep failed");
      }
    } catch (e: any) {
      addLog(`Error running sweep: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Seed sample TV series demo
  const seedDemo = async () => {
    addLog("Seeding 'The Last Letter Trilogy' demo data...");
    try {
      const res = await fetch("http://localhost:8000/api/dev/seed-sample-series", {
        method: "POST"
      });
      const resJson = await res.json();
      if (resJson.status === "success") {
        addLog("Seeded trilogy episodes successfully.");
        await loadSeriesList();
        await selectSeries(resJson.data.id);
      }
    } catch (e: any) {
      addLog(`Error seeding demo: ${e.message}`);
    }
  };

  // Create new custom series
  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesTitle.trim()) return;

    try {
      const res = await fetch("http://localhost:8000/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSeriesTitle,
          description: newSeriesDesc
        })
      });
      const resJson = await res.json();
      if (resJson.status === "success") {
        addLog(`Created series: ${newSeriesTitle}`);
        setNewSeriesTitle("");
        setNewSeriesDesc("");
        setIsCreatingSeries(false);
        await loadSeriesList();
        await selectSeries(resJson.data.id);
      }
    } catch (e: any) {
      addLog(`Error creating series: ${e.message}`);
    }
  };

  // Add custom episode script
  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId || !newEpScript.trim()) return;

    try {
      const res = await fetch(`http://localhost:8000/api/series/${selectedSeriesId}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episode_number: newEpNum,
          title: newEpTitle || `Episode ${newEpNum}`,
          script_content: newEpScript
        })
      });
      const resJson = await res.json();
      if (resJson.status === "success") {
        addLog(`Added Episode ${newEpNum} script: "${newEpTitle || `Episode ${newEpNum}`}"`);
        setNewEpTitle("");
        setNewEpScript("");
        setIsAddingEpisode(false);
        await selectSeries(selectedSeriesId);
      }
    } catch (e: any) {
      addLog(`Error adding episode: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent uppercase">
            <Network className="h-3 w-3 animate-pulse" />
            AI Showrunner Suite · Narrative Intelligence
          </span>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground sm:text-4xl mt-1">
            Series Ingestion & Lore Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Ingest and scan multi-episode screenplays to map characters, props, and timelines and automatically catch lore or timeline conflicts.
          </p>
        </div>

        {/* Demo Button */}
        <div className="flex gap-2">
          <button
            onClick={seedDemo}
            className="inline-flex h-10 px-4 items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/10 hover:bg-accent/25 text-accent font-semibold transition-colors"
          >
            <Play className="h-4 w-4 fill-accent" />
            <span>Load Trilogy Demo</span>
          </button>

          <button
            onClick={() => setIsCreatingSeries(true)}
            className="inline-flex h-10 px-4 items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90 transition-all font-semibold glow-hover"
          >
            <Plus className="h-4 w-4" />
            <span>New Series</span>
          </button>
        </div>
      </div>

      {/* Series Selection Row */}
      {seriesList.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {seriesList.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSeries(s.id)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedSeriesId === s.id
                  ? "bg-accent/5 border-accent text-accent"
                  : "border-border bg-card hover:bg-muted text-foreground"
              }`}
            >
              <Database className="h-4 w-4" />
              <span>{s.title}</span>
              <span className="bg-slate-900 border border-border text-[10px] text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                {s.episode_count} ep
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modal: Create Series */}
      {isCreatingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create New Drama Series</h3>
            <form onSubmit={handleCreateSeries} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Series Title</label>
                <input
                  type="text"
                  required
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  placeholder="e.g. The Lahore Express"
                  className="w-full rounded-lg border border-border bg-slate-950 p-2.5 text-sm text-foreground focus:border-accent outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold">Synopsis / Description</label>
                <textarea
                  value={newSeriesDesc}
                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                  placeholder="Summarize the core premise..."
                  className="w-full rounded-lg border border-border bg-slate-950 p-2.5 text-sm text-foreground focus:border-accent outline-none mt-1 h-20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSeries(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSeriesData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Playlist / Episode Admin */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  Episode Playlist
                </h3>
                <button
                  onClick={() => {
                    setNewEpNum(selectedSeriesData.episodes.length + 1);
                    setIsAddingEpisode(true);
                  }}
                  className="inline-flex h-8 px-2.5 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/60 text-xs text-foreground hover:bg-muted font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Episode</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {selectedSeriesData.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3 rounded-lg border border-border bg-slate-950/40 text-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-foreground">Episode {ep.episode_number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ep.title}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-card border border-border px-1.5 py-0.5 rounded font-mono uppercase">
                      Ingested
                    </span>
                  </div>
                ))}

                {selectedSeriesData.episodes.length === 0 && (
                  <div className="text-center p-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                    No episodes added yet. Click "Add Episode" or "Load Trilogy Demo" to begin.
                  </div>
                )}
              </div>

              {selectedSeriesData.episodes.length > 0 && (
                <button
                  onClick={runSweep}
                  disabled={isAnalyzing}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90 transition-all font-semibold glow-hover"
                >
                  <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>Run Narrative Consistency sweep</span>
                </button>
              )}
            </div>
          </div>

          {/* Modal: Add Episode Script */}
          {isAddingEpisode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-foreground">Add Episode Script</h3>
                <form onSubmit={handleAddEpisode} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground font-semibold">Episode #</label>
                      <input
                        type="number"
                        required
                        value={newEpNum}
                        onChange={(e) => setNewEpNum(parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-border bg-slate-950 p-2.5 text-sm text-foreground focus:border-accent outline-none mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground font-semibold">Episode Title</label>
                      <input
                        type="text"
                        required
                        value={newEpTitle}
                        onChange={(e) => setNewEpTitle(e.target.value)}
                        placeholder="e.g. Lahore Station"
                        className="w-full rounded-lg border border-border bg-slate-950 p-2.5 text-sm text-foreground focus:border-accent outline-none mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">Screenplay Script content / Notes</label>
                    <textarea
                      required
                      value={newEpScript}
                      onChange={(e) => setNewEpScript(e.target.value)}
                      placeholder="Write dialogue or screenplay scene notes here..."
                      className="w-full rounded-lg border border-border bg-slate-950 p-2.5 text-sm text-foreground focus:border-accent outline-none mt-1 h-36 font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEpisode(false)}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-foreground hover:bg-muted"
                    >
                      Cancel
                </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90"
                    >
                      Save Script
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Middle Panel: Narrative Conflict Monitor */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex flex-col h-[480px]">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-accent" />
                Continuity & Lore Conflicts
              </h3>

              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  <span className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <span className="text-xs text-muted-foreground">Ingesting playlist scripts and validating continuity...</span>
                </div>
              ) : conflicts.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {overallScore !== null && (
                    <div className="mb-2 p-3 bg-red-950/20 border border-red-500/20 rounded-lg text-xs text-center flex items-center justify-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-foreground">Conflicts found. Consistency Score: </span>
                      <strong className="text-accent font-mono">{overallScore}/100</strong>
                    </div>
                  )}

                  {conflicts.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.severity === "High"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : c.severity === "Medium"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {c.severity} Severity
                        </span>
                        
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {c.episodes}
                        </span>
                      </div>

                      <h4 className="font-semibold text-foreground text-sm">{c.issue}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                      
                      <div className="bg-slate-900 border border-border/40 p-2.5 rounded text-xs text-accent">
                        <strong>Resolution suggestion:</strong> {c.resolution}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 text-green-400 opacity-80" />
                  <div className="text-xs font-semibold text-foreground">No narrative conflicts detected.</div>
                  <div className="text-[10px] max-w-[200px] mt-1 leading-relaxed">
                    Trigger a sweep sweep using the button on the left to scan scripts.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Interactive Lore Bible */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-lg flex flex-col h-[480px]">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-accent" />
                Series Lore Bible
              </h3>

              {/* Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-border/60 mb-3">
                {(["character", "prop", "timeline", "geography"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                      activeTab === tab
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "geography" ? "Geo" : tab}
                  </button>
                ))}
              </div>

              {/* Lore Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {loreItems.filter(item => item.category === activeTab).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-slate-950/40 text-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground tracking-wide flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-accent" />
                        {item.entity_name}
                      </span>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-semibold uppercase">
                        <Tag className="h-2.5 w-2.5" />
                        Ep {item.source_episodes}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.lore_description}
                    </p>
                  </div>
                ))}

                {loreItems.filter(item => item.category === activeTab).length === 0 && (
                  <div className="text-center p-8 text-xs text-muted-foreground">
                    No lore entities mapped under this category yet.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center max-w-xl mx-auto shadow-lg space-y-4">
          <Network className="h-12 w-12 text-accent mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground">No Series Selected</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To explore the **Narrative Intelligence Swarm**, select an existing TV series above, create a new one, or click "Load Trilogy Demo" to load the pre-configured *The Last Letter Trilogy*.
          </p>
          <button
            onClick={seedDemo}
            className="inline-flex h-11 px-5 items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground shadow hover:bg-accent/90 transition-all font-semibold"
          >
            <Play className="h-4 w-4 fill-accent-foreground" />
            <span>Load Trilogy Demo</span>
          </button>
        </div>
      )}

      {/* Agent Execution Logs */}
      <div className="rounded-xl border border-border bg-slate-900/60 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Narrative Agent Swarm Execution Logs
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
