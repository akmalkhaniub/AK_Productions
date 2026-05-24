import type { Metadata } from 'next';
import './globals.css';
import { Sparkles, Clapperboard, Mic2, FileText, Focus, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: 'AK Productions | Studio OS',
  description: 'AI-Powered Film Studio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden antialiased bg-[#0f172a] text-slate-100">
        <aside className="w-64 h-full glass flex flex-col p-6 z-10 border-r border-slate-800 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="mb-10">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              AK_Productions
            </h1>
            <p className="text-xs text-slate-400 tracking-widest mt-1">STUDIO OS</p>
          </div>
          <nav className="flex-1 space-y-4">
            <a href="/" className="flex items-center px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              <LayoutDashboard className="w-5 h-5 mr-3 text-slate-400" /> Dashboard
            </a>
            <a href="/ip-discovery" className="flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-5 h-5 mr-3" /> IP Discovery
            </a>
            <a href="/acting-coach" className="flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Clapperboard className="w-5 h-5 mr-3" /> Acting Coach
            </a>
            <a href="/auto-dubbing" className="flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Mic2 className="w-5 h-5 mr-3" /> Auto-Dubbing
            </a>
            <a href="/script-breakdown" className="flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <FileText className="w-5 h-5 mr-3" /> Script Breakdown
            </a>
            <a href="/continuity-agent" className="flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-rose-400 shadow-[0_0_10px_rgba(243,24,96,0.2)] transition-all hover:shadow-[0_0_15px_rgba(243,24,96,0.4)]">
              <Focus className="w-5 h-5 mr-3" /> Continuity Agent
            </a>
          </nav>
        </aside>
        <main className="flex-1 h-full overflow-y-auto relative">
          {/* Ambient background glow */}
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="relative z-10 p-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
