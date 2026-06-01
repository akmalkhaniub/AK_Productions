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
# Additional OpenAI-compatible providers used for the resilient fallback chain
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

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

# --- Studio Intelligence agent (YouTube subscription digest) ---
# Google OAuth client (for "Connect YouTube"). Create at console.cloud.google.com
# → APIs & Services → Credentials → OAuth client ID (Web application).
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
# Must exactly match an authorized redirect URI on the OAuth client.
OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8000/api/intel/oauth/callback")
# Where to bounce the user back to in the frontend after connecting.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Delivery channels
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

# Run the daily brief in-process via APScheduler (demo). In production prefer
# an external trigger (GCP Cloud Scheduler → POST /api/intel/run).
INTEL_DAILY_ENABLED = _get_bool("INTEL_DAILY_ENABLED", False)
INTEL_DAILY_HOUR = int(os.getenv("INTEL_DAILY_HOUR", "8"))  # local server hour

# Defaults seeded into the settings table on first run / served as fallback.
DEFAULT_SETTINGS = {
    "gemini_model": GEMINI_MODEL,
    "openai_model": OPENAI_MODEL,
    # Default provider for the YouTube transcript ingestion agent.
    "ingestion_model": "openai",
    # Provider the Studio Intelligence agent summarizes with.
    "intel_provider": "openai",
}
