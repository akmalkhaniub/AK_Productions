"""
Single place that constructs the Google GenAI client, so no agent hardcodes
the GCP project or has to know whether we're on Vertex or the Developer API.

Default: Gemini Developer API (api_key) — required for video upload via the
Files API. Set GEMINI_USE_VERTEX=true to use Vertex AI instead (text only;
the Files API is not available on Vertex).
"""
from google import genai

from . import config


def get_genai_client() -> genai.Client:
    if config.GEMINI_USE_VERTEX:
        return genai.Client(
            vertexai=True,
            project=config.GCP_PROJECT,
            location=config.GCP_LOCATION,
        )
    if not config.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to backend/.env "
            "(get one free at https://aistudio.google.com/apikey), "
            "or set GEMINI_USE_VERTEX=true to use Vertex AI."
        )
    return genai.Client(api_key=config.GEMINI_API_KEY)


def supports_file_upload() -> bool:
    """The Files API (needed for video upload) only works on the Developer API."""
    return not config.GEMINI_USE_VERTEX
