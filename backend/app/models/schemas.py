from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Check-In ──────────────────────────────────────────────────────────────────

class CheckinCreate(BaseModel):
    """Body for POST /checkin"""
    user_id: int
    mood: int = Field(..., ge=1, le=10, description="Mood score 1-10")
    sleep: int = Field(..., ge=1, le=10, description="Sleep quality 1-10")
    stress: int = Field(..., ge=1, le=10, description="Stress level 1-10")
    text_entry: Optional[str] = Field(None, max_length=1000)
    language: Optional[str] = Field("en", pattern="^[a-z]{2}$")


class CheckinResponse(BaseModel):
    """Response for POST /checkin"""
    success: bool
    checkin_id: int
    message: str

    model_config = {"from_attributes": True}


# ── History ───────────────────────────────────────────────────────────────────

class CheckinRecord(BaseModel):
    """A single check-in entry returned inside history."""
    date: str           # ISO date string e.g. "2026-03-22"
    mood: int
    sleep: int
    stress: int
    text_entry: Optional[str] = None

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    """Response for GET /history/{user_id}"""
    user_id: int
    checkins: list[CheckinRecord]


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertRecord(BaseModel):
    """A single agent-generated alert returned inside the alerts list."""
    id: int
    risk_score: Optional[int] = None
    stress_multiplier: Optional[int] = None
    final_score: Optional[int] = None
    action_taken: Optional[str] = None
    message_en: Optional[str] = None
    message_es: Optional[str] = None
    prediction: Optional[str] = None
    counselor_flagged: bool
    minimization_detected: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertsResponse(BaseModel):
    """Response for GET /alerts/{user_id}"""
    user_id: int
    alerts: list[AlertRecord]
