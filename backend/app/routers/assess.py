"""
Router: POST /assess/{user_id}

Triggers the full 4-agent pipeline:
  Signal Agent + Context Agent → parallel
  Response Agent → sequential after both
  Trend Agent → A2A called by Response Agent if final_score > 70
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.config.database import get_db
from app.repositories.checkin_repo import user_exists
from app.agents.pipeline import run_pipeline

router = APIRouter(tags=["Assessment"])


# ── Response schema ────────────────────────────────────────────────────────────

class AssessmentResponse(BaseModel):
    user_id: int
    risk_score: int
    stress_multiplier: int
    final_score: int
    action_taken: str           # "none" | "nudge" | "full_outreach"
    message_en: Optional[str]
    message_es: Optional[str]
    prediction: Optional[str]
    counselor_flagged: bool
    trend_context: Optional[str]
    minimization_detected: bool


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "/assess/{user_id}",
    response_model=AssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger full agent assessment pipeline",
    description=(
        "Runs Signal Agent (LoopAgent) and Context Agent in parallel. "
        "If final_score > 70, calls Trend Agent (A2A) before generating "
        "a Gemini-powered outreach message. Writes Alert + optional "
        "CounselorFlag to the database. Returns the full assessment result."
    ),
)
async def assess_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    if not user_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found.",
        )

    result = await run_pipeline(db, user_id)

    return AssessmentResponse(
        user_id=result.user_id,
        risk_score=result.risk_score,
        stress_multiplier=result.stress_multiplier,
        final_score=result.final_score,
        action_taken=result.action_taken,
        message_en=result.message_en or None,
        message_es=result.message_es or None,
        prediction=result.prediction or None,
        counselor_flagged=result.counselor_flagged,
        trend_context=result.trend_context or None,
        minimization_detected=result.minimization_detected,
    )
