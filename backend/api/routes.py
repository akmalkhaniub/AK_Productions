from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ai_agents.pre_production.ip_discovery import discover_ip_remake
from ai_agents.casting.acting_coach import analyze_audio_performance
from ai_agents.post_production.auto_dubber import generate_dub
from ai_agents.pre_production.script_breakdown import parse_and_breakdown
from ai_agents.production.continuity_agent import check_continuity
from core.database import get_db
from core.models import Project, DramaScript
from ai_agents.data_ingestion.youtube_scraper import ingest_youtube_drama
from ai_agents.data_ingestion.video_downloader import download_youtube_video
from ai_agents.data_ingestion.gemini_analyzer import analyze_video_with_gemini

router = APIRouter()

class IPDiscoveryRequest(BaseModel):
    genre: str
    era: str

class YoutubeIngestRequest(BaseModel):
    url: str
    model: str = "openai"
    duration: int = 0 # 0 means full video

class AudioAnalysisRequest(BaseModel):
    filename: str

class AutoDubRequest(BaseModel):
    filename: str
    target_language: str

class ScriptBreakdownRequest(BaseModel):
    filename: str

class ContinuityRequest(BaseModel):
    filename: str

@router.post("/discover-ip")
async def discover_ip_endpoint(request: IPDiscoveryRequest):
    pitch = discover_ip_remake(genre=request.genre, era=request.era)
    return {"status": "success", "data": pitch}

@router.post("/analyze-performance")
async def analyze_performance_endpoint(request: AudioAnalysisRequest):
    analysis = analyze_audio_performance(filename=request.filename)
    return {"status": "success", "data": analysis}

@router.post("/auto-dub")
async def auto_dub_endpoint(request: AutoDubRequest):
    result = generate_dub(filename=request.filename, target_language=request.target_language)
    return {"status": "success", "data": result}

@router.post("/script-breakdown")
async def script_breakdown_endpoint(request: ScriptBreakdownRequest):
    result = parse_and_breakdown(filename=request.filename)
    return {"status": "success", "data": result}

@router.post("/check-continuity")
async def check_continuity_endpoint(request: ContinuityRequest):
    result = check_continuity(filename=request.filename)
    return {"status": "success", "data": result}

import json
from sqlalchemy.orm import Session

def extract_video_id(url: str):
    if "v=" in url:
        return url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    return "unknown_" + url[-10:]

def save_script_to_db(db: Session, video_id: str, result_data: dict):
    # Check if exists
    existing = db.query(DramaScript).filter(DramaScript.video_id == video_id).first()
    
    script_data = result_data.get("data", {})
    
    if existing:
        existing.title = script_data.get("title", "Untitled")
        existing.scene_description = script_data.get("scene_description", "")
        existing.characters_identified = ",".join(script_data.get("characters_identified", []))
        existing.script_content = json.dumps(script_data)
    else:
        new_script = DramaScript(
            video_id=video_id,
            title=script_data.get("title", "Untitled"),
            scene_description=script_data.get("scene_description", ""),
            characters_identified=",".join(script_data.get("characters_identified", [])),
            script_content=json.dumps(script_data)
        )
        db.add(new_script)
    db.commit()

@router.post("/ingest-youtube")
async def ingest_youtube_endpoint(request: YoutubeIngestRequest, db: Session = Depends(get_db)):
    result = await ingest_youtube_drama(video_url=request.url, model_override=request.model)
    if result.get("status") == "success":
        video_id = extract_video_id(request.url)
        save_script_to_db(db, video_id, result)
    return result

@router.post("/analyze-video")
async def analyze_video_endpoint(request: YoutubeIngestRequest, db: Session = Depends(get_db)):
    try:
        video_path = download_youtube_video(request.url, max_duration_seconds=request.duration)
        result = await analyze_video_with_gemini(video_path)
        if result.get("status") == "success":
            video_id = extract_video_id(request.url)
            save_script_to_db(db, video_id, result)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/library")
def get_library(db: Session = Depends(get_db)):
    scripts = db.query(DramaScript).order_by(DramaScript.created_at.desc()).all()
    results = []
    for s in scripts:
        results.append({
            "id": s.id,
            "video_id": s.video_id,
            "title": s.title,
            "scene_description": s.scene_description,
            "characters_identified": s.characters_identified.split(",") if s.characters_identified else [],
            "created_at": s.created_at.isoformat(),
            "data": json.loads(s.script_content)
        })
    return {"status": "success", "data": results}

@router.get("/library/{script_id}")
def get_library_item(script_id: int, db: Session = Depends(get_db)):
    s = db.query(DramaScript).filter(DramaScript.id == script_id).first()
    if not s:
        return {"status": "error", "message": "Script not found"}
    
    return {
        "status": "success",
        "data": {
            "id": s.id,
            "video_id": s.video_id,
            "title": s.title,
            "scene_description": s.scene_description,
            "characters_identified": s.characters_identified.split(",") if s.characters_identified else [],
            "created_at": s.created_at.isoformat(),
            "data": json.loads(s.script_content)
        }
    }

# --- Database Test Routes ---

class ProjectCreate(BaseModel):
    title: str
    description: str

@router.post("/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(title=project.title, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return {"status": "success", "data": db_project}

@router.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return {"status": "success", "data": projects}
