"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Radar, Loader2, Video, Play, CheckCircle2, Wrench, Plus, Trash2, Hash } from 'lucide-react';
import { apiUrl } from '@/lib/api';

interface Account { id: number; email: string; connected_at: string; }

function IndustryIntelInner() {
  const params = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [channels, setChannels] = useState<{ channel_id: string; title: string }[]>([
    { channel_id: '', title: '' },
  ]);
  const [running, setRunning] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (params.get('connected')) setNotice('YouTube account connected.');
    if (params.get('error')) setError(`Connection failed: ${params.get('error')}`);
    refreshAccounts();
    loadLatest();
  }, [params]);

  const refreshAccounts = async () => {
    try {
      const r = await fetch(apiUrl('/api/intel/accounts'));
      const j = await r.json();
      if (j.status === 'success') setAccounts(j.data);
    } catch { /* ignore */ }
  };

  const loadLatest = async () => {
    try {
      const r = await fetch(apiUrl('/api/intel/brief/latest'));
      const j = await r.json();
      if (j.status === 'success' && j.data) setBrief(j.data);
    } catch { /* ignore */ }
  };

  const connect = async () => {
    setError('');
    const r = await fetch(apiUrl('/api/intel/oauth/start'));
    const j = await r.json();
    if (j.status === 'success') window.location.href = j.data.auth_url;
    else setError(j.message);
  };

  const run = async (account_id = 0) => {
    setRunning(true); setError(''); setBrief(null);
    const payload: any = account_id
      ? { account_id, deliver: false }
      : { channels: channels.filter(c => c.channel_id.trim()), deliver: false };
    try {
      const r = await fetch(apiUrl('/api/intel/run'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.status === 'success') setBrief(j);
      else setError(j.message || 'Run failed');
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setRunning(false);
    }
  };

  const updateChannel = (i: number, key: 'channel_id' | 'title', val: string) =>
    setChannels(cs => cs.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <header className="mb-8 flex items-start gap-3">
        <Radar className="w-7 h-7 text-foreground mt-1" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Studio Intelligence</h1>
          <p className="text-muted-foreground">A daily agentic brief of what dropped across the channels your studio tracks — and why it matters.</p>
        </div>
      </header>

      {notice && <div className="mb-4 text-sm text-green-600 dark:text-green-400 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" />{notice}</div>}
      {error && <div className="mb-4 text-sm text-amber-600 dark:text-amber-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Connect / subscriptions */}
        <div className="border border-border rounded-xl bg-background shadow-sm p-6">
          <h3 className="font-medium text-foreground flex items-center mb-1"><Video className="w-4 h-4 mr-2 text-muted-foreground" /> Connect YouTube</h3>
          <p className="text-xs text-muted-foreground mb-4">Authorize once; the agent reads your subscriptions to know what to track.</p>
          <button onClick={connect} className="h-10 px-4 rounded-md border border-border bg-background hover:bg-muted transition-colors text-sm font-medium flex items-center">
            <Video className="w-4 h-4 mr-2" /> Connect with Google
          </button>
          {accounts.length > 0 && (
            <div className="mt-4 space-y-2">
              {accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between border border-border rounded-lg p-3 text-sm">
                  <span className="text-foreground truncate">{a.email}</span>
                  <button onClick={() => run(a.id)} disabled={running} className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-md hover:bg-accent/90 disabled:opacity-40 flex items-center">
                    <Play className="w-3 h-3 mr-1" /> Run brief
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demo mode: manual channels */}
        <div className="border border-border rounded-xl bg-background shadow-sm p-6">
          <h3 className="font-medium text-foreground flex items-center mb-1"><Hash className="w-4 h-4 mr-2 text-muted-foreground" /> Or track channels manually</h3>
          <p className="text-xs text-muted-foreground mb-4">No login needed — paste channel IDs (UC…) to demo the agent now.</p>
          <div className="space-y-2">
            {channels.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input value={c.channel_id} onChange={e => updateChannel(i, 'channel_id', e.target.value)} placeholder="UCxxxxxxxx (channel ID)"
                  className="flex-1 border border-border bg-muted/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                <input value={c.title} onChange={e => updateChannel(i, 'title', e.target.value)} placeholder="label (optional)"
                  className="w-28 border border-border bg-muted/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground" />
                {channels.length > 1 && (
                  <button onClick={() => setChannels(cs => cs.filter((_, idx) => idx !== i))} className="px-2 text-muted-foreground hover:text-foreground"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => setChannels(cs => [...cs, { channel_id: '', title: '' }])} className="text-xs text-muted-foreground hover:text-foreground flex items-center"><Plus className="w-3 h-3 mr-1" /> Add channel</button>
            <button onClick={() => run(0)} disabled={running || !channels.some(c => c.channel_id.trim())} className="ml-auto h-9 px-4 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-40 flex items-center">
              {running ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Running…</> : <><Play className="w-4 h-4 mr-2" /> Run brief</>}
            </button>
          </div>
        </div>
      </div>

      {running && (
        <div className="border border-border rounded-xl p-12 flex flex-col items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
          <p className="text-foreground font-medium">Agent scanning channels…</p>
          <p className="text-muted-foreground text-sm mt-1">Reading RSS feeds, transcripts, and composing the brief.</p>
        </div>
      )}

      {brief && !running && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="border border-border rounded-xl bg-background shadow-sm p-6">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Today's Brief</h3>
            <p className="text-xl font-semibold text-foreground">{brief.headline}</p>
          </div>

          {brief.agent_trace?.length > 0 && (
            <div className="border border-border rounded-xl bg-muted/30 p-5">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium flex items-center"><Wrench className="w-3.5 h-3.5 mr-2" /> Agent Tool Calls</h3>
              <ol className="space-y-2">
                {brief.agent_trace.map((s: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-foreground"><CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 shrink-0" /><span className="font-mono text-xs sm:text-sm">{s}</span></li>
                ))}
              </ol>
            </div>
          )}

          <div className="space-y-4">
            {brief.sections?.length ? brief.sections.map((s: any, i: number) => (
              <div key={i} className="border border-border rounded-xl bg-background shadow-sm p-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{s.channel}</div>
                <a href={s.video_url} target="_blank" rel="noreferrer" className="text-lg font-medium text-foreground hover:underline">{s.video_title}</a>
                <p className="text-foreground/80 mt-2">{s.summary}</p>
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Why it matters</span>
                  <p className="text-foreground/90 text-sm mt-1">{s.why_it_matters}</p>
                </div>
              </div>
            )) : (
              <div className="border border-border border-dashed rounded-xl p-10 text-center text-muted-foreground">No notable uploads in the last 24 hours.</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function IndustryIntel() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto py-10 px-4 text-muted-foreground">Loading…</div>}>
      <IndustryIntelInner />
    </Suspense>
  );
}
