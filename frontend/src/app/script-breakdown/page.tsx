"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Upload, DollarSign } from 'lucide-react';
import { apiUrl } from '@/lib/api';

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
        const res = await fetch(apiUrl('/api/script-breakdown'), {
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

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Cast': return 'bg-foreground/10 text-foreground border-foreground/20';
      case 'Props': return 'bg-muted text-foreground border-border';
      case 'Wardrobe': return 'bg-muted text-foreground border-border';
      case 'Vehicles': return 'bg-muted text-foreground border-border';
      case 'VFX': return 'bg-foreground/10 text-foreground border-foreground/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">AI Script Breakdown & Budgeting</h1>
        <p className="text-muted-foreground">Upload a PDF screenplay. The agent extracts all production elements and estimates costs.</p>
      </header>

      {!loading && !result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-dashed border-border rounded-xl p-16 flex flex-col items-center justify-center text-center relative hover:bg-muted/50 hover:border-foreground/30 transition-colors cursor-pointer bg-background"
        >
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          />
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
            <Upload className="w-8 h-8 text-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">Upload Final Draft or PDF</h3>
          <p className="text-sm text-muted-foreground max-w-md">The agent will read the script scene-by-scene to identify cast, props, wardrobe, and VFX requirements.</p>
        </motion.div>
      )}

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-border rounded-xl p-16 flex flex-col items-center justify-center bg-background min-h-[400px]"
        >
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">Extracting Production Entities</h3>
          <p className="text-muted-foreground mt-2 text-sm">Running NLP models to identify cast, props, wardrobe, and VFX requirements...</p>
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 border border-border rounded-xl p-8 bg-background shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Project</h3>
              <h2 className="text-2xl font-bold text-foreground mb-6">{result.script_title}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Scenes</p>
                  <p className="text-xl font-bold text-foreground">{result.total_scenes}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Speaking Roles</p>
                  <p className="text-xl font-bold text-foreground">{result.speaking_roles}</p>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 border border-border rounded-xl p-8 bg-background shadow-sm flex flex-col justify-center">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-muted-foreground mr-2" />
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">AI Estimated Budget</h3>
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">{result.estimated_budget_range}</p>
              <p className="text-xs text-muted-foreground">Based on current market rental rates & SAG minimums</p>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
            <div className="bg-muted/30 px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-medium text-foreground flex items-center"><FileText className="w-4 h-4 mr-2" /> Extracted Elements</h3>
              <button className="text-xs bg-muted hover:bg-muted/80 border border-border px-3 py-1.5 rounded-md transition-colors text-foreground">Export CSV</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium">Item / Description</th>
                    <th className="px-6 py-4 font-medium">Scene(s)</th>
                    <th className="px-6 py-4 font-medium">Notes</th>
                    <th className="px-6 py-4 font-medium text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.elements.map((el: any) => (
                    <tr key={el.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getCategoryStyle(el.category)}`}>
                          {el.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{el.item}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">{el.scene}</td>
                      <td className="px-6 py-4 text-muted-foreground italic">{el.notes}</td>
                      <td className="px-6 py-4 text-right text-foreground font-medium">{el.cost_est}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => {setResult(null); setFile(null);}}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              ← Parse another script
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
