from fastapi import APIRouter, Depends, File, UploadFile, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ai_agents.pre_production.ip_discovery import discover_ip_remake
from ai_agents.casting.acting_coach import analyze_audio_performance
from ai_agents.post_production.auto_dubber import generate_dub
from ai_agents.pre_production.script_breakdown import parse_and_breakdown
from ai_agents.production.continuity_agent import check_continuity
from core.database import get_db
from core.models import Project, DramaScript, ConnectedAccount, IntelBrief, Series, SeriesEpisode, SeriesLore, ScriptAnnotation
from core import config, settings_service
from ai_agents.data_ingestion.youtube_scraper import ingest_youtube_drama
from ai_agents.data_ingestion.video_downloader import download_youtube_video
from ai_agents.data_ingestion.gemini_analyzer import analyze_video_with_gemini
from ai_agents.industry_intel import youtube_source, intel_agent, delivery
from ai_agents.orchestrator.showrunner import run_showrunner
from ai_agents.production.choreography_agent import generate_choreography
from ai_agents.production.lip_reader_agent import restore_silent_video_dialogue
from ai_agents.production.video_continuity_agent import compare_takes_for_continuity
from core import llm

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
    script_id: int = 0

class AutoDubRequest(BaseModel):
    filename: str
    target_language: str

class ScriptBreakdownRequest(BaseModel):
    filename: str = ""
    script_id: int = 0

class ContinuityRequest(BaseModel):
    filename: str = ""
    script_id: int = 0

@router.post("/discover-ip")
async def discover_ip_endpoint(request: IPDiscoveryRequest):
    pitch = discover_ip_remake(genre=request.genre, era=request.era)
    return {"status": "success", "data": pitch}

@router.post("/analyze-performance")
async def analyze_performance_endpoint(request: AudioAnalysisRequest, db: Session = Depends(get_db)):
    script_data = None
    if request.script_id > 0:
        # Agent-to-Agent: fetch the script from Library (saved by Data Ingestion Agent)
        script_record = db.query(DramaScript).filter(DramaScript.id == request.script_id).first()
        if script_record:
            script_data = json.loads(script_record.script_content)
    
    analysis = analyze_audio_performance(filename=request.filename, script_data=script_data)
    return {"status": "success", "data": analysis}

@router.post("/auto-dub")
async def auto_dub_endpoint(request: AutoDubRequest):
    result = generate_dub(filename=request.filename, target_language=request.target_language)
    return {"status": "success", "data": result}

@router.post("/script-breakdown")
async def script_breakdown_endpoint(request: ScriptBreakdownRequest, db: Session = Depends(get_db)):
    result = parse_and_breakdown(filename=request.filename, db=db, script_id=request.script_id)
    return {"status": "success", "data": result}

@router.post("/check-continuity")
async def check_continuity_endpoint(request: ContinuityRequest, db: Session = Depends(get_db)):
    result = check_continuity(filename=request.filename, db=db, script_id=request.script_id)
    return {"status": "success", "data": result}

@router.post("/choreography/generate")
async def choreography_generate_endpoint(
    style: str = Form("hip-hop"),
    track_name: str = Form("Preset Track"),
    file: UploadFile | None = File(None)
):
    import shutil
    import tempfile
    import os
    
    temp_file_path = ""
    if file is not None:
        # Save upload to a temp file
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_file_path = tmp.name
    
    try:
        result = generate_choreography(
            track_name=track_name,
            file_path=temp_file_path,
            style=style
        )
        return {"status": "success", "data": result}
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

@router.post("/lip-reading/restore")
async def lip_reading_restore_endpoint(
    file: UploadFile | None = File(None),
    filename: str = Form("silent_confrontation.mp4"),
    custom_segments_json: str | None = Form(None)
):
    import shutil
    import tempfile
    import os
    import json
    import uuid
    from ai_agents.production.lip_reader_agent import TEMP_DIR
    
    target_filename = filename
    temp_file_path = ""
    
    custom_segments = None
    if custom_segments_json:
        try:
            custom_segments = json.loads(custom_segments_json)
        except Exception:
            pass
            
    if file is not None:
        # Save to temp_videos
        safe_name = f"upload_{uuid.uuid4().hex}_{file.filename}"
        temp_file_path = os.path.join(TEMP_DIR, safe_name)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        target_filename = safe_name
        
    try:
        result = await restore_silent_video_dialogue(
            filename=target_filename,
            custom_segments=custom_segments
        )
        return result
    except Exception as e:
        # Clean up file on error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass
        return {"status": "error", "message": str(e)}

