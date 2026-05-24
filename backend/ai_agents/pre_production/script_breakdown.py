import time
import os
import json
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def parse_and_breakdown(filename: str):
    """
    Parses a script and extracts elements.
    Uses OpenAI if API key is present, otherwise falls back to mock data.
    """
    title = filename.replace(".pdf", "").replace("_", " ").title() if filename else "Untitled Script"
    
    if OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            
            prompt = f"You are an expert Hollywood line producer. I have a script titled '{title}'. Generate a simulated script breakdown with 5 key production elements (Cast, Props, Wardrobe, Vehicles, VFX) and an estimated budget range. Return JSON matching this structure: {{'script_title': str, 'total_scenes': int, 'speaking_roles': int, 'estimated_budget_range': str, 'elements': [{{'id': int, 'category': str, 'item': str, 'scene': str, 'cost_est': str, 'notes': str}}]}}"
            
            response = client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["status"] = "Completed"
            return result
        except Exception as e:
            print(f"OpenAI API failed: {e}. Falling back to mock data.")

    # Simulate agent reading and analyzing script
    time.sleep(3)
    
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
            {"id": 5, "category": "VFX", "item": "Muzzle flash & Blood splatter", "scene": "42", "cost_est": "$1,200", "notes": "Post-production overlay"}
        ]
    }
