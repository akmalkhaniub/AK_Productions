from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="In Development")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scripts = relationship("Script", back_populates="project")
    logs = relationship("AgentLog", back_populates="project")

class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    filename = Column(String)
    content = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="scripts")

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    agent_name = Column(String) # e.g., "Script Breakdown", "Acting Coach"
    action = Column(String)
    result_data = Column(Text) # Stored as JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="logs")

class AppSetting(Base):
    """Key/value store for admin-configurable runtime settings (e.g. which
    model each agent uses). Read through settings_service, which caches and
    falls back to config.DEFAULT_SETTINGS."""
    __tablename__ = "app_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class DramaScript(Base):
    __tablename__ = "drama_scripts"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(String, index=True, unique=True)
    title = Column(String)
    scene_description = Column(Text)
    characters_identified = Column(String) # Stored as comma separated string
    script_content = Column(Text) # Stored as JSON string of the structured script
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ConnectedAccount(Base):
    """A user's connected Google/YouTube account for the Studio Intelligence
    agent. Stores OAuth tokens so we can read their subscriptions.

    NOTE: tokens are stored as-is for the MVP. Before any public launch,
    encrypt them at rest and complete Google's OAuth verification for the
    restricted youtube.readonly scope."""
    __tablename__ = "connected_accounts"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, default="google")
    google_sub = Column(String, index=True, unique=True)  # stable Google user id
    email = Column(String)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expiry = Column(DateTime, nullable=True)
    # Delivery preferences
    notify_email = Column(String, nullable=True)
    slack_webhook = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class IntelBrief(Base):
    """A generated daily Studio Intelligence brief."""
    __tablename__ = "intel_briefs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("connected_accounts.id"), nullable=True)
    headline = Column(String)
    content = Column(Text)  # JSON string: { headline, sections[], agent_trace[] }
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Series(Base):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    episodes = relationship("SeriesEpisode", back_populates="series", cascade="all, delete-orphan")
    lore_items = relationship("SeriesLore", back_populates="series", cascade="all, delete-orphan")


class SeriesEpisode(Base):
    __tablename__ = "series_episodes"

    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(Integer, ForeignKey("series.id"), nullable=False)
    episode_number = Column(Integer, nullable=False)
    video_id = Column(String, nullable=True)
    title = Column(String, nullable=True)
    script_content = Column(Text, nullable=True) # JSON string of the structured script
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    series = relationship("Series", back_populates="episodes")


class SeriesLore(Base):
    __tablename__ = "series_lore"

    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(Integer, ForeignKey("series.id"), nullable=False)
    category = Column(String)  # e.g., "character", "prop", "timeline", "geography"
    entity_name = Column(String, index=True)  # e.g. "Ayesha", "Pocket Watch"
    lore_description = Column(Text)
    source_episodes = Column(String)  # Comma-separated list of episode numbers
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    series = relationship("Series", back_populates="lore_items")


class ScriptAnnotation(Base):
    __tablename__ = "script_annotations"

    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("drama_scripts.id"), nullable=False)
    line_index = Column(Integer, nullable=False)
    category = Column(String)  # e.g., "dialogue", "topography"
    author = Column(String)  # e.g., "User", "AI Acting Coach", "AI Continuity Agent"
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