@router.post("/continuity/compare-takes")
async def continuity_compare_takes_endpoint(
    file1: UploadFile | None = File(None),
    file2: UploadFile | None = File(None),
    take1_name: str = Form("take_1_confrontation.mp4"),
    take2_name: str = Form("take_2_confrontation.mp4")
):
    import shutil
    import os
    import uuid
    from ai_agents.production.video_continuity_agent import TEMP_DIR
    
    t1_target = take1_name
    t2_target = take2_name
    
    t1_temp = ""
    t2_temp = ""
    
    # Save upload 1
    if file1 is not None:
        safe_name_1 = f"upload_{uuid.uuid4().hex}_{file1.filename}"
        t1_temp = os.path.join(TEMP_DIR, safe_name_1)
        with open(t1_temp, "wb") as buffer:
            shutil.copyfileobj(file1.file, buffer)
        t1_target = safe_name_1

    # Save upload 2
    if file2 is not None:
        safe_name_2 = f"upload_{uuid.uuid4().hex}_{file2.filename}"
        t2_temp = os.path.join(TEMP_DIR, safe_name_2)
        with open(t2_temp, "wb") as buffer:
            shutil.copyfileobj(file2.file, buffer)
        t2_target = safe_name_2

    try:
        result = await compare_takes_for_continuity(
            take1_path=t1_target,
            take2_path=t2_target
        )
        return result
    except Exception as e:
        # Clean up files on error
        for path in [t1_temp, t2_temp]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass
        return {"status": "error", "message": str(e)}

# --- Series Batch Ingestion & Narrative Intelligence ---

class SeriesCreate(BaseModel):
    title: str
    description: str = ""

class EpisodeIngest(BaseModel):
    episode_number: int
    title: str = ""
    script_content: str

@router.post("/series")
def create_series_endpoint(payload: SeriesCreate, db: Session = Depends(get_db)):
    series = Series(title=payload.title, description=payload.description)
    db.add(series)
    db.commit()
    db.refresh(series)
    return {"status": "success", "data": series}

@router.get("/series")
def list_series_endpoint(db: Session = Depends(get_db)):
    series_list = db.query(Series).all()
    results = []
    for s in series_list:
        ep_count = db.query(SeriesEpisode).filter(SeriesEpisode.series_id == s.id).count()
        results.append({
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "episode_count": ep_count,
            "created_at": s.created_at.isoformat()
        })
    return {"status": "success", "data": results}

@router.get("/series/{series_id}")
def get_series_endpoint(series_id: int, db: Session = Depends(get_db)):
    s = db.query(Series).filter(Series.id == series_id).first()
    if not s:
        return {"status": "error", "message": "Series not found"}
    episodes = db.query(SeriesEpisode).filter(SeriesEpisode.series_id == series_id).order_by(SeriesEpisode.episode_number).all()
    eps = [{
        "id": ep.id,
        "episode_number": ep.episode_number,
        "title": ep.title,
        "created_at": ep.created_at.isoformat()
    } for ep in episodes]
    return {
        "status": "success",
        "data": {
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "episodes": eps
        }
    }

@router.post("/series/{series_id}/episodes")
def add_episode_endpoint(series_id: int, payload: EpisodeIngest, db: Session = Depends(get_db)):
    s = db.query(Series).filter(Series.id == series_id).first()
    if not s:
        return {"status": "error", "message": "Series not found"}
    
    existing = db.query(SeriesEpisode).filter(
        SeriesEpisode.series_id == series_id,
        SeriesEpisode.episode_number == payload.episode_number
    ).first()
    
    if existing:
        existing.title = payload.title
        existing.script_content = payload.script_content
        db.commit()
        db.refresh(existing)
        return {"status": "success", "data": existing, "updated": True}
    else:
        new_ep = SeriesEpisode(
            series_id=series_id,
            episode_number=payload.episode_number,
            title=payload.title,
            script_content=payload.script_content
        )
        db.add(new_ep)
        db.commit()
        db.refresh(new_ep)
        return {"status": "success", "data": new_ep, "updated": False}

