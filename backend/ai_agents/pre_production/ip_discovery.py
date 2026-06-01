import random
import time
import json

from core import llm

def discover_ip_remake(genre: str, era: str) -> dict:
    """
    Discovers a forgotten IP to remake. Uses the resilient cheap-first LLM
    chain (any available provider); falls back to mock data if all fail.
    """
    try:
        prompt = f"You are a Hollywood executive AI. The user wants to discover a forgotten {genre} IP from the {era} to remake for modern audiences. Provide a JSON response with the following keys: 'original_title', 'year', 'logline', 'modern_twist', 'why_now', and a 'match_score' (1-100)."
        content, provider = llm.chat_json([{"role": "user", "content": prompt}])
        result = json.loads(content)
        return {
            "original_title": result.get("original_title", "Unknown"),
            "year": result.get("year", era),
            "genre": genre,
            "logline": result.get("logline", "No logline generated."),
            "modern_twist": result.get("modern_twist", "No twist generated."),
            "why_now": result.get("why_now", "Highly relevant today."),
            "match_score": result.get("match_score", 95),
            "provider": provider,
        }
    except Exception as e:
        print(f"All LLM providers failed: {e}. Falling back to mock data.")

    # Simulate agentic "thinking" time
    time.sleep(2)
    
    pitches = [
        {
            "original_title": "The Parallax View",
            "year": 1974,
            "genre": "Paranoia Thriller",
            "logline": "A reporter investigates a secretive corporation behind political assassinations.",
            "modern_twist": "Instead of physical assassinations, the corporation uses deepfakes and AI-driven social engineering to manipulate elections and ruin lives.",
            "why_now": "Capitalizes on current societal anxieties surrounding AI deepfakes, data privacy, and corporate control over truth.",
            "match_score": 98
        }
    ]
    
    return random.choice(pitches)
