# 01 · Architecture

## Shape

```
Clients (Next.js web · Expo mobile)
        │  REST
        ▼
FastAPI backend ── PostgreSQL (projects, scripts, settings, accounts, briefs)
        │
        ├── core/llm.py ............ resilient multi-provider LLM gateway
        ├── core/config.py ......... single source of truth (env-driven)
        ├── core/settings_service .. runtime admin-configurable settings
        └── ai_agents/ ............. the agent roster
```

## Agent roster

| Agent | Type | Notes |
|---|---|---|
| **Showrunner** (`orchestrator/`) | Orchestrator-worker | Plans and delegates to the specialists as tools |
| **Script Breakdown** (`pre_production/`) | ReAct tool-loop + reflection | Reads a real Library script, validates output, self-critiques once |
| **Studio Intelligence** (`industry_intel/`) | ReAct tool-loop | YouTube digest via RSS + transcripts |
| **Data Ingestion** (`data_ingestion/`) | Pipeline + single LLM call | YouTube → transcript/video → structured screenplay |
| **IP Discovery** (`pre_production/`) | Single LLM call | Remake-candidate generator |
| **Acting Coach** (`casting/`) | Single LLM call | Performance analysis vs. a script |
| **Continuity** (`production/`) | Mock | Placeholder for a CV pipeline (roadmap) |
| **Auto-Dubbing** (`post_production/`) | Mock | Placeholder for Whisper/XTTS/Wav2Lip (roadmap) |

See [02-agentic-patterns](./02-agentic-patterns.md) for how the real agents are built and
[07-decision-log](./07-decision-log.md) for why the roster looks like this.

## Request flow (example: Showrunner)

1. `POST /api/showrunner/run {goal}` → `run_showrunner(goal, db)`
2. Showrunner runs a tool-loop; tools call sub-agents (`parse_and_breakdown`, `check_continuity`, …)
3. Each sub-agent may run its own tool-loop via the shared `llm.run_tool_loop`
4. The LLM gateway picks a provider per [03-llm-fallback-chain](./03-llm-fallback-chain.md)
5. Output validated with Pydantic ([core/schemas.py]) before returning

## Data model (`core/models.py`)

`Project`, `Script`, `AgentLog`, `DramaScript` (ingested screenplays),
`AppSetting` (runtime config), `ConnectedAccount` (YouTube OAuth tokens),
`IntelBrief` (generated daily briefs).