@router.post("/series/{series_id}/run-narrative-sweep")
def run_narrative_sweep_endpoint(series_id: int, db: Session = Depends(get_db)):
    from ai_agents.pre_production.narrative_agent import run_narrative_sweep
    result = run_narrative_sweep(series_id, db)
    return result

@router.get("/series/{series_id}/lore-bible")
def get_lore_bible_endpoint(series_id: int, db: Session = Depends(get_db)):
    lore_items = db.query(SeriesLore).filter(SeriesLore.series_id == series_id).order_by(SeriesLore.category, SeriesLore.entity_name).all()
    results = [{
        "id": l.id,
        "category": l.category,
        "entity_name": l.entity_name,
        "lore_description": l.lore_description,
        "source_episodes": l.source_episodes,
        "last_updated": l.last_updated.isoformat()
    } for l in lore_items]
    return {"status": "success", "data": results}

@router.post("/dev/seed-sample-series")
def seed_sample_series_endpoint(db: Session = Depends(get_db)):
    existing = db.query(Series).filter(Series.title == "The Last Letter Trilogy").first()
    if existing:
        return {"status": "success", "data": {"id": existing.id, "created": False}}
        
    series = Series(
        title="The Last Letter Trilogy",
        description="A three-episode TV trilogy tracking Ayesha's final letters to her father at Lahore railway station."
    )
    db.add(series)
    db.commit()
    db.refresh(series)
    
    ep1 = SeriesEpisode(
        series_id=series.id,
        episode_number=1,
        title="The Storm Gathers",
        script_content="Ayesha arrives at Lahore platform 2. Rain is pouring down. She stands under the rusted tin roof wearing a heavy woolen winter shawl. She holds a folded letter. Imran approaches, hands her the mother's pocket watch. Imran says: 'This watch has been broken and frozen at 9:05 since she left us.' Ayesha confronts him. Later, Ayesha tears up the letter and throws it onto the wet tracks."
    )
    ep2 = SeriesEpisode(
        series_id=series.id,
        episode_number=2,
        title="Frozen Hands",
        script_content="Ayesha is in her hotel room. She opens her handbag, pulls out the identical pristine, dry letter to read it again. Meanwhile, Imran sits in a cafe, pulls out the pocket watch and checks the active moving time, saying 'it still runs perfectly, keeping the rhythm of my days'."
    )
    ep3 = SeriesEpisode(
        series_id=series.id,
        episode_number=3,
        title="Last Train to Lahore",
        script_content="Setting is Lahore platform 2. Ayesha is standing in the hot summer heat of 1952. However, she is wearing the identical heavy woolen winter shawl from Episode 1. She waits as the last train to Lahore approaches. The Station Guard announces: 'Last train to Lahore — platform two!'"
    )
    db.add_all([ep1, ep2, ep3])
    db.commit()
    
    return {"status": "success", "data": {"id": series.id, "created": True}}

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

# --- Script Annotations & AI Feedback ---

class AnnotationCreate(BaseModel):
    line_index: int
    category: str  # "dialogue" or "topography"
    author: str = "User"
    text: str

class AgentFeedbackRequest(BaseModel):
    line_index: int
    category: str
    agent_type: str  # "AI Acting Coach", "AI Continuity Agent", "AI Creative Director"
    speaker: str = ""
    dialogue_text: str = ""

@router.get("/library/{script_id}/annotations")
def get_script_annotations(script_id: int, db: Session = Depends(get_db)):
    annotations = db.query(ScriptAnnotation).filter(ScriptAnnotation.script_id == script_id).order_by(ScriptAnnotation.created_at.asc()).all()
    results = [{
        "id": a.id,
        "line_index": a.line_index,
        "category": a.category,
        "author": a.author,
        "text": a.text,
        "created_at": a.created_at.isoformat()
    } for a in annotations]
    return {"status": "success", "data": results}

