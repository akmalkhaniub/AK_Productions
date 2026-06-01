"""
Central configuration — the single source of truth for models, AI backends,
and infrastructure. Everything is env-driven with sensible defaults so nothing
is hardcoded across the agents.

Values that an admin should be able to change at runtime (e.g. which model an
agent uses) live in the `app_settings` table and are served by
`settings_service`. The defaults here are the fallback when no DB override
exists. Secrets (API keys, project IDs) stay here / in the environment and are
deliberately NOT exposed through the admin API.
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _get_bool(key: str, default: bool) -> bool:
    val = os.getenv(key)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


# --- AI model defaults (overridable per-agent via the admin settings table) ---
# Multimodal / video + text analysis
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
# Cheaper/faster Gemini option, offered in the admin dropdown
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
# Text tasks (IP discovery, script breakdown, transcript structuring)
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# --- AI backend / credentials (env-only, never in the settings DB) ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Use Vertex AI backend instead of the Gemini Developer API.
# NOTE: the Files API (video upload) is only supported on the Developer API,
# so video analysis requires GEMINI_USE_VERTEX=false + a GEMINI_API_KEY.
GEMINI_USE_VERTEX = _get_bool("GEMINI_USE_VERTEX", False)
GCP_PROJECT = os.getenv("GCP_PROJECT", "agentic-portfolio-496720")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

# --- Web / CORS ---
# Comma-separated list of allowed origins for the frontend(s).
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if o.strip()
]

# Defaults seeded into the settings table on first run / served as fallback.
DEFAULT_SETTINGS = {
    "gemini_model": GEMINI_MODEL,
    "openai_model": OPENAI_MODEL,
    # Default provider for the YouTube transcript ingestion agent.
    "ingestion_model": "openai",
}
