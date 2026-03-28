"""
Checkin Repository — database access layer for check-in operations.
Keeping DB queries out of the router keeps routes thin and testable.
"""

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from app.models.orm import Checkin, User
from app.models.schemas import CheckinCreate


# ── Writes ────────────────────────────────────────────────────────────────────

def create_checkin(db: Session, data: CheckinCreate) -> Checkin:
    """Insert a new check-in row and update the user's streak counter."""
    checkin = Checkin(
        user_id=data.user_id,
        mood=data.mood,
        sleep=data.sleep,
        stress=data.stress,
        text_entry=data.text_entry,
    )
    db.add(checkin)

    # Update the consecutive check-in streak on the user row
    _update_streak(db, data.user_id)

    db.commit()
    db.refresh(checkin)
    return checkin


def _update_streak(db: Session, user_id: int) -> None:
    """Increment streak if user checked in yesterday; reset otherwise."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return

    today = date.today()
    yesterday = today - timedelta(days=1)

    if user.last_checkin_date == yesterday:
        user.consecutive_checkin_days = (user.consecutive_checkin_days or 0) + 1
    elif user.last_checkin_date != today:
        # Gap of more than one day → reset streak
        user.consecutive_checkin_days = 1

    user.last_checkin_date = today


# ── Reads ─────────────────────────────────────────────────────────────────────

def get_last_n_checkins(db: Session, user_id: int, days: int = 7) -> list[Checkin]:
    """Return the most recent `days` check-ins for a user, newest-first."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(Checkin)
        .filter(Checkin.user_id == user_id, Checkin.submitted_at >= cutoff)
        .order_by(Checkin.submitted_at.desc())
        .limit(days)
        .all()
    )


def user_exists(db: Session, user_id: int) -> bool:
    return db.query(User.id).filter(User.id == user_id).first() is not None