@router.post("/library/{script_id}/annotations")
def create_script_annotation(script_id: int, payload: AnnotationCreate, db: Session = Depends(get_db)):
    ann = ScriptAnnotation(
        script_id=script_id,
        line_index=payload.line_index,
        category=payload.category,
        author=payload.author,
        text=payload.text
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return {"status": "success", "data": ann}

@router.delete("/library/{script_id}/annotations/{ann_id}")
def delete_script_annotation(script_id: int, ann_id: int, db: Session = Depends(get_db)):
    ann = db.query(ScriptAnnotation).filter(
        ScriptAnnotation.script_id == script_id,
        ScriptAnnotation.id == ann_id
    ).first()
    if not ann:
        return {"status": "error", "message": "Annotation not found"}
    db.delete(ann)
    db.commit()
    return {"status": "success", "message": "Annotation deleted"}

@router.post("/library/{script_id}/annotations/agent-feedback")
async def generate_agent_script_feedback(script_id: int, payload: AgentFeedbackRequest, db: Session = Depends(get_db)):
    # Retrieve script info for context
    script_item = db.query(DramaScript).filter(DramaScript.id == script_id).first()
    context = ""
    if script_item:
        context = f"Scene Premise: {script_item.scene_description}."

    agent_role = payload.agent_type
    
    prompt = f"""
    You are an expert film industry professional acting as the {agent_role}.
    {context}
    
    Evaluate the following screenplay component:
    Category: {payload.category}
    Speaker: {payload.speaker}
    Content: "{payload.dialogue_text}"
    
    Provide a concise, professional comment/critique (2-3 sentences) from the perspective of the {agent_role}.
    - If acting coach: discuss prosody, subtext, or emotional tone.
    - If continuity: discuss wardrobe/prop risks or visual cues.
    - If creative director: discuss blocking, cinematic subtext, or camera angles.
    
    Format the output as a clean text response without markdown block wrappers.
    """

    try:
        content, provider = await llm.chat_raw_async([{"role": "user", "content": prompt}])
        text_feedback = content.strip()
    except Exception as e:
        # Fallback mocks if offline/unconfigured
        if "acting" in agent_role.lower():
            text_feedback = f"[Mock Critique] As Acting Coach: {payload.speaker} should emphasize the pause before reading. The subtext indicates hesitation. Keep the volume intimate."
        elif "continuity" in agent_role.lower():
            text_feedback = f"[Mock Critique] As Continuity Supervisor: Watch the character's hand movements. Ensure the prop matches framing from wide to close-up."
        else:
            text_feedback = f"[Mock Critique] As Creative Director: The camera should slowly dolly in on {payload.speaker} here. Let the silence build tension."

    # Save generated AI comment to DB
    ann = ScriptAnnotation(
        script_id=script_id,
        line_index=payload.line_index,
        category=payload.category,
        author=agent_role,
        text=text_feedback
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    
    return {"status": "success", "data": ann}

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

# --- Admin: runtime model/configuration ---

# Choices surfaced as dropdowns in the admin panel.
MODEL_OPTIONS = {
    "gemini_model": ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    "openai_model": ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    "ingestion_model": ["openai", "gemini"],
    "intel_provider": ["openai", "gemini"],
}

class SettingsUpdate(BaseModel):
    gemini_model: str | None = None
    openai_model: str | None = None
    ingestion_model: str | None = None
    intel_provider: str | None = None

@router.get("/admin/settings")
def get_admin_settings():
    return {
        "status": "success",
        "data": {
            "settings": settings_service.get_settings(),
            "options": MODEL_OPTIONS,
            "defaults": config.DEFAULT_SETTINGS,
            "gemini_backend": "vertex" if config.GEMINI_USE_VERTEX else "developer",
            "gemini_key_present": bool(config.GEMINI_API_KEY),
            "openai_key_present": bool(config.OPENAI_API_KEY),
            "llm_chain": llm.available_providers(),
        },
    }

@router.put("/admin/settings")
def update_admin_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    # Reject values outside the known option lists.
    for key, value in updates.items():
        if key in MODEL_OPTIONS and value not in MODEL_OPTIONS[key]:
            return {"status": "error", "message": f"Invalid value '{value}' for {key}"}
    settings = settings_service.update_settings(db, updates)
    return {"status": "success", "data": {"settings": settings}}

# --- Studio Intelligence agent ---

import datetime
import secrets
from fastapi.responses import RedirectResponse

class ChannelInput(BaseModel):
    channel_id: str
    title: str = ""

class IntelRunRequest(BaseModel):
    account_id: int = 0           # use a connected account's subscriptions
    channels: list[ChannelInput] = []  # or a manual channel list (demo, no login)
    deliver: bool = False

def _valid_access_token(db: Session, account: ConnectedAccount) -> str:
    """Return a usable access token, refreshing it if expired."""
    if account.token_expiry and account.token_expiry <= datetime.datetime.utcnow():
        refreshed = youtube_source.refresh_access_token(account.refresh_token)
        account.access_token = refreshed["access_token"]
        account.token_expiry = refreshed["token_expiry"]
        db.commit()
    return account.access_token

def run_and_store_brief(db: Session, channels: list[dict], account_id: int = 0, deliver: bool = False) -> dict:
    """Core pipeline shared by the API endpoint and the scheduler."""
    account = None
    if account_id:
        account = db.query(ConnectedAccount).filter(ConnectedAccount.id == account_id).first()
        if not account:
            return {"status": "error", "message": "Connected account not found."}
        token = _valid_access_token(db, account)
        channels = youtube_source.get_subscriptions(token)

    brief = intel_agent.run_intel_agent(channels)
    if brief.get("status") != "success":
        return brief

    record = IntelBrief(
        account_id=account_id or None,
        headline=brief["headline"],
        content=json.dumps(brief),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    brief["id"] = record.id

    if deliver:
        brief["delivery"] = delivery.deliver(
            brief,
            email=(account.notify_email if account else ""),
            slack_webhook=(account.slack_webhook if account else ""),
        )
    return brief

@router.get("/intel/oauth/start")
def intel_oauth_start():
    if not config.GOOGLE_OAUTH_CLIENT_ID:
        return {"status": "error", "message": "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID/SECRET."}
    state = secrets.token_urlsafe(16)
    return {"status": "success", "data": {"auth_url": youtube_source.build_auth_url(state)}}

@router.get("/intel/oauth/callback")
def intel_oauth_callback(code: str = "", state: str = "", db: Session = Depends(get_db)):
    try:
        info = youtube_source.exchange_code(code)
    except Exception as e:
        return RedirectResponse(f"{config.FRONTEND_URL}/industry-intel?error={str(e)[:120]}")

    account = db.query(ConnectedAccount).filter(ConnectedAccount.google_sub == info["google_sub"]).first()
    if account:
        account.access_token = info["access_token"]
        account.token_expiry = info["token_expiry"]
        if info.get("refresh_token"):
            account.refresh_token = info["refresh_token"]
        account.email = info.get("email")
    else:
        account = ConnectedAccount(
            google_sub=info["google_sub"], email=info.get("email"),
            access_token=info["access_token"], refresh_token=info.get("refresh_token"),
            token_expiry=info["token_expiry"], notify_email=info.get("email"),
        )
        db.add(account)
    db.commit()
    return RedirectResponse(f"{config.FRONTEND_URL}/industry-intel?connected=1")

@router.get("/intel/accounts")
def intel_accounts(db: Session = Depends(get_db)):
    accounts = db.query(ConnectedAccount).order_by(ConnectedAccount.created_at.desc()).all()
    return {"status": "success", "data": [
        {"id": a.id, "email": a.email, "connected_at": a.created_at.isoformat()} for a in accounts
    ]}

@router.post("/intel/run")
def intel_run(request: IntelRunRequest, db: Session = Depends(get_db)):
    channels = [c.model_dump() for c in request.channels]
    return run_and_store_brief(db, channels, account_id=request.account_id, deliver=request.deliver)

@router.get("/intel/brief/latest")
def intel_latest(db: Session = Depends(get_db)):
    record = db.query(IntelBrief).order_by(IntelBrief.created_at.desc()).first()
    if not record:
        return {"status": "success", "data": None}
    return {"status": "success", "data": json.loads(record.content)}

# --- Dev convenience: seed a sample script (so the viewer / breakdown can be
#     demoed without spending an ingestion/LLM call) ---

_SAMPLE_SCRIPT = {
    "title": "The Last Letter",
    "scene_description": "A rain-soaked night at a dim railway platform. AYESHA confronts her estranged father IMRAN as the last train looms; a vintage pocket watch changes hands.",
    "characters_identified": ["AYESHA", "IMRAN", "STATION GUARD"],
    "actor_sequences": [
        {"character": "AYESHA", "appearance_timestamps": "00:00 - 01:40", "visual_actions": "Steps off the bench, walks toward Imran through the rain, clutches a folded letter."},
        {"character": "IMRAN", "appearance_timestamps": "00:20 - 02:10", "visual_actions": "Stands under the platform light, hands over a pocket watch, looks away as the train approaches."},
    ],
    "script": [
        {"speaker": "AYESHA", "dialogue": {"urdu_script": "تم نے ہمیں بارش میں چھوڑ دیا تھا، بالکل آج کی رات کی طرح۔", "roman_urdu": "Tum ne humein barish mein chhor diya tha, bilkul aaj ki raat ki tarah.", "english": "You left us in the rain — just like tonight."}},
        {"speaker": "IMRAN", "dialogue": {"urdu_script": "میں نے تمہاری ماں کی گھڑی سنبھال کر رکھی۔ یہ آج بھی چلتی ہے۔", "roman_urdu": "Main ne tumhari maa ki ghari sambhaal kar rakhi. Yeh aaj bhi chalti hai.", "english": "I kept your mother's watch. It still runs."}},
        {"speaker": "STATION GUARD", "dialogue": {"urdu_script": "لاہور کی آخری ٹرین، پلیٹ فارم نمبر دو!", "roman_urdu": "Lahore ki aakhri train, platform number do!", "english": "Last train to Lahore — platform two!"}},
    ],
}

# --- Showrunner (orchestrator agent) ---

class ShowrunnerRequest(BaseModel):
    goal: str

@router.post("/showrunner/run")
def showrunner_run(request: ShowrunnerRequest, db: Session = Depends(get_db)):
    return run_showrunner(request.goal, db)

@router.get("/showrunner/stream")
def showrunner_stream(goal: str):
    """Server-Sent Events: stream the Showrunner's steps live, then the result.
    Runs the agent in a worker thread with its own DB session (sessions aren't
    thread-safe), pushing steps onto a queue the SSE generator drains."""
    import json as _json
    import queue
    import threading
    from fastapi.responses import StreamingResponse
    from core.database import SessionLocal

    q: "queue.Queue" = queue.Queue()
    holder = {}

    def worker():
        db = SessionLocal()
        try:
            holder["result"] = run_showrunner(goal, db, step_cb=lambda m: q.put({"type": "step", "message": m}))
        except Exception as e:
            holder["result"] = {"status": "error", "message": str(e)}
        finally:
            db.close()
            q.put(None)  # sentinel

    threading.Thread(target=worker, daemon=True).start()

    def gen():
        while True:
            item = q.get()
            if item is None:
                break
            yield f"data: {_json.dumps(item)}\n\n"
        yield f"data: {_json.dumps({'type': 'done', 'result': holder.get('result')})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@router.post("/dev/seed-sample-script")
def seed_sample_script(db: Session = Depends(get_db)):
    existing = db.query(DramaScript).filter(DramaScript.video_id == "SAMPLE_LAST_LETTER").first()
    if existing:
        return {"status": "success", "data": {"id": existing.id, "created": False}}
    rec = DramaScript(
        video_id="SAMPLE_LAST_LETTER",
        title=_SAMPLE_SCRIPT["title"],
        scene_description=_SAMPLE_SCRIPT["scene_description"],
        characters_identified=",".join(_SAMPLE_SCRIPT["characters_identified"]),
        script_content=json.dumps(_SAMPLE_SCRIPT),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"status": "success", "data": {"id": rec.id, "created": True}}
