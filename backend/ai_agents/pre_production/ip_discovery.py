import random
import time
import os
import json
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def discover_ip_remake(genre: str, era: str) -> dict:
    """
    MVP Agent Logic for discovering an IP for remake.
    Uses OpenAI if API key is present, otherwise falls back to mock data.
    """
    if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            
            prompt = f"You are a Hollywood executive AI. The user wants to discover a forgotten {genre} IP from the {era} to remake for modern audiences. Provide a JSON response with the following keys: 'original_title', 'year', 'logline', 'modern_twist', 'why_now', and a 'match_score' (1-100)."
            
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return {
                "original_title": result.get("original_title", "Unknown"),
                "year": result.get("year", era),
                "genre": genre,
                "logline": result.get("logline", "No logline generated."),
                "modern_twist": result.get("modern_twist", "No twist generated."),
                "why_now": result.get("why_now", "Highly relevant today."),
                "match_score": result.get("match_score", 95)
            }
        except Exception as e:
            print(f"OpenAI API failed: {e}. Falling back to mock data.")

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
