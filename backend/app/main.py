import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import engine, Base
import app.models.orm  # noqa: F401 — registers all ORM models with Base
from app.routers import checkin, assess, alerts, counselor, digest, admin, usf
from app import scheduler as job_scheduler
from app.config.settings import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("komorebi.startup")


def _print_agent_tree() -> None:
    """Print the ADK agent tree to the console on startup."""
    lines = [
        "",
        "  ┌─ ADK Pipeline ─────────────────────────────────────────────┐",
        "  │                                                             │",
        "  │  ParallelAgent('ParallelAnalysis')                         │",
        "  │    ├── LoopAgent('SignalLoop', max_iterations=3)           │",
        "  │    │     └── SignalIterationAgent   [BaseAgent]            │",
        "  │    │           loop 1: mood only    → confidence 0.55      │",
        "  │    │           loop 2: + sleep      → confidence 0.72      │",
        "  │    │           loop 3: + stress+text → confidence 0.89     │",
        "  │    │                                                        │",
        "  │    └── KomorebiContextAgent         [BaseAgent]            │",
        "  │          reads calendar_data.json, computes multiplier     │",
        "  │                                                             │",
        "  │  KomorebiResponseAgent              [BaseAgent]            │",
        "  │    └── A2A → KomorebiTrendAgent     [BaseAgent]            │",
        "  │              (only when final_score > 70)                  │",
        "  │                                                             │",
        "  └─────────────────────────────────────────────────────────────┘",
        "",
    ]
    for line in lines:
        logger.info(line)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (idempotent)
    Base.metadata.create_all(bind=engine)

    # Print agent tree
    _print_agent_tree()

    # Log Gemini status
    if settings.gemini_api_key:
        logger.info("Gemini API key loaded — model: %s", settings.gemini_model)
    else:
        logger.warning("GEMINI_API_KEY not set — Gemini calls will use fallback messages")

    # Log scheduler jobs
    logger.info("Scheduler jobs: silence_detection (00:00 ET), weekly_digest (Sun 08:00 ET)")

    # Start background cron jobs
    job_scheduler.start()
    yield
    # Graceful shutdown
    job_scheduler.stop()


app = FastAPI(title="Komorebi API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(checkin.router)
app.include_router(assess.router)
app.include_router(alerts.router)
app.include_router(counselor.router)
app.include_router(digest.router)
app.include_router(admin.router)
app.include_router(usf.router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Meta"])
def health_check():
    return {"success": True, "data": {"status": "ok"}, "error": None}
