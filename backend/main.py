from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from core.database import engine, Base
from core import config

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AK_Productions Studio OS")

# Explicit origin list — "*" with allow_credentials=True is rejected by browsers.
# Configure via the CORS_ORIGINS env var (comma-separated).
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.on_event("startup")
def _startup():
    # Optional in-process daily Studio Intelligence brief (off by default).
    from core.scheduler import start_scheduler
    start_scheduler()

@app.get("/")
def read_root():
    return {"message": "Welcome to AK_Productions API"}
