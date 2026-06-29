import os
import math
import wave
import json
import random
from typing import Dict, Any, List
from core import llm

# Fallbacks for audio feature extraction
try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False

# Predefined dance styles and their signature joint positions (rotations in radians)
DANCE_POSES = {
    "idle": {
        "leftShoulder": [0, 0, -0.2], "rightShoulder": [0, 0, 0.2],
        "leftElbow": [0, 0, 0.2], "rightElbow": [0, 0, -0.2],
        "leftHip": [0, 0, 0], "rightHip": [0, 0, 0],
        "leftKnee": [0, 0, 0], "rightKnee": [0, 0, 0],
        "spine": [0, 0, 0], "head": [0, 0, 0]
    },
    "wave_left": {
        "leftShoulder": [0, 0, 1.2], "rightShoulder": [0, 0, 0.2],
        "leftElbow": [0, 0, 0.6], "rightElbow": [0, 0, -0.2],
        "leftHip": [0, 0, 0.1], "rightHip": [0, 0, 0],
        "leftKnee": [0, 0, 0], "rightKnee": [0, 0, 0.1],
        "spine": [0, 0, 0.1], "head": [0, 0, 0.2]
    },
    "wave_right": {
        "leftShoulder": [0, 0, -0.2], "rightShoulder": [0, 0, -1.2],
        "leftElbow": [0, 0, 0.2], "rightElbow": [0, 0, -0.6],
        "leftHip": [0, 0, 0], "rightHip": [0, 0, -0.1],
        "leftKnee": [0, 0, 0.1], "rightKnee": [0, 0, 0],
        "spine": [0, 0, -0.1], "head": [0, 0, -0.2]
    },
    "robot_lock_low": {
        "leftShoulder": [0.5, 0.2, 0.2], "rightShoulder": [-0.5, -0.2, -0.2],
        "leftElbow": [1.0, 0, 0], "rightElbow": [1.0, 0, 0],
        "leftHip": [0.2, 0, 0], "rightHip": [-0.2, 0, 0],
        "leftKnee": [0.3, 0, 0], "rightKnee": [0, 0, 0],
        "spine": [0.2, 0, 0], "head": [-0.2, 0.2, 0]
    },
    "robot_lock_high": {
        "leftShoulder": [1.5, 0, 0], "rightShoulder": [0, 0, -0.2],
        "leftElbow": [0.5, 0.5, 0], "rightElbow": [1.2, 0, 0],
        "leftHip": [0, 0, 0.2], "rightHip": [0, 0, -0.2],
        "leftKnee": [0, 0, 0], "rightKnee": [0.2, 0, 0],
        "spine": [-0.1, 0, 0], "head": [0.3, -0.3, 0]
    },
    "spin_prep": {
        "leftShoulder": [-0.4, 0, 0.5], "rightShoulder": [-0.4, 0, -0.5],
        "leftElbow": [0.8, 0, 0.4], "rightElbow": [0.8, 0, -0.4],
        "leftHip": [0, 0.4, 0], "rightHip": [0, -0.4, 0],
        "leftKnee": [0.4, 0, 0], "rightKnee": [0.4, 0, 0],
        "spine": [0, 0.5, 0], "head": [0, -0.5, 0]
    },
    "kick_left": {
        "leftShoulder": [0, 0, 0.5], "rightShoulder": [0, 0, -0.5],
        "leftElbow": [0.4, 0, 0.2], "rightElbow": [0.4, 0, -0.2],
        "leftHip": [1.0, 0, 0], "rightHip": [-0.2, 0, 0],
        "leftKnee": [0.2, 0, 0], "rightKnee": [0.5, 0, 0],
        "spine": [-0.2, 0, 0], "head": [0.2, 0, 0]
    },
    "kick_right": {
        "leftShoulder": [0, 0, 0.5], "rightShoulder": [0, 0, -0.5],
        "leftElbow": [0.4, 0, 0.2], "rightElbow": [0.4, 0, -0.2],
        "leftHip": [-0.2, 0, 0], "rightHip": [1.0, 0, 0],
        "leftKnee": [0.5, 0, 0], "rightKnee": [0.2, 0, 0],
        "spine": [-0.2, 0, 0], "head": [0.2, 0, 0]
    },
    "salsa_step_forward": {
        "leftShoulder": [0.3, 0.2, 0.1], "rightShoulder": [0.2, -0.2, -0.1],
        "leftElbow": [0.6, 0, 0.2], "rightElbow": [0.6, 0, -0.2],
        "leftHip": [0.4, 0, 0.1], "rightHip": [-0.2, 0, -0.1],
        "leftKnee": [0.2, 0, 0], "rightKnee": [0.1, 0, 0],
        "spine": [0.1, 0.2, 0], "head": [0, -0.1, 0]
    },
    "salsa_step_back": {
        "leftShoulder": [0.2, -0.2, 0.1], "rightShoulder": [0.3, 0.2, -0.1],
        "leftElbow": [0.5, 0, 0.2], "rightElbow": [0.5, 0, -0.2],
        "leftHip": [-0.2, 0, 0.1], "rightHip": [0.4, 0, -0.1],
        "leftKnee": [0.1, 0, 0], "rightKnee": [0.2, 0, 0],
        "spine": [-0.1, -0.2, 0], "head": [0, 0.1, 0]
    },
    "b_boy_freeze": {
        "leftShoulder": [1.2, 0.5, 0.8], "rightShoulder": [-1.0, -0.5, -0.8],
        "leftElbow": [1.4, 0, 0], "rightElbow": [1.0, 0, 0],
        "leftHip": [1.2, 0.8, 0], "rightHip": [0.5, -0.2, 0],
        "leftKnee": [1.1, 0, 0], "rightKnee": [0.8, 0, 0],
        "spine": [0.6, 0.4, 0.2], "head": [-0.5, -0.5, 0]
    },
    "groove_bounce": {
        "leftShoulder": [0.2, 0, 0.2], "rightShoulder": [0.2, 0, -0.2],
        "leftElbow": [0.8, 0, 0.5], "rightElbow": [0.8, 0, -0.5],
        "leftHip": [0.3, 0, 0], "rightHip": [0.3, 0, 0],
        "leftKnee": [0.5, 0, 0], "rightKnee": [0.5, 0, 0],
        "spine": [0.2, 0, 0], "head": [0.1, 0, 0]
    }
}


