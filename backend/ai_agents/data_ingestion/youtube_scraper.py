import os
import json
from youtube_transcript_api import YouTubeTranscriptApi
from openai import AsyncOpenAI
from google.genai import types

from core import config
from core.genai_client import get_genai_client
from core import settings_service

client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)

async def ingest_youtube_drama(video_url: str, model_override: str = "openai"):
    """
    Extracts raw subtitles from a YouTube URL and uses GPT-4o-mini or Gemini 1.5 Pro
    to structure it into a screenplay format (identifying speakers).
    """
    try:
        # Extract Video ID
        if "v=" in video_url:
            video_id = video_url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in video_url:
            video_id = video_url.split("youtu.be/")[1].split("?")[0]
        else:
            return {"status": "error", "message": "Invalid YouTube URL"}

        # Fetch Transcript
        try:
            # We attempt to fetch urdu/hindi/english
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['ur', 'hi', 'en'])
            except AttributeError:
                # Fallback for newer youtube-transcript-api versions that use instance method 'fetch'
                transcript = YouTubeTranscriptApi().fetch(video_id, languages=['ur', 'hi', 'en'])
        except Exception as e:
            return {"status": "error", "message": f"Could not extract subtitles. Ensure the video has closed captions. Error: {str(e)}"}

        # Extract text from transcript snippets safely supporting both dict and object formats
        raw_text_list = []
        for t in transcript[:150]:
            if isinstance(t, dict):
                raw_text_list.append(t.get('text', ''))
            else:
                raw_text_list.append(getattr(t, 'text', ''))
        raw_text = " ".join(raw_text_list)

        # Construct System Prompt
        system_prompt = """
        You are an expert Hollywood/Bollywood screenwriter and data annotator.
        You are provided with a raw, unformatted transcript extracted from a Pakistani Drama on YouTube.
        The text may be auto-generated and lacks speaker identification.

        Your job:
        1. Infer the context and identify who is speaking (assign generic names like 'CHARACTER 1', 'MALE LEAD', 'MOTHER' if you don't know the character names from context).
        2. Format the raw text into a professional screenplay format.
        3. Provide the dialogue in multiple formats: the original Urdu script (اردو), Roman Urdu, and an English translation.
        
        Return ONLY valid JSON in this exact structure:
        {
            "title": "Extracted Drama Scene",
            "scene_description": "Brief description of what is happening based on dialogue",
            "characters_identified": ["Char 1", "Char 2"],
            "script": [
                {
                    "speaker": "CHARACTER NAME",
                    "dialogue": {
                        "urdu_script": "Original Urdu text in Nastaliq/Arabic characters",
                        "roman_urdu": "Romanized Urdu text",
                        "english": "English translation"
                    }
                }
            ]
        }
        """

        if model_override == "gemini":
            gemini_model = settings_service.get("gemini_model") or config.GEMINI_MODEL
            print(f"Routing text parsing to {gemini_model}...")
            g_client = get_genai_client()
            response = g_client.models.generate_content(
                model=gemini_model,
                contents=[system_prompt + f"\n\nHere is the raw transcript:\n\n{raw_text}"],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            structured_data = json.loads(response.text)
        else:
            openai_model = settings_service.get("openai_model") or config.OPENAI_MODEL
            print(f"Routing text parsing to {openai_model}...")
            # Call OpenAI
            response = await client.chat.completions.create(
                model=openai_model,
                response_format={ "type": "json_object" },
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Here is the raw transcript to format:\n\n{raw_text}"}
                ]
            )
            structured_data = json.loads(response.choices[0].message.content)

        
        return {
            "status": "success",
            "video_id": video_id,
            "data": structured_data
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
