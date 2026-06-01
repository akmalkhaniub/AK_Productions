"""
Studio Intelligence agent.

Given a set of tracked channels, produces a daily brief of what's new and why
it matters to a production house. Two providers (set `intel_provider` in the
admin panel):

- openai  → a genuine tool-calling agent that *decides* which channels/videos
            to read (list_tracked_channels, get_recent_uploads, get_transcript)
            before calling the terminal submit_brief tool.
- gemini  → deterministic gather (recent uploads + transcripts) then a single
            structured summarization call. Useful when no OpenAI key is set.
"""
import datetime
import json

from core import config, settings_service
from . import youtube_source

MAX_STEPS = 14
TRANSCRIPT_CHARS = 4000


# --- shared helpers -------------------------------------------------------

def get_transcript(video_id: str) -> str:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        try:
            snippets = YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "ur", "hi"])
        except AttributeError:
            snippets = YouTubeTranscriptApi().fetch(video_id, languages=["en", "ur", "hi"])
        parts = [s.get("text", "") if isinstance(s, dict) else getattr(s, "text", "") for s in snippets]
        return " ".join(parts)[:TRANSCRIPT_CHARS]
    except Exception as e:
        return f"[no transcript available: {e}]"


SYSTEM_PROMPT = """You are a Studio Intelligence analyst for a film & TV production house.
You produce a concise DAILY BRIEF of what's new across the channels the studio tracks
(competitor studios, drama channels, industry news), and why each item matters for
development, casting, or trend-spotting.

Work like an agent:
1. Call list_tracked_channels to see what to monitor.
2. Call get_recent_uploads for channels to find videos from the last day.
3. For the most relevant videos, call get_transcript to understand the content.
   Don't transcribe everything — prioritise what matters to a studio.
4. Call submit_brief once with a tight, skimmable brief.

Be selective and editorial. If nothing notable dropped, say so honestly."""

SUBMIT_TOOL = {
    "type": "function",
    "function": {
        "name": "submit_brief",
        "description": "Submit the final daily intelligence brief. Call exactly once.",
        "parameters": {
            "type": "object",
            "properties": {
                "headline": {"type": "string", "description": "One-line summary of the day across all channels."},
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "channel": {"type": "string"},
                            "video_title": {"type": "string"},
                            "video_url": {"type": "string"},
                            "summary": {"type": "string", "description": "2-3 sentence summary of the video."},
                            "why_it_matters": {"type": "string", "description": "Why a production house should care."},
                        },
                        "required": ["channel", "video_title", "summary", "why_it_matters"],
                    },
                },
            },
            "required": ["headline", "sections"],
        },
    },
}

TOOLS = [
    {"type": "function", "function": {
        "name": "list_tracked_channels",
        "description": "List the channels the studio is tracking for this brief.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_recent_uploads",
        "description": "Get videos uploaded in the last 24h for a channel (free, via RSS).",
        "parameters": {"type": "object", "properties": {
            "channel_id": {"type": "string"}}, "required": ["channel_id"]},
    }},
    {"type": "function", "function": {
        "name": "get_transcript",
        "description": "Fetch the (truncated) transcript of a video to understand its content.",
        "parameters": {"type": "object", "properties": {
            "video_id": {"type": "string"}}, "required": ["video_id"]},
    }},
    SUBMIT_TOOL,
]


def run_intel_agent(channels: list[dict]) -> dict:
    """channels: [{channel_id, title}]. Returns a brief dict."""
    if not channels:
        return {"status": "error", "message": "No channels to track. Connect YouTube or add channels first."}

    provider = settings_service.get("intel_provider") or "openai"
    if provider == "gemini":
        return _run_gemini(channels)
    return _run_openai(channels)


# --- OpenAI agentic loop --------------------------------------------------

def _run_openai(channels: list[dict]) -> dict:
    api_key = config.OPENAI_API_KEY
    if not (api_key and api_key != "your_openai_api_key_here"):
        return {"status": "error", "message": "No OpenAI API key. Set one, or switch intel_provider to 'gemini' in the admin panel."}

    from openai import OpenAI

    client = OpenAI(api_key=api_key)
    model = settings_service.get("openai_model") or config.OPENAI_MODEL

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "Produce today's studio intelligence brief from the tracked channels."},
    ]
    trace: list[str] = []

    try:
        for _ in range(MAX_STEPS):
            response = client.chat.completions.create(
                model=model, messages=messages, tools=TOOLS, tool_choice="auto")
            msg = response.choices[0].message
            messages.append(msg)

            if not msg.tool_calls:
                messages.append({"role": "user", "content": "Call submit_brief with the final brief."})
                continue

            for call in msg.tool_calls:
                name = call.function.name
                try:
                    args = json.loads(call.function.arguments or "{}")
                except ValueError:
                    args = {}

                if name == "list_tracked_channels":
                    trace.append(f"Listed {len(channels)} tracked channels")
                    result = json.dumps(channels)
                elif name == "get_recent_uploads":
                    cid = args.get("channel_id", "")
                    vids = youtube_source.get_recent_uploads(cid)
                    trace.append(f"Checked recent uploads for {cid} ({len(vids)} found)")
                    result = json.dumps(vids)
                elif name == "get_transcript":
                    vid = args.get("video_id", "")
                    trace.append(f"Read transcript for video {vid}")
                    result = json.dumps({"video_id": vid, "transcript": get_transcript(vid)})
                elif name == "submit_brief":
                    trace.append("Composed daily brief")
                    return _finalize(args, trace)
                else:
                    result = json.dumps({"error": f"Unknown tool {name}"})

                messages.append({"role": "tool", "tool_call_id": call.id, "content": result})

        return {"status": "error", "message": "Agent did not finish within the step limit."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# --- Gemini deterministic path -------------------------------------------

def _run_gemini(channels: list[dict]) -> dict:
    from google.genai import types
    from core.genai_client import get_genai_client

    trace: list[str] = []
    gathered = []
    for ch in channels:
        vids = youtube_source.get_recent_uploads(ch["channel_id"])
        trace.append(f"Checked {ch.get('title', ch['channel_id'])} ({len(vids)} new)")
        for v in vids:
            if "error" in v:
                continue
            v["transcript"] = get_transcript(v["video_id"])
            gathered.append(v)
            trace.append(f"Read transcript for '{v['title']}'")

    if not gathered:
        return _finalize({"headline": "No new uploads in the last 24h.", "sections": []}, trace)

    try:
        model = settings_service.get("gemini_model") or config.GEMINI_MODEL
        client = get_genai_client()
        prompt = SYSTEM_PROMPT + "\n\nHere are the new videos (with transcripts):\n" + json.dumps(gathered)[:60000] + """

Return ONLY valid JSON: {"headline": str, "sections": [{"channel": str, "video_title": str, "video_url": str, "summary": str, "why_it_matters": str}]}"""
        response = client.models.generate_content(
            model=model, contents=[prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json"))
        trace.append("Composed daily brief")
        return _finalize(json.loads(response.text), trace)
    except Exception as e:
        return {"status": "error", "message": str(e)}


def _finalize(args: dict, trace: list[str]) -> dict:
    return {
        "status": "success",
        "headline": args.get("headline", "Daily Studio Intelligence Brief"),
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "sections": args.get("sections", []),
        "agent_trace": trace,
    }
