import os
import time
import json
from google.genai import types

from core import config
from core.genai_client import get_genai_client, supports_file_upload
from core import settings_service


async def analyze_video_with_gemini(video_path: str):
    """
    Uploads a local MP4 to Google Gemini (via the Files API), waits for
    processing, and extracts structured data (dialogues, actor timestamps,
    scenes). The model is configurable from the admin panel.
    """
    try:
        # Video upload requires the Files API, which is Developer-API only.
        if not supports_file_upload():
            return {
                "status": "error",
                "message": (
                    "Video analysis requires the Gemini Developer API (Files API). "
                    "Set GEMINI_USE_VERTEX=false and provide a GEMINI_API_KEY."
                ),
            }

        model = settings_service.get("gemini_model") or config.GEMINI_MODEL
        client = get_genai_client()

        # 1. Upload the file to Gemini
        print(f"Uploading {video_path} to Gemini...")
        video_file = client.files.upload(file=video_path)
        
        # 2. Wait for the file to be processed (video processing takes a moment)
        while video_file.state == "PROCESSING":
            print("Waiting for video processing...")
            time.sleep(2)
            video_file = client.files.get(name=video_file.name)
            
        if video_file.state == "FAILED":
            return {"status": "error", "message": "Video processing failed on Google's servers."}
            
        # 3. Prompt Gemini 1.5 Pro
        prompt = """
        You are an expert film analyst and data structurer.
        Watch this video and extract the following information.
        
        Return ONLY valid JSON in this exact structure:
        {
            "title": "Inferred Scene Title",
            "scene_description": "Detailed description of the topography, lighting, and camera angles.",
            "characters_identified": ["Char 1", "Char 2"],
            "actor_sequences": [
                {
                    "character": "Char 1",
                    "appearance_timestamps": "00:10 - 01:25",
                    "visual_actions": "Walking across the room, sitting down."
                }
            ],
            "script": [
                {
                    "speaker": "CHARACTER NAME",
                    "dialogue": {
                        "urdu_script": "Original text (if spoken in Urdu/Hindi, write in Nastaliq/Arabic characters)",
                        "roman_urdu": "Romanized text",
                        "english": "English translation"
                    }
                }
            ]
        }
        """
        
        print(f"Prompting {model}...")
        response = client.models.generate_content(
            model=model,
            contents=[video_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            )
        )
        
        structured_data = json.loads(response.text)
        
        # Clean up the file from Google's servers
        client.files.delete(name=video_file.name)
        
        # Clean up the local downloaded file
        if os.path.exists(video_path):
            os.remove(video_path)
            
        return {
            "status": "success",
            "data": structured_data
        }
        
    except Exception as e:
        # Cleanup local file on error
        if os.path.exists(video_path):
            os.remove(video_path)
        return {"status": "error", "message": str(e)}
