"use client";

import { useState } from 'react';

export default function ScriptBreakdown() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLoading(true);
      setResult(null);
      
      try {
        const res = await fetch('http://localhost:8000/api/script-breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: e.target.files[0].name })
        });
        const data = await res.json();
        setResult(data.data);
      } catch (error) {
        console.error("Breakdown failed", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Cast': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Props': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Wardrobe': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      case 'Vehicles': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'VFX': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-light tracking-tight mb-2">AI Script Breakdown & Budgeting</h2>
        <p className="text-slate-400">Upload a PDF screenplay. The agent will extract all production elements and estimate costs.</p>
      </header>

      {!loading && !result && (
        <div className="glass rounded-3xl p-16 border border-slate-700 border-dashed flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-amber-500/50 transition-colors cursor-pointer bg-slate-900/30">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <span className="text-5xl">📄</span>
          </div>
          <h3 className="text-2xl font-medium text-white mb-2">Upload Final Draft or PDF</h3>
          <p className="text-slate-400 max-w-md">The agent will read the script scene-by-scene to identify required elements.</p>
        </div>
      )}

      {loading && (
        <div className="glass rounded-3xl p-16 border border-amber-500/30 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent animate-pulse"></div>
          
          <div className="w-full max-w-md relative mb-8">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-full animate-[progress_3s_ease-in-out_infinite]"></div>
            </div>
            <div className="absolute -top-6 w-full text-center text-amber-400 font-mono text-sm tracking-widest animate-pulse">
              READING SCENE 14 / 42
            </div>
          </div>
          
          <h3 className="text-xl font-medium text-white">Extracting Production Entities</h3>
          <p className="text-slate-500 mt-2 text-sm text-center max-w-sm">Running NLP models to identify cast, props, wardrobe, and VFX requirements...</p>
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}} />
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 glass rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
              <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-1">Project</h3>
              <h2 className="text-2xl font-bold text-white mb-6">{result.script_title}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Scenes</p>
                  <p className="text-xl font-bold text-slate-200">{result.total_scenes}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Speaking Roles</p>
                  <p className="text-xl font-bold text-slate-200">{result.speaking_roles}</p>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 glass rounded-3xl p-8 border border-amber-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col justify-center">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/20 blur-[40px]"></div>
              <h3 className="text-xs uppercase tracking-widest text-amber-500 mb-2 font-semibold">AI Estimated Budget</h3>
              <p className="text-4xl font-bold text-white mb-2">{result.estimated_budget_range}</p>
              <p className="text-xs text-slate-400">Based on current market rental rates & SAG minimums</p>
            </div>
          </div>

          <div className="glass rounded-3xl overflow-hidden border border-slate-700/50">
            <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-medium text-white">Extracted Elements</h3>
              <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors text-white">Export CSV</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Item / Description</th>
                    <th className="px-6 py-4 font-medium">Scene(s)</th>
                    <th className="px-6 py-4 font-medium">Notes</th>
                    <th className="px-6 py-4 font-medium text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {result.elements.map((el: any) => (
                    <tr key={el.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getCategoryColor(el.category)}`}>
                          {el.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200">{el.item}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono">{el.scene}</td>
                      <td className="px-6 py-4 text-slate-400 italic">{el.notes}</td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-medium">{el.cost_est}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => {setResult(null); setFile(null);}}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              ← Parse another script
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
