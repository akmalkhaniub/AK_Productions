# 06 · Design System

## Problem

The original UI ran on a single neutral grey ramp with no real accent (the
`--accent` token was literally grey) and Inter everywhere — clean but generic,
not a film-production tool.

## Decision: token-driven, runtime-switchable multi-theme system

Three full themes, selectable live, defined as CSS-variable blocks in
`globals.css` and switched via `next-themes` (`attribute="data-theme"`):

| Theme | Vibe | Accent |
|---|---|---|
| **Director's Cut** (default) | Cinematic charcoal | Film amber + teal |
| **Studio Neon** | AI-native, glassy | Magenta → cyan |
| **Nastaliq Editorial** | Warm, cultural | Gold + emerald |

### Why this approach
- The app already used semantic tokens (`--background`, `--accent`, …), so a
  re-skin is a **token-layer change**, not a per-component rewrite.
- All three themes are dark, so a `@custom-variant dark` keeps existing `dark:`
  utilities working across every theme.
- Headings auto-pick a per-theme display font (`--font-display`); fonts loaded
  via `next/font` (Inter, Space Grotesk, Fraunces, Noto Nastaliq Urdu, JetBrains
  Mono).

## Other tokens & utilities

Chromatic `--accent` + secondary `--accent-2`, `--card`, `--ring`; film-grain +
vignette overlay; fixed `.glass`; `.glow` / `.glow-hover`; `.gradient-text`;
`.font-urdu` (for trilingual dialogue); custom scrollbar.

## Knock-on change

Primary CTAs across all pages were switched from `bg-foreground` (grey/white) to
`bg-accent text-accent-foreground`, so the accent shows up app-wide and adapts
per theme.
