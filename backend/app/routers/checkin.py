"""
Router: /checkin  (POST)
        /history/{user_id}  (GET)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.schemas import CheckinCreate, CheckinResponse, HistoryResponse, CheckinRecord, UserProfileResponse
from app.repositories import checkin_repo
from app.models.orm import User

router = APIRouter(tags=["Check-In"])


# ─────────────────────────────────────────────────────────────────────────────
# POST /checkin
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/checkin",
    response_model=CheckinResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a daily check-in",
    description=(
        "Accepts mood / sleep / stress scores (1-10) and an optional text entry. "
        "Automatically updates the user's consecutive check-in streak."
    ),
)
def submit_checkin(
    payload: CheckinCreate,
    db: Session = Depends(get_db),
):
    # Guard: validate user exists before writing
    if not checkin_repo.user_exists(db, payload.user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {payload.user_id} not found.",
        )

    checkin = checkin_repo.create_checkin(db, payload)

    return CheckinResponse(
        success=True,
        checkin_id=checkin.id,
        message="Check-in recorded.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /history/{user_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/history/{user_id}",
    response_model=HistoryResponse,
    summary="Get last 7 days of check-ins",
    description=(
        "Returns up to 7 days of check-in records for the given user, "
        "ordered most-recent first."
    ),
)
def get_history(
    user_id: int,
    db: Session = Depends(get_db),
):
    if not checkin_repo.user_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found.",
        )

    rows = checkin_repo.get_last_n_checkins(db, user_id, days=7)

    checkins = [
        CheckinRecord(
            date=row.submitted_at.date().isoformat(),
            mood=row.mood,
            sleep=row.sleep,
            stress=row.stress,
            text_entry=row.text_entry,
        )
        for row in rows
    ]

    return HistoryResponse(user_id=user_id, checkins=checkins)


# ───────────────────────────────────────────────────────────────────────
# GET /profile/{user_id}
# ───────────────────────────────────────────────────────────────────────

@router.get(
    "/profile/{user_id}",
    response_model=UserProfileResponse,
    summary="Get user profile and streak",
    description="Returns the user's name, dorm floor, language preference, and consecutive check-in streak.",
)
def get_profile(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found.",
        )
    return UserProfileResponse(
        user_id=user.id,
        name=user.name,
        dorm_floor=user.dorm_floor,
        streak=user.consecutive_checkin_days or 0,
        language=user.language or "en",
    )
