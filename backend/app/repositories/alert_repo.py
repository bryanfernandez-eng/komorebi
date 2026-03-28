"""
Alert Repository — DB access layer for agent-generated alerts.
"""

from sqlalchemy.orm import Session
from app.models.orm import Alert, User


def get_alerts_for_user(db: Session, user_id: int, limit: int = 20) -> list[Alert]:
    """Return the most recent `limit` alerts for a user, newest-first."""
    return (
        db.query(Alert)
        .filter(Alert.user_id == user_id)
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )


def user_exists(db: Session, user_id: int) -> bool:
    return db.query(User.id).filter(User.id == user_id).first() is not None
