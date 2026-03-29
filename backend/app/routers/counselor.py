"""
Router: GET /counselor/dashboard

Provides anonymised, floor-level wellness data for RAs and counselors.
No individual student data is exposed — all data is aggregated by dorm floor.

Response includes:
  - Per-floor: avg stress/mood, student count, agent flags, spike detection
  - Campus-wide: % high stress, elevated flag
  - Upcoming academic event overlay (from calendar_data.json)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.schemas import (
    CounselorDashboardResponse, 
    FloorSummary, 
    CounselorFlagListResponse, 
    CounselorFlagResponse
)
from app.repositories import counselor_repo
from app.agents.context_agent import run_context_agent

router = APIRouter(tags=["Counselor"])


@router.get(
    "/counselor/dashboard",
    response_model=CounselorDashboardResponse,
    summary="Anonymised counselor wellness dashboard",
    description=(
        "Returns aggregated, anonymised wellness data grouped by dorm floor. "
        "Includes stress spike detection, agent-flag counts, campus-wide stress "
        "percentage, and the nearest upcoming academic stressor from the calendar. "
        "No individual student identifiers are included."
    ),
)
def get_counselor_dashboard(
    db: Session = Depends(get_db),
):
    # ── Aggregate floor + campus data from DB ─────────────────────────────────
    data = counselor_repo.get_dashboard_data(db)

    # ── Pull upcoming academic event from Context Agent ───────────────────────
    # Reuse the same calendar logic the Context Agent uses — no duplication
    context = run_context_agent()
    if context.days_until <= 7:
        upcoming_event = context.label
    else:
        upcoming_event = None

    # ── Build floor summaries ─────────────────────────────────────────────────
    floors = [
        FloorSummary(
            floor=f["floor"],
            avg_stress=f["avg_stress"],
            avg_mood=f["avg_mood"],
            student_count=f["student_count"],
            flagged_count=f["flagged_count"],
            spike_detected=f["spike_detected"],
            spike_delta=f["spike_delta"],
        )
        for f in data["floors"]
    ]

    return CounselorDashboardResponse(
        floors=floors,
        campus_stress_elevated=data["campus_stress_elevated"],
        percent_high_stress=data["percent_high_stress"],
        upcoming_event=upcoming_event,
    )


@router.get(
    "/counselor/flags",
    response_model=CounselorFlagListResponse,
    summary="List active counselor flags",
    description="Returns a list of all unresolved flags that need counselor attention.",
)
def get_counselor_flags(db: Session = Depends(get_db)):
    flags_data = counselor_repo.get_active_flags(db)
    return CounselorFlagListResponse(flags=flags_data)


@router.post(
    "/counselor/flags/{flag_id}/resolve",
    summary="Resolve a counselor flag",
    description="Marks a specific flag as resolved by a counselor.",
)
def resolve_counselor_flag(flag_id: int, db: Session = Depends(get_db)):
    success = counselor_repo.resolve_flag(db, flag_id)
    return {"success": success}
