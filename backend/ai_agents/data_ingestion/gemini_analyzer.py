import os
import time
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

async def analyze_video_with_gemini(video_path: str):
    """
    Uploads a local MP4 to Google Gemini 1.5 Pro via Vertex AI on GCP, waits for processing,
    and extracts structured data (dialogues, actor timestamps, scenes).
    """
    try:
        # Initialize the client using Vertex AI backend with the user's GCP project
        # This automatically uses Application Default Credentials (gcloud auth)
        client = genai.Client(
            vertexai=True, 
            project="agentic-portfolio-496720", 
            location="us-central1"
        )
        
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
        
        print("Prompting Gemini 1.5 Pro...")
        response = client.models.generate_content(
            model='gemini-1.5-pro',
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
