# 02 · Agentic Patterns

The agents are built on a small set of deliberate patterns rather than ad-hoc
prompt calls. All tool-using agents share one runner: `core/llm.run_tool_loop`.

## 1. ReAct tool-loop with a terminal tool

Each agent is given tool schemas and loops: the model calls tools, we execute
them and feed results back, until it calls a **terminal `submit_*` tool** whose
arguments *are* the structured output. This guarantees well-formed results and a
clean stop condition (no "parse the prose" guesswork).

- Script Breakdown: `list_library_scripts`, `get_script`, `submit_breakdown`
- Studio Intelligence: `list_tracked_channels`, `get_recent_uploads`, `get_transcript`, `submit_brief`
- Showrunner: `run_script_breakdown`, `discover_ip`, `check_continuity`, … `submit_plan`

## 2. Tool-error recovery

If a tool raises, the loop does **not** crash — the exception is caught and
returned to the model as a tool observation (`{"error": ...}`), so the agent can
adapt or retry. (`core/llm.py`, in `run_tool_loop`.)

## 3. Typed output guardrails (`core/schemas.py`)

`submit_*` arguments are validated with Pydantic before being accepted. On
failure the validation message is fed back as an observation and the model is
asked to fix and re-submit — a **re-ask loop** that keeps malformed data out of
the UI.

## 4. Reflexion (self-critique + revise)

After Script Breakdown submits, a **critic** LLM call checks the breakdown
against the real script (coverage, plausibility, omissions). If it flags issues,
the agent revises once. Bounded to a single pass for cost/latency.
(`script_breakdown._reflect_and_maybe_revise`.)

## 5. Orchestrator-worker (multi-agent)

The **Showrunner** turns the roster into a real multi-agent system: it plans for
a goal and **delegates to specialist agents as tools**, capturing each
delegation's output. Sub-agents may run their own tool-loops (nested agents).

## 6. Provider fallback / routing

Every model call goes through the [LLM gateway](./03-llm-fallback-chain.md),
which tries providers in order and falls through on failure.

## 7. Step streaming (Server-Sent Events)

The Showrunner streams its trace **live**: `GET /api/showrunner/stream` runs the
agent in a worker thread (with its own DB session) and pushes each step onto a
queue an SSE generator drains. The `/showrunner` page consumes it with
`EventSource`, so users watch delegations appear in real time instead of a
spinner. (`run_showrunner(..., step_cb=...)`.)

## Observability

Every agent returns an `agent_trace` (human-readable step list) and the
`provider` that served it. The UI renders the trace so the agent's reasoning is
visible; the Showrunner renders it live.

## Known gaps / roadmap

- No long-term/semantic memory or RAG yet (transcripts are truncated, not retrieved).
- Step streaming exists for the Showrunner; not yet for every agent.
- No human-in-the-loop approval gates.
- Continuity is script-grounded reasoning, not yet frame-level CV.
- Auto-Dubbing is still a mock.
