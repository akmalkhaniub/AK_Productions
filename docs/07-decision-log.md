# 07 · Decision Log (ADRs)

Lightweight architecture decision records — what we decided and why.

---

### ADR-001 · Gemini via Developer API, not Vertex (default)
**Decision:** Default `GEMINI_USE_VERTEX=false`; Gemini runs through the
Developer API with an API key. Vertex is a toggle.
**Why:** The Files API (required for video upload) is **only** available on the
Developer API in `google-genai`. The original code uploaded video with
`vertexai=True`, which cannot work. Vertex is kept as an option but disables
video analysis.

### ADR-002 · Centralize model configuration
**Decision:** All model IDs / project come from `core/config.py`, overridable at
runtime via an `AppSetting` table + `/admin` panel.
**Why:** Model IDs were hardcoded in 5+ files; upgrades were error-prone and a
redeploy was needed to switch models. See [04](./04-model-configuration.md).

### ADR-003 · Make Script Breakdown a real agent
**Decision:** Replace the "ask GPT to invent a breakdown from a title" call with
a tool-calling agent that reads the actual Library script.
**Why:** Grounding in real content; demonstrates genuine agentic behaviour.

### ADR-004 · Studio Intelligence: RSS for new uploads, OAuth only for the sub list
**Decision:** Use free per-channel RSS feeds for "what's new"; use the quota-
costly Data API only via OAuth to learn which channels to track.
**Why:** Avoids the 10k-unit/day quota. See [05](./05-studio-intelligence.md).

### ADR-005 · Reframe the subscription digest as "Studio Intelligence"
**Decision:** Position the YouTube digest as competitive/industry intelligence.
**Why:** A generic "summarize my subscriptions" tool didn't fit a film-
production platform; the reframing makes it on-brand and feeds IP Discovery.

### ADR-006 · Switchable multi-theme design system
**Decision:** Three runtime-switchable themes via CSS-variable tokens.
**Why:** The UI was generic grey; token architecture made a re-skin cheap. See
[06](./06-design-system.md).

### ADR-007 · Resilient, cheap-first LLM gateway
**Decision:** Route all model calls through `core/llm.py` with provider
fallback; cost-first for single-shot, capability-first for tool-loops.
**Why:** A single dead key / exhausted quota was breaking agents (OpenAI 401,
Gemini 429). Cheap models also hallucinate tool args, so tool-loops prefer
capability. See [03](./03-llm-fallback-chain.md).

### ADR-008 · Harden the agent loop (error recovery + typed guardrails + reflection)
**Decision:** Tool exceptions become model observations; `submit_*` outputs are
Pydantic-validated with a re-ask loop; Script Breakdown self-critiques once.
**Why:** A raising tool used to abandon the whole run; unvalidated JSON could
break the UI; single-pass output had no quality check.

### ADR-009 · Add the Showrunner orchestrator
**Decision:** A top-level agent that plans and delegates to the specialists as
tools, capturing each delegation.
**Why:** The "6 agents" were independent endpoints, not a system. The Showrunner
makes it genuinely multi-agent with real handoffs.

### ADR-010 · Dev seed endpoint
**Decision:** `POST /api/dev/seed-sample-script` inserts a sample trilingual
script.
**Why:** Lets the Studio Viewer and Script Breakdown / Showrunner be demoed
without spending an ingestion/LLM call.

---

## Open items / roadmap
- Continuity & Auto-Dubbing are mocks — promote to real agents (CV / Whisper+XTTS+Wav2Lip).
- Add memory/RAG, step streaming, and human-in-the-loop approval gates.
- Encrypt stored OAuth tokens; complete Google OAuth verification for public use.
- Consider adding Anthropic (direct or via OpenRouter) to the LLM chain.
