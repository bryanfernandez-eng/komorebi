"""
Router: GET /digest/{user_id}

Returns a Gemini-generated weekly reflection for a student.
Includes best day, worst day, sleep-mood pattern, and a warm narrative summary.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.config.database import get_db
from app.repositories.checkin_repo import user_exists
from app.services.digest_service import generate_digest

router = APIRouter(tags=["Digest"])


class DigestResponse(BaseModel):
    user_id: int
    digest: str
    best_day: str
    worst_day: str
    pattern: str
    generated_at: str


@router.get(
    "/digest/{user_id}",
    response_model=DigestResponse,
    summary="Get weekly Gemini digest for a student",
    description=(
        "Generates a personalised weekly reflection based on the last 7 days of "
        "check-in data. Identifies best/worst day, sleep-mood pattern, and produces "
        "a warm Gemini-written narrative. Falls back to deterministic text if Gemini "
        "is unavailable."
    ),
)
def get_digest(
    user_id: int,
    db: Session = Depends(get_db),
):
    if not user_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found.",
        )

    result = generate_digest(db, user_id)

    return DigestResponse(
        user_id=result.user_id,
        digest=result.digest,
        best_day=result.best_day,
        worst_day=result.worst_day,
        pattern=result.pattern,
        generated_at=result.generated_at,
    )
