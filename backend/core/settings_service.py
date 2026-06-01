"""
Runtime settings resolver. Reads admin-configurable values (model choices,
etc.) from the `app_settings` table, layered over config.DEFAULT_SETTINGS.

Cached in-process so agents can call get_settings() cheaply on every request;
the cache is refreshed whenever an admin updates a value via update_settings().
"""
from sqlalchemy.orm import Session

from . import config
from .database import SessionLocal
from .models import AppSetting

_cache: dict | None = None


def _load_from_db() -> dict:
    merged = dict(config.DEFAULT_SETTINGS)
    db = SessionLocal()
    try:
        for row in db.query(AppSetting).all():
            merged[row.key] = row.value
    except Exception:
        # If the DB is unavailable, fall back to defaults rather than crashing
        # the agent. Better a working demo on defaults than a 500.
        pass
    finally:
        db.close()
    return merged


def get_settings() -> dict:
    """Current effective settings (DB overrides on top of defaults)."""
    global _cache
    if _cache is None:
        _cache = _load_from_db()
    return _cache


def get(key: str) -> str | None:
    return get_settings().get(key)


def refresh() -> dict:
    """Invalidate and reload the cache. Call after writes."""
    global _cache
    _cache = _load_from_db()
    return _cache


def update_settings(db: Session, updates: dict) -> dict:
    """Upsert the given key/value settings, then refresh the cache.
    Only keys present in DEFAULT_SETTINGS are accepted (whitelist)."""
    for key, value in updates.items():
        if key not in config.DEFAULT_SETTINGS:
            continue
        row = db.query(AppSetting).filter(AppSetting.key == key).first()
        if row:
            row.value = str(value)
        else:
            db.add(AppSetting(key=key, value=str(value)))
    db.commit()
    return refresh()