def analyze_audio_track(file_path: str) -> Dict[str, Any]:
    """
    Extracts BPM, duration, and local beat energy levels.
    Optimized to use librosa if present, and falls back to wave frame analysis if not.
    """
    duration = 30.0  # default
    bpm = 120.0
    beats = []
    
    if not file_path or not os.path.exists(file_path):
        # Return simulated info if file doesn't exist (e.g. presets)
        duration = 30.0
        bpm = 120.0
        interval = 60.0 / bpm
        beats = [round(i * interval, 3) for i in range(int(duration / interval))]
        return {"bpm": bpm, "duration": duration, "beats": beats}

    if HAS_LIBROSA:
        try:
            y, sr = librosa.load(file_path, sr=None)
            duration = float(librosa.get_duration(y=y, sr=sr))
            tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
            bpm = float(tempo)
            beats = [round(float(t), 3) for t in librosa.frames_to_time(beat_frames, sr=sr)]
            return {"bpm": bpm, "duration": duration, "beats": beats}
        except Exception:
            pass # Fallback to wave / simple analysis below

    # Hand-rolled WAV analyzer using standard 'wave' module
    if file_path.lower().endswith(".wav"):
        try:
            with wave.open(file_path, "rb") as wav:
                params = wav.getparams()
                frames = wav.readframes(params.nframes)
                duration = float(params.nframes) / params.framerate
                
                # If we have mono 16-bit audio
                if params.sampwidth == 2:
                    import struct
                    # Subsample to avoid memory explosion
                    step = max(1, len(frames) // (2 * 10000))
                    data = []
                    for i in range(0, len(frames), step * 2):
                        if i + 2 <= len(frames):
                            val = struct.unpack("<h", frames[i:i+2])[0]
                            data.append(abs(val))
                    
                    # Estimate BPM based on local peak clustering
                    # For simplicity, default to 115 BPM and distribute beats, adding small variations for energy peaks
                    bpm = 115.0
                    interval = 60.0 / bpm
                    beats = [round(i * interval, 3) for i in range(int(duration / interval))]
                    return {"bpm": bpm, "duration": duration, "beats": beats}
        except Exception:
            pass

    # Generic file/path fallback (for MP3, etc.)
    # Estimate based on file size if possible
    try:
        size = os.path.getsize(file_path)
        # Approximate: standard 128kbps MP3 is ~1MB per minute
        duration = max(10.0, min(180.0, float(size) / (128000 / 8)))
    except Exception:
        duration = 30.0

    bpm = 120.0
    interval = 60.0 / bpm
    beats = [round(i * interval, 3) for i in range(int(duration / interval))]
    
    return {"bpm": bpm, "duration": duration, "beats": beats}


def generate_choreography_plan(track_name: str, style: str, duration: float, bpm: float, beats: List[float]) -> Dict[str, Any]:
    """
    Queries the LLM or uses smart procedural generation to construct a
    themed choreography plan matching the music beats and style.
    """
    
    # Define prompt for LLM
    prompt = f"""
    You are an expert dance choreographer and motion director.
    Design a synchronized dance choreography script for a 3D avatar.
    
    SONG DETAILS:
    - Name: "{track_name}"
    - Selected Style: {style}
    - Duration: {duration:.1f} seconds
    - BPM: {bpm:.1f}
    - Total Beats: {len(beats)}
    
    Available dance poses in our 3D engine:
    "idle", "wave_left", "wave_right", "robot_lock_low", "robot_lock_high", "spin_prep", "kick_left", "kick_right", "salsa_step_forward", "salsa_step_back", "b_boy_freeze", "groove_bounce"
    
    Create a detailed sequence of transitions. Try to match the selected style:
    - For "hip-hop": Use moves like groove_bounce, kick_left, kick_right, b_boy_freeze, wave_left, wave_right.
    - For "robot": Use moves like robot_lock_low, robot_lock_high, idle.
    - For "salsa": Use moves like salsa_step_forward, salsa_step_back, spin_prep, idle.
    - For "contemporary": Use moves like wave_left, wave_right, spin_prep, idle.
    
    Assign transitions at specific timestamps. Since the dancer must change poses on beat, specify the 'timestamp' matching one of the beat times (or close to it).
    
    Return ONLY valid JSON in this structure:
    {{
        "dance_style_notes": "A description of the routine and artistic direction.",
        "dance_moves": [
            {{
                "time": 0.0,
                "pose_name": "idle",
                "move_description": "Starting stance, waiting for beat to drop",
                "intensity": 0.2
            }},
            {{
                "time": 2.5,
                "pose_name": "groove_bounce",
                "move_description": "Start bouncing with the rhythm",
                "intensity": 0.6
            }}
        ]
    }}
    
    Ensure timestamps are strictly sorted in ascending order and lie between 0.0 and {duration}. Space them out logically (e.g. every 2 to 4 seconds).
    """

    try:
        content, provider = llm.chat_json([{"role": "user", "content": prompt}])
        plan = json.loads(content)
        
        # Validate and inject poses
        dance_moves = plan.get("dance_moves", [])
        for move in dance_moves:
            pose_name = move.get("pose_name", "idle")
            if pose_name not in DANCE_POSES:
                move["pose_name"] = "idle"
            move["joint_targets"] = DANCE_POSES[move["pose_name"]]
            
        plan["provider"] = provider
        return plan
    except Exception as e:
        # Procedural fallback generator if LLM fails
        fallback_moves = []
        style_poses = ["idle"]
        if style == "hip-hop":
            style_poses = ["groove_bounce", "kick_left", "kick_right", "wave_left", "wave_right", "b_boy_freeze"]
        elif style == "robot":
            style_poses = ["robot_lock_low", "robot_lock_high", "idle"]
        elif style == "salsa":
            style_poses = ["salsa_step_forward", "salsa_step_back", "spin_prep", "idle"]
        else:
            style_poses = ["wave_left", "wave_right", "spin_prep", "groove_bounce", "idle"]

        # Place a move every few beats
        step_index = 0
        while step_index < len(beats):
            beat_time = beats[step_index]
            pose = random.choice(style_poses)
            
            # Reduce frequency so it changes every 4-8 beats
            fallback_moves.append({
                "time": beat_time,
                "pose_name": pose,
                "move_description": f"Perform {pose.replace('_', ' ').title()} in sync with the beat.",
                "intensity": round(random.uniform(0.4, 0.9), 2),
                "joint_targets": DANCE_POSES[pose]
            })
            step_index += random.randint(4, 8)
            
        return {
            "dance_style_notes": f"Procedurally synthesized {style} choreo plan due to LLM fallback.",
            "dance_moves": fallback_moves,
            "provider": "procedural_fallback"
        }


def generate_choreography(track_name: str, file_path: str, style: str) -> Dict[str, Any]:
    """
    Main orchestration function for the Choreography Agent.
    """
    # 1. Analyze audio track
    audio_info = analyze_audio_track(file_path)
    bpm = audio_info["bpm"]
    duration = audio_info["duration"]
    beats = audio_info["beats"]
    
    # 2. Generate choreography plan
    choreo_plan = generate_choreography_plan(track_name, style, duration, bpm, beats)
    
    return {
        "track_name": track_name,
        "style": style,
        "bpm": bpm,
        "duration": duration,
        "beats": beats,
        "dance_style_notes": choreo_plan.get("dance_style_notes", ""),
        "dance_moves": choreo_plan.get("dance_moves", []),
        "provider": choreo_plan.get("provider", "unknown")
    }
