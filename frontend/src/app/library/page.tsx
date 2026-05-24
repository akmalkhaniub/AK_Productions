"use client";

import { useState } from 'react';
import { Database, Search, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Library() {
  const [search, setSearch] = useState("");
  
  // Mock data until we hook up the GET /api/library endpoint
  const mockScripts = [
    { id: 1, title: "Humsafar Ep 1 (Opening Scene)", characters: ["Khirad", "Baseerat"], date: "2026-05-24" },
    { id: 2, title: "Parizaad Ep 5 (Monologue)", characters: ["Parizaad", "Naheed"], date: "2026-05-23" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Studio Library</h1>
          <p className="text-muted-foreground">View and query all extracted screenplays in your custom database.</p>
        </div>
        <Link 
          href="/data-ingestion"
          className="inline-flex h-9 items-center justify-center rounded-md bg-foreground text-background px-4 text-sm font-medium transition-colors hover:bg-foreground/90"
        >
          + Ingest New Data
        </Link>
      </header>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search scripts, characters, or dialogue..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockScripts.map((script) => (
          <div key={script.id} className="border border-border rounded-xl p-6 bg-background shadow-sm hover:border-foreground/30 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4 text-foreground">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-foreground/80">{script.title}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {script.characters.map((char, i) => (
                <span key={i} className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                  {char}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground pt-4 border-t border-border mt-auto flex justify-between items-center">
              <span>Ingested: {script.date}</span>
              <span className="font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">View Script →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
