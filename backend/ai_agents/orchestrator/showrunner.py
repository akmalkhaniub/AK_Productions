"""
Showrunner — the orchestrator agent (orchestrator-worker pattern).

Given a high-level production goal, the Showrunner *plans* and *delegates* to
the specialist agents by calling them as tools: it can browse the Library,
run the Script Breakdown agent, the IP Discovery agent, and the Continuity
agent, then synthesize a production plan. This is what turns a collection of
single-purpose agents into a genuine multi-agent system with real handoffs.

Each delegation's full result is captured so the UI can show what the
sub-agents produced, alongside the Showrunner's own reasoning trace.
"""
import json

from sqlalchemy.orm import Session

from core import llm, schemas
from core.models import DramaScript
from ai_agents.pre_production.script_breakdown import parse_and_breakdown, _tool_list_scripts, _tool_get_script
from ai_agents.pre_production.ip_discovery import discover_ip_remake
from ai_agents.production.continuity_agent import check_continuity

MAX_STEPS = 12

SYSTEM_PROMPT = """You are the SHOWRUNNER — the orchestrating agent of an AI film studio.
Given a production goal, you PLAN and DELEGATE to specialist sub-agents using your tools:
- list_library_scripts / get_script — inspect available screenplays
- run_script_breakdown(script_id) — delegate to the Script Breakdown agent
- discover_ip(genre, era) — delegate to the IP Discovery agent
- check_continuity(filename) — delegate to the Continuity agent

Think step by step: decide which specialists are needed for the goal, call them in a
sensible order, use their outputs to inform later steps, and DON'T call tools you don't
need. When finished, call submit_plan with a concise production plan, the concrete steps
you took (referencing what each sub-agent returned), and actionable recommendations."""

TOOLS = [
    {"type": "function", "function": {
        "name": "list_library_scripts",
        "description": "List screenplays available in the Library (id, title, scene, characters).",
        "parameters": {"type": "object", "properties": {}, "required": []}}},
    {"type": "function", "function": {
        "name": "get_script",
        "description": "Read a screenplay's full content by Library id.",
        "parameters": {"type": "object", "properties": {"script_id": {"type": "integer"}}, "required": ["script_id"]}}},
    {"type": "function", "function": {
        "name": "run_script_breakdown",
        "description": "Delegate to the Script Breakdown agent to produce a production breakdown for a Library script.",
        "parameters": {"type": "object", "properties": {"script_id": {"type": "integer"}}, "required": ["script_id"]}}},
    {"type": "function", "function": {
        "name": "discover_ip",
        "description": "Delegate to the IP Discovery agent to find a remakeable property.",
        "parameters": {"type": "object", "properties": {"genre": {"type": "string"}, "era": {"type": "string"}}, "required": ["genre", "era"]}}},
    {"type": "function", "function": {
        "name": "check_continuity",
        "description": "Delegate to the Continuity agent to scan footage for discrepancies.",
        "parameters": {"type": "object", "properties": {"filename": {"type": "string"}}, "required": ["filename"]}}},
    {"type": "function", "function": {
        "name": "submit_plan",
        "description": "Submit the final production plan. Call exactly once when done.",
        "parameters": {"type": "object", "properties": {
            "summary": {"type": "string"},
            "steps_taken": {"type": "array", "items": {"type": "string"}},
            "recommendations": {"type": "array", "items": {"type": "string"}},
        }, "required": ["summary"]}}},
]


def run_showrunner(goal: str, db: Session) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Production goal: {goal}"},
    ]
    trace: list[str] = []
    delegations: list[dict] = []

    def dispatch(name, args):
        if name == "list_library_scripts":
            trace.append("Inspected the Library")
            return ("result", _tool_list_scripts(db))
        if name == "get_script":
            trace.append(f"Read script #{args.get('script_id')}")
            return ("result", _tool_get_script(db, int(args.get("script_id", 0))))
        if name == "run_script_breakdown":
            sid = int(args.get("script_id", 0))
            trace.append(f"→ Delegated to Script Breakdown agent (script #{sid})")
            res = parse_and_breakdown(db=db, script_id=sid)
            delegations.append({"agent": "Script Breakdown", "data": res})
            return ("result", json.dumps({
                "script_title": res.get("script_title"),
                "elements": len(res.get("elements", [])),
                "budget": res.get("estimated_budget_range"),
            }))
        if name == "discover_ip":
            trace.append(f"→ Delegated to IP Discovery agent ({args.get('genre')}, {args.get('era')})")
            res = discover_ip_remake(args.get("genre", ""), args.get("era", ""))
            delegations.append({"agent": "IP Discovery", "data": res})
            return ("result", json.dumps({
                "title": res.get("original_title"), "logline": res.get("logline"),
                "match_score": res.get("match_score"),
            }))
        if name == "check_continuity":
            trace.append("→ Delegated to Continuity agent")
            res = check_continuity(args.get("filename", "footage.mp4"))
            delegations.append({"agent": "Continuity", "data": res})
            return ("result", json.dumps({
                "errors_found": res.get("errors_found"), "score": res.get("overall_score"),
            }))
        if name == "submit_plan":
            valid, err = schemas.validate(schemas.ShowrunnerPlan, args)
            if err:
                trace.append(f"Rejected invalid plan ({err}); asking agent to fix")
                return ("result", json.dumps({"validation_error": err}))
            trace.append("Synthesized production plan")
            return ("done", {
                "status": "Completed",
                "goal": goal,
                "summary": valid.summary,
                "steps_taken": valid.steps_taken,
                "recommendations": valid.recommendations,
                "delegations": delegations,
                "agent_trace": trace,
            })
        return ("result", json.dumps({"error": f"Unknown tool {name}"}))

    result = llm.run_tool_loop(messages, TOOLS, dispatch, max_steps=MAX_STEPS,
                               on_attempt=lambda _p: (trace.clear(), delegations.clear()))
    if result["ok"]:
        data = result["data"]
        data["agent_trace"] = data.get("agent_trace", []) + [f"Orchestrated via {result['provider']}"]
        return data
    return {"status": "error", "message": "Showrunner failed: " + "; ".join(result.get("errors", []))}
