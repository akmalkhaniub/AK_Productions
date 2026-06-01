"""
Optional in-process daily scheduler for the Studio Intelligence brief.

Enabled with INTEL_DAILY_ENABLED=true. Runs a brief for every connected
account at INTEL_DAILY_HOUR (server local time) and delivers it.

For production (esp. multi-instance / serverless like Cloud Run) prefer an
external trigger — GCP Cloud Scheduler hitting POST /api/intel/run — instead
of an in-process scheduler.
"""
from core import config


def _daily_job():
    # Imported lazily to avoid a circular import with api.routes at startup.
    from api.routes import run_and_store_brief
    from core.database import SessionLocal
    from core.models import ConnectedAccount

    db = SessionLocal()
    try:
        accounts = db.query(ConnectedAccount).all()
        for account in accounts:
            try:
                run_and_store_brief(db, channels=[], account_id=account.id, deliver=True)
            except Exception as e:
                print(f"[intel scheduler] account {account.id} failed: {e}")
    finally:
        db.close()


def start_scheduler():
    if not config.INTEL_DAILY_ENABLED:
        return None
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(_daily_job, "cron", hour=config.INTEL_DAILY_HOUR, id="intel_daily")
    scheduler.start()
    print(f"[intel scheduler] daily brief scheduled at {config.INTEL_DAILY_HOUR}:00 server time")
    return scheduler
