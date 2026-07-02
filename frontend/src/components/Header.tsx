"use client";

import { useTheme } from "next-themes";
import { LayoutDashboard, Sparkles, Clapperboard, Mic2, FileText, Focus, ArrowRight, Settings2, Radar, Palette, Check, Network, Music, Eye, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const THEMES = [
  { id: "director", name: "Director's Cut", hint: "cinematic", dot: "#FFB020" },
  { id: "neon", name: "Studio Neon", hint: "AI-native", dot: "#E0218A" },
  { id: "nastaliq", name: "Nastaliq Editorial", hint: "warm", dot: "#C8A14B" },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const navLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Showrunner", href: "/showrunner", icon: Network },
    { name: "Series Intel", href: "/series-intelligence", icon: Network },
    { name: "Data Ingestion", href: "/data-ingestion", icon: Sparkles },
    { name: "Library", href: "/library", icon: FileText },
    { name: "IP Discovery", href: "/ip-discovery", icon: Sparkles },
    { name: "Acting Coach", href: "/acting-coach", icon: Clapperboard },
    { name: "Auto-Dubbing", href: "/auto-dubbing", icon: Mic2 },
    { name: "Choreography", href: "/choreography", icon: Music },
    { name: "Lip-Reading", href: "/lip-reading", icon: Eye },
    { name: "Script Breakdown", href: "/script-breakdown", icon: FileText },
    { name: "Continuity", href: "/continuity-detector", icon: Focus },
    { name: "Studio Intel", href: "/industry-intel", icon: Radar },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Admin", href: "/admin", icon: Settings2 },
  ];

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass">
      <div className="container mx-auto flex h-14 max-w-7xl items-center px-6 justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="h-2.5 w-2.5 rounded-full bg-accent group-hover:scale-125 transition-transform" />
            <span className="font-display font-bold tracking-tight text-lg" style={{ fontFamily: "var(--font-display)" }}>AK Productions</span>
          </Link>
          <nav className="hidden xl:flex items-center space-x-5 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative transition-colors hover:text-foreground ${
                    isActive ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                  {isActive && <span className="absolute -bottom-[18px] left-0 right-0 h-0.5 bg-accent rounded-full" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/pipeline"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 glow-hover"
          >
            Start Pipeline
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          {/* Theme switcher */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card/60 px-3 transition-colors hover:bg-muted"
              aria-label="Switch theme"
            >
              <Palette className="h-4 w-4" />
              {mounted && <span className="hidden sm:inline h-2.5 w-2.5 rounded-full" style={{ background: current.dot }} />}
            </button>
            {open && mounted && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl glass">
                <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Theme</div>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <span className="h-3.5 w-3.5 rounded-full ring-2 ring-border" style={{ background: t.dot }} />
                    <span className="flex-1 text-left">
                      <span className="text-foreground">{t.name}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">· {t.hint}</span>
                    </span>
                    {theme === t.id && <Check className="h-4 w-4 text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
