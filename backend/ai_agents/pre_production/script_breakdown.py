"""
Script Breakdown Agent — a genuine tool-calling agent (not a single prompt).

Given a script in the Library, the agent autonomously decides which tools to
call: it can list the available scripts, read the full dialogue/scene content
of a specific one, and finally submit a structured production breakdown. The
loop runs until the agent calls the terminal `submit_breakdown` tool.

This grounds the breakdown in the *actual* ingested script content (cast,
scenes, props implied by dialogue) instead of inventing one from a title.
"""
import json

from sqlalchemy.orm import Session

from core import llm, schemas
from core.models import DramaScript

MAX_STEPS = 8

# --- Tools the agent can call -------------------------------------------------

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_library_scripts",
            "description": "List all screenplays available in the Library, with id, title, scene description and identified characters. Use this to discover what scripts exist.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_script",
            "description": "Read the full content of one screenplay: scene description, characters, and the line-by-line dialogue. Use this to ground the breakdown in the real script before submitting.",
            "parameters": {
                "type": "object",
                "properties": {
                    "script_id": {"type": "integer", "description": "The Library id of the script to read."}
                },
                "required": ["script_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "submit_breakdown",
            "description": "Submit the final production breakdown. Call this exactly once when you have read the script and identified its production elements.",
            "parameters": {
                "type": "object",
                "properties": {
                    "script_title": {"type": "string"},
                    "total_scenes": {"type": "integer", "description": "Number of distinct scenes you inferred from the script."},
                    "speaking_roles": {"type": "integer", "description": "Number of distinct speaking characters."},
                    "estimated_budget_range": {"type": "string", "description": "e.g. '$1.2M - $1.8M'."},
                    "elements": {
                        "type": "array",
                        "description": "Production elements grounded in the actual script content.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "category": {"type": "string", "enum": ["Cast", "Props", "Wardrobe", "Vehicles", "VFX", "Location", "SFX"]},
                                "item": {"type": "string"},
                                "scene": {"type": "string", "description": "Which scene(s) this appears in."},
                                "cost_est": {"type": "string"},
                                "notes": {"type": "string"},
                            },
                            "required": ["category", "item", "scene", "cost_est", "notes"],
                        },
                    },
                },
                "required": ["script_title", "total_scenes", "speaking_roles", "estimated_budget_range", "elements"],
            },
        },
    },
]

SYSTEM_PROMPT = """You are an expert Hollywood line producer working as an autonomous agent.
Your task is to produce a production breakdown for a screenplay that lives in the Library.

Work like a real agent:
1. If you don't know which script to use, call list_library_scripts.
2. ALWAYS call get_script to read the actual dialogue and scene description before breaking it down — never guess from the title alone.
3. Derive production elements (cast, props, wardrobe, vehicles, VFX, locations) from what actually happens in the script. Reference the real characters and scenes.
4. Estimate realistic costs and a total budget range.
5. Call submit_breakdown exactly once with your final structured result.

Be specific and grounded. Cite real character names and scene details from the script you read."""


def _tool_list_scripts(db: Session) -> str:
    scripts = db.query(DramaScript).order_by(DramaScript.created_at.desc()).all()
    payload = [
        {
            "id": s.id,
            "title": s.title,
            "scene_description": s.scene_description,
            "characters": s.characters_identified.split(",") if s.characters_identified else [],
        }
        for s in scripts
    ]
    return json.dumps(payload)


def _tool_get_script(db: Session, script_id: int) -> str:
    s = db.query(DramaScript).filter(DramaScript.id == script_id).first()
    if not s:
        return json.dumps({"error": f"No script with id {script_id}"})
    try:
        content = json.loads(s.script_content) if s.script_content else {}
    except (ValueError, TypeError):
        content = {}
    return json.dumps(
        {
            "id": s.id,
            "title": s.title,
            "scene_description": s.scene_description,
            "characters": s.characters_identified.split(",") if s.characters_identified else [],
            "script": content.get("script", []),
            "actor_sequences": content.get("actor_sequences", []),
        }
    )


