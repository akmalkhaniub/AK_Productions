# 03 · LLM Fallback Chain

`core/llm.py` is a small **LLM gateway**: a single interface over multiple
OpenAI-compatible providers that tries them in order and **falls through on any
failure** (bad key, 401, 429 quota, rate limit, server error). A dead key or
exhausted quota can no longer break an agent.

## Providers

All four speak the OpenAI Chat Completions API, so one client covers them:

| Provider | Base URL | Role |
|---|---|---|
| Groq | `api.groq.com/openai/v1` | Free tier, fastest/cheapest (Llama) |
| Gemini | `generativelanguage.googleapis.com/v1beta/openai/` | Cheap flash model |
| OpenAI | default | Cheap + reliable (`gpt-4o-mini`) |
| OpenRouter | `openrouter.ai/api/v1` | Broad fallback |

Keys come from env only (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`,
`OPENROUTER_API_KEY`). `GET /api/admin/settings` exposes the live `llm_chain`.

## Two routing orders (the key decision)

We learned the hard way that **cheap models are great at single-shot JSON but
hallucinate tool arguments in multi-step loops** (Groq's Llama invented fake
channel IDs in the intel agent). So routing is task-aware:

- **`chat_json()` — cost-first:** Groq → Gemini → OpenAI → OpenRouter.
  Used by IP Discovery, Acting Coach, transcript structuring.
- **`run_tool_loop()` — capability-first:** OpenAI → Gemini → Groq → OpenRouter.
  Used by Script Breakdown, Studio Intelligence, Showrunner. `gpt-4o-mini` is
  still cheap but follows the tool contract reliably.

## Behaviour verified live (2026-06-02)

- IP Discovery & Acting Coach → served by **Groq** (free).
- Acting Coach previously failed on Gemini 429 — the chain unblocked it.
- Script Breakdown → Groq failed mid-loop, **auto-fell through to Gemini**.
- Studio Intelligence & Showrunner → grounded correctly via **OpenAI**.

## Trade-offs

- Trying a dead-but-cheap provider first costs one fast failed request before
  falling through. Acceptable; failures are quick (auth/quota return immediately).
- `ANTHROPIC_API_KEY` / `HUGGINGFACE_API_TOKEN` exist in env but aren't in the
  chain yet (Anthropic isn't OpenAI-compatible via the OpenAI SDK; would need its
  own client or routing through OpenRouter).
