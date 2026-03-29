"""
Router: GET /alerts/{user_id}

Returns the agent-generated alert history for a given student.
Most recent alerts first. Matches architecture.md spec exactly.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.schemas import AlertsResponse, AlertRecord
from app.repositories import alert_repo

router = APIRouter(tags=["Alerts"])


@router.get(
    "/alerts/{user_id}",
    response_model=AlertsResponse,
    summary="Get alert history for a user",
    description=(
        "Returns all agent-generated alerts for the given user, "
        "ordered most-recent first. Includes the Gemini-written messages "
        "and all scoring metadata from the assessment pipeline."
    ),
)
def get_alerts(
    user_id: int,
    db: Session = Depends(get_db),
):
    if not alert_repo.user_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found.",
        )

    rows = alert_repo.get_alerts_for_user(db, user_id)

    alerts = [
        AlertRecord(
            id=row.id,
            risk_score=row.risk_score,
            stress_multiplier=row.stress_multiplier,
            final_score=row.final_score,
            action_taken=row.action_taken,
            message_en=row.message_en,
            message_es=row.message_es,
            prediction=row.prediction,
            trend_context=row.trend_context,
            counselor_flagged=bool(row.counselor_flagged),
            minimization_detected=bool(row.minimization_detected),
            created_at=row.created_at,
        )
        for row in rows
    ]

    return AlertsResponse(user_id=user_id, alerts=alerts)
