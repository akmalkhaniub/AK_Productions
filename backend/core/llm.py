"""
Resilient, cheap-first LLM layer.

Tries multiple OpenAI-compatible providers in order of cost; on any failure
(bad key, quota/429, rate limit, server error) it falls through to the next.
This means a dead key or exhausted quota no longer breaks an agent — it just
uses the next available provider.

Order is cheapest-first: Groq (free tier) → Gemini Flash → OpenAI mini →
OpenRouter. All four speak the OpenAI API, so a single client covers them.

Two entry points:
- chat_json(): single-shot completion (optionally JSON-only).
- run_tool_loop(): a full agentic tool-calling loop with provider fallback,
  shared by the Script Breakdown and Studio Intelligence agents.
"""
import json
from dataclasses import dataclass

from . import config, settings_service


@dataclass
class Provider:
    name: str
    base_url: str | None
    api_key: str | None
    text_model: str
    tool_model: str
    supports_tools: bool = True
    supports_json: bool = True


def _providers() -> list[Provider]:
    openai_model = settings_service.get("openai_model") or config.OPENAI_MODEL
    flash = config.GEMINI_FLASH_MODEL
    return [
        # Groq — free tier, fastest, cheapest. Llama models.
        Provider("groq", "https://api.groq.com/openai/v1", config.GROQ_API_KEY,
                 text_model="llama-3.1-8b-instant", tool_model="llama-3.3-70b-versatile"),
        # Gemini via its OpenAI-compatible endpoint — very cheap flash model.
        Provider("gemini", "https://generativelanguage.googleapis.com/v1beta/openai/",
                 config.GEMINI_API_KEY, text_model=flash, tool_model=flash),
        # OpenAI — cheap + reliable.
        Provider("openai", None, config.OPENAI_API_KEY,
                 text_model=openai_model, tool_model=openai_model),
        # OpenRouter — broad fallback.
        Provider("openrouter", "https://openrouter.ai/api/v1", config.OPENROUTER_API_KEY,
                 text_model="openai/gpt-4o-mini", tool_model="openai/gpt-4o-mini"),
    ]


# For multi-step tool-calling, grounding matters more than raw price: cheap
# Llama models tend to hallucinate tool arguments (made-up IDs). gpt-4o-mini is
# still cheap but reliably follows the tool contract, so tool-loops prefer
# capability order while single-shot completions stay cost-first.
_TOOL_ORDER = ["openai", "gemini", "groq", "openrouter"]


def _tool_providers() -> list[Provider]:
    by_name = {p.name: p for p in _providers()}
    return [by_name[n] for n in _TOOL_ORDER if n in by_name]


def _client(p: Provider):
    from openai import OpenAI
    kwargs = {"api_key": p.api_key}
    if p.base_url:
        kwargs["base_url"] = p.base_url
    return OpenAI(**kwargs)


def available_providers() -> list[str]:
    return [p.name for p in _providers() if p.api_key]


class AllProvidersFailed(Exception):
    pass


def chat_json(messages, want_json: bool = True):
    """Single-shot completion across the cheap-first chain.
    Returns (content_str, provider_name). Raises AllProvidersFailed."""
    errors = []
    for p in _providers():
        if not p.api_key:
            continue
        try:
            kwargs = {"model": p.text_model, "messages": messages}
            if want_json and p.supports_json:
                kwargs["response_format"] = {"type": "json_object"}
            resp = _client(p).chat.completions.create(**kwargs)
            return resp.choices[0].message.content, p.name
        except Exception as e:
            errors.append(f"{p.name}: {str(e)[:140]}")
            continue
    raise AllProvidersFailed("; ".join(errors) or "no providers configured")


def run_tool_loop(messages, tools, dispatch, max_steps: int = 12, on_attempt=None):
    """Agentic tool-calling loop with provider fallback.

    dispatch(name, args) -> ("result", str) for a tool result, or
    ("done", payload) to finish. `on_attempt(provider_name)` (optional) is
    called before each provider attempt so the caller can reset its trace.

    Returns {"ok": True, "provider": name, "data": payload} or
    {"ok": False, "errors": [...]}.
    """
    errors = []
    for p in _tool_providers():
        if not p.api_key or not p.supports_tools:
            continue
        if on_attempt:
            on_attempt(p.name)
        try:
            client = _client(p)
            msgs = list(messages)
            for _ in range(max_steps):
                resp = client.chat.completions.create(
                    model=p.tool_model, messages=msgs, tools=tools, tool_choice="auto")
                m = resp.choices[0].message
                msgs.append(m)
                if not m.tool_calls:
                    msgs.append({"role": "user", "content": "Call the final submit tool now."})
                    continue
                for call in m.tool_calls:
                    try:
                        args = json.loads(call.function.arguments or "{}")
                    except ValueError:
                        args = {}
                    kind, value = dispatch(call.function.name, args)
                    if kind == "done":
                        return {"ok": True, "provider": p.name, "data": value}
                    msgs.append({"role": "tool", "tool_call_id": call.id, "content": value})
            errors.append(f"{p.name}: hit step limit")
        except Exception as e:
            errors.append(f"{p.name}: {str(e)[:140]}")
            continue
    return {"ok": False, "errors": errors}
