import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import engine, Base
import app.models.orm  # noqa: F401 — registers all ORM models with Base
from app.routers import checkin, assess


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (idempotent)
    Base.metadata.create_all(bind=engine)
    yield


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


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Meta"])
def health_check():
    return {"success": True, "data": {"status": "ok"}, "error": None}
