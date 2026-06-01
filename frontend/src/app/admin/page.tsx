"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Loader2, Save, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { apiUrl } from '@/lib/api';

type Options = Record<string, string[]>;

interface AdminData {
  settings: Record<string, string>;
  options: Options;
  defaults: Record<string, string>;
  gemini_backend: string;
  gemini_key_present: boolean;
  openai_key_present: boolean;
}

const FIELD_LABELS: Record<string, { label: string; help: string }> = {
  gemini_model: { label: 'Gemini Model', help: 'Multimodal video analysis & text structuring.' },
  openai_model: { label: 'OpenAI Model', help: 'IP discovery, script breakdown, transcript parsing.' },
  ingestion_model: { label: 'Default Ingestion Provider', help: 'Which provider the YouTube ingestion agent uses by default.' },
};

export default function AdminPanel() {
  const [data, setData] = useState<AdminData | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/admin/settings'));
        const json = await res.json();
        if (json.status === 'success') {
          setData(json.data);
          setDraft(json.data.settings);
        } else {
          setError(json.message || 'Failed to load settings.');
        }
      } catch {
        setError('Could not reach the backend. Is it running?');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirty = data ? Object.keys(draft).some((k) => draft[k] !== data.settings[k]) : false;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/admin/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (json.status === 'success') {
        setData((d) => (d ? { ...d, settings: json.data.settings } : d));
        setDraft(json.data.settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(json.message || 'Save failed.');
      }
    } catch {
      setError('Could not reach the backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <header className="mb-10 flex items-center gap-3">
        <Settings2 className="w-7 h-7 text-foreground" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">Admin · Model Configuration</h1>
          <p className="text-muted-foreground">Switch the AI models each agent uses — applied live, no redeploy.</p>
        </div>
      </header>

      {loading && (
        <div className="min-h-[300px] border border-border rounded-xl flex flex-col items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading current configuration...</p>
        </div>
      )}

      {!loading && error && !data && (
        <div className="border border-border rounded-xl p-6 bg-background flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <p className="text-foreground">{error}</p>
        </div>
      )}

      {!loading && data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Backend status */}
          <div className="border border-border rounded-xl p-5 bg-muted/30">
            <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest text-muted-foreground font-medium">
              <Cpu className="w-3.5 h-3.5" /> Backend Status
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <StatusRow label="Gemini backend" value={data.gemini_backend} />
              <StatusRow label="Gemini API key" ok={data.gemini_key_present} value={data.gemini_key_present ? 'configured' : 'missing'} />
              <StatusRow label="OpenAI API key" ok={data.openai_key_present} value={data.openai_key_present ? 'configured' : 'missing'} />
            </div>
            {data.gemini_backend === 'vertex' && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                Vertex backend selected — video analysis is disabled (Files API is Developer-API only).
              </p>
            )}
            {data.gemini_backend === 'developer' && !data.gemini_key_present && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                No GEMINI_API_KEY set — Gemini agents will fail. Add one to backend/.env.
              </p>
            )}
          </div>

          {/* Settings form */}
          <div className="border border-border rounded-xl p-6 bg-background shadow-sm space-y-6">
            {Object.keys(data.options).map((key) => {
              const meta = FIELD_LABELS[key] ?? { label: key, help: '' };
              return (
                <div key={key}>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {meta.label}
                    {data.defaults[key] === draft[key] && (
                      <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">(default)</span>
                    )}
                  </label>
                  <select
                    value={draft[key] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full border border-border bg-muted/50 rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                  >
                    {data.options[key].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {meta.help && <p className="text-xs text-muted-foreground mt-1.5">{meta.help}</p>}
                </div>
              );
            })}

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="h-11 px-6 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 disabled:opacity-40 flex items-center justify-center transition-colors shadow-sm"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </button>
              {saved && (
                <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Saved
                </span>
              )}
              {error && <span className="text-sm text-amber-600 dark:text-amber-400">{error}</span>}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs mb-1">{label}</div>
      <div className={`font-mono text-sm ${ok === false ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
