export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-12">
        <h2 className="text-4xl font-light tracking-tight mb-2">Welcome back, Director.</h2>
        <p className="text-slate-400">All agentic modules are online and standing by.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-cyan-500/20">
            <span className="text-cyan-400 text-xl">💡</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 relative z-10">IP Discovery</h3>
          <p className="text-slate-400 text-sm mb-4 relative z-10">Scan historical databases to find untouched gems for modern remakes.</p>
          <a href="/ip-discovery" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium relative z-10 flex items-center">
            Launch Module 
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
        
        <div className="glass p-6 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-purple-500/20">
            <span className="text-purple-400 text-xl">🎬</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 relative z-10 text-slate-100">AI Acting Coach</h3>
          <p className="text-slate-400 text-sm mb-4 relative z-10">Extract dialogue and analyze prosody and emotion.</p>
          <a href="/acting-coach" className="text-sm text-purple-400 hover:text-purple-300 font-medium relative z-10 flex items-center">
            Launch Module 
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
        
        <div className="glass p-6 rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-emerald-500/20">
            <span className="text-emerald-400 text-xl">🎙️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 relative z-10 text-slate-100">Auto-Dubbing</h3>
          <p className="text-slate-400 text-sm mb-4 relative z-10">Translate, clone voice, and lip-sync new languages.</p>
          <a href="/auto-dubbing" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium relative z-10 flex items-center">
            Launch Module 
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        <div className="glass p-6 rounded-2xl border border-slate-700/50 hover:border-amber-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-amber-500/20">
            <span className="text-amber-400 text-xl">📄</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 relative z-10 text-slate-100">Script Breakdown</h3>
          <p className="text-slate-400 text-sm mb-4 relative z-10">Extract props, cast, and estimate budgets from PDFs.</p>
          <a href="/script-breakdown" className="text-sm text-amber-400 hover:text-amber-300 font-medium relative z-10 flex items-center">
            Launch Module 
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        <div className="glass p-6 rounded-2xl border border-slate-700/50 hover:border-rose-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-rose-500/20">
            <span className="text-rose-400 text-xl">🎞️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 relative z-10 text-slate-100">Continuity Agent</h3>
          <p className="text-slate-400 text-sm mb-4 relative z-10">Scan frames using CV to catch wardrobe and prop errors.</p>
          <a href="/continuity-agent" className="text-sm text-rose-400 hover:text-rose-300 font-medium relative z-10 flex items-center">
            Launch Module 
            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
