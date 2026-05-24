from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ai_agents.pre_production.ip_discovery import discover_ip_remake
from ai_agents.casting.acting_coach import analyze_audio_performance
from ai_agents.post_production.auto_dubber import generate_dub
from ai_agents.pre_production.script_breakdown import parse_and_breakdown
from ai_agents.production.continuity_agent import check_continuity
from core.database import get_db
from core.models import Project

router = APIRouter()

class IPDiscoveryRequest(BaseModel):
    genre: str
    era: str

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