def parse_and_breakdown(filename: str = "", db: Session = None, script_id: int = 0):
    """Run the Script Breakdown agent. Prefers a real Library script (script_id);
    falls back to a title-only request, then to mock data if all providers fail."""
    if db is None:
        return _mock_breakdown(filename)

    if script_id > 0:
        user_msg = f"Produce a production breakdown for the Library script with id {script_id}. Read it first, then submit."
    elif filename:
        user_msg = f"Produce a production breakdown. The user uploaded '{filename}'. Browse the Library, pick the most relevant script, read it, then submit."
    else:
        user_msg = "Browse the Library, choose the most interesting script, read it, then submit a production breakdown."

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ]

    trace: list[str] = []
    last_script_json = {"value": ""}  # captured for the reflection step

    def dispatch(name, args):
        if name == "list_library_scripts":
            trace.append("Listed available scripts in the Library")
            return ("result", _tool_list_scripts(db))
        if name == "get_script":
            sid = int(args.get("script_id", 0))
            trace.append(f"Read full script content for script #{sid}")
            content = _tool_get_script(db, sid)
            last_script_json["value"] = content
            return ("result", content)
        if name == "submit_breakdown":
            # Guardrail: validate the model's output before accepting it.
            valid, err = schemas.validate(schemas.ScriptBreakdownResult, args)
            if err:
                trace.append(f"Rejected invalid breakdown ({err}); asking agent to fix")
                return ("result", json.dumps({"validation_error": err, "hint": "Fix these fields and call submit_breakdown again."}))
            trace.append("Submitted final production breakdown")
            elements = [e.model_dump() for e in valid.elements]
            for i, el in enumerate(elements, start=1):
                el["id"] = i
            return ("done", {
                "status": "Completed",
                "script_title": valid.script_title,
                "total_scenes": valid.total_scenes,
                "speaking_roles": valid.speaking_roles,
                "estimated_budget_range": valid.estimated_budget_range,
                "elements": elements,
                "agent_trace": trace,
            })
        return ("result", json.dumps({"error": f"Unknown tool {name}"}))

    result = llm.run_tool_loop(messages, TOOLS, dispatch, max_steps=MAX_STEPS,
                               on_attempt=lambda _p: trace.clear())
    if not result["ok"]:
        print(f"Script Breakdown agent failed across providers: {result.get('errors')}")
        return _mock_breakdown(filename)

    data = result["data"]
    data["agent_trace"] = data.get("agent_trace", []) + [f"Completed via {result['provider']}"]

    # Reflexion: a critic checks the breakdown against the real script and the
    # agent revises once if needed. Visible quality bump, bounded to 1 pass.
    data = _reflect_and_maybe_revise(data, last_script_json["value"], messages, dispatch, trace)
    return data


def _reflect_and_maybe_revise(data, script_json, messages, dispatch, trace):
    """One self-critique + revision pass (Reflexion pattern)."""
    if not script_json:
        return data
    try:
        critic_prompt = (
            "You are a meticulous line-producer QA reviewer. Given the SCRIPT and a draft "
            "BREAKDOWN, decide if the breakdown is accurate and complete (does it cover the "
            "real characters/props/locations? are budgets plausible? any obvious omissions?).\n\n"
            f"SCRIPT:\n{script_json}\n\nBREAKDOWN:\n{json.dumps(data)}\n\n"
            'Return JSON: {"needs_revision": bool, "issues": [string], "guidance": string}'
        )
        content, _ = llm.chat_json([{"role": "user", "content": critic_prompt}])
        critique = json.loads(content)
    except Exception:
        return data  # reflection is best-effort

    if not critique.get("needs_revision"):
        data["agent_trace"].append("Critic reviewed the breakdown — no revision needed")
        return data

    trace.append(f"Critic flagged issues: {', '.join(critique.get('issues', []))[:160]}")
    revise_messages = messages + [
        {"role": "user", "content": (
            "A reviewer flagged issues with your breakdown:\n"
            f"{json.dumps(critique)}\n\nRevise and call submit_breakdown again with the improved breakdown."
        )},
    ]
    revised = llm.run_tool_loop(revise_messages, TOOLS, dispatch, max_steps=MAX_STEPS)
    if revised["ok"]:
        out = revised["data"]
        out["agent_trace"] = out.get("agent_trace", []) + [f"Revised after critic ({revised['provider']})"]
        return out
    return data


def _mock_breakdown(filename: str):
    """Static fallback used when no OpenAI key / DB is available."""
    title = filename.replace(".pdf", "").replace("_", " ").title() if filename else "Untitled Script"
    return {
        "status": "Completed",
        "script_title": title,
        "total_scenes": 42,
        "speaking_roles": 8,
        "estimated_budget_range": "$1.2M - $1.8M",
        "elements": [
            {"id": 1, "category": "Cast", "item": "JOHN (30s, Lead)", "scene": "1, 4, 12, 42", "cost_est": "$5,000/day", "notes": "Requires stunt double for Scene 42"},
            {"id": 2, "category": "Props", "item": "Vintage 1960s Microphone", "scene": "4", "cost_est": "$150/day", "notes": "Must be functional for close-up"},
            {"id": 3, "category": "Wardrobe", "item": "Torn leather jacket (Hero + Backup)", "scene": "12, 42", "cost_est": "$300", "notes": "Need multiples for blood continuity"},
            {"id": 4, "category": "Vehicles", "item": "1994 Ford Bronco (White)", "scene": "22", "cost_est": "$800/day", "notes": "Requires low-loader rig for interior dialogue"},
            {"id": 5, "category": "VFX", "item": "Muzzle flash & Blood splatter", "scene": "42", "cost_est": "$1,200", "notes": "Post-production overlay"},
        ],
        "agent_trace": ["Used static fallback (no OpenAI key or database available)"],
    }
