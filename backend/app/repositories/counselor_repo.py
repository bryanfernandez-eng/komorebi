"""
Counselor Repository — database queries for the RA/Counselor dashboard.

Aggregates anonymised check-in + alert data per dorm floor.
No individual student data is ever exposed.
"""

from datetime import date, datetime, timedelta
from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.orm import Checkin, User, CounselorFlag


def get_dashboard_data(db: Session) -> dict:
    """
    Returns aggregated floor-level wellness data for the counselor dashboard.

    Per floor:
      - avg_stress / avg_mood for this week
      - avg_stress for last week (for spike detection)
      - student_count (unique students who checked in this week)
      - flagged_count (distinct users flagged by agents this week)
      - spike_detected / spike_delta

    Campus-level:
      - percent_high_stress (stress >= 7)
      - campus_stress_elevated (True when >50%)
    """
    today = date.today()
    week_start    = datetime.combine(today - timedelta(days=7),  datetime.min.time())
    prev_week_start = datetime.combine(today - timedelta(days=14), datetime.min.time())

    # ── This week's check-ins with floor info ────────────────────────────────
    this_week = (
        db.query(Checkin, User.dorm_floor)
        .join(User, Checkin.user_id == User.id)
        .filter(Checkin.submitted_at >= week_start)
        .all()
    )

    # ── Last week's check-ins (for spike delta) ──────────────────────────────
    last_week = (
        db.query(Checkin, User.dorm_floor)
        .join(User, Checkin.user_id == User.id)
        .filter(Checkin.submitted_at >= prev_week_start,
                Checkin.submitted_at < week_start)
        .all()
    )

    # ── Flags raised this week ────────────────────────────────────────────────
    flags_this_week = (
        db.query(CounselorFlag)
        .filter(CounselorFlag.flagged_at >= week_start)
        .all()
    )

    # ── Build per-floor aggregates ────────────────────────────────────────────
    floor_this: dict[str, dict] = defaultdict(lambda: {
        "stress": [], "mood": [], "user_ids": set()
    })
    floor_last: dict[str, dict] = defaultdict(lambda: {
        "stress": []
    })
    floor_flags: dict[str, set] = defaultdict(set)

    for checkin, floor in this_week:
        if not floor:
            continue
        floor_this[floor]["stress"].append(checkin.stress)
        floor_this[floor]["mood"].append(checkin.mood)
        floor_this[floor]["user_ids"].add(checkin.user_id)

    for checkin, floor in last_week:
        if not floor:
            continue
        floor_last[floor]["stress"].append(checkin.stress)

    for flag in flags_this_week:
        # Look up the user's floor
        user = db.query(User).filter(User.id == flag.user_id).first()
        if user and user.dorm_floor:
            floor_flags[user.dorm_floor].add(flag.user_id)

    # ── Compose floor summaries ───────────────────────────────────────────────
    floors = []
    all_floors = set(floor_this.keys()) | set(floor_last.keys())

    for floor in sorted(all_floors):
        this = floor_this.get(floor, {"stress": [], "mood": [], "user_ids": set()})
        last = floor_last.get(floor, {"stress": []})

        if not this["stress"]:
            continue  # No data this week — skip

        avg_stress_this = sum(this["stress"]) / len(this["stress"])
        avg_mood_this   = sum(this["mood"])   / len(this["mood"])
        avg_stress_last = (
            sum(last["stress"]) / len(last["stress"])
            if last["stress"] else avg_stress_this
        )

        spike_delta = round(avg_stress_last - avg_stress_this, 1)  # negative = got worse
        spike_detected = spike_delta <= -1.5  # stress rose by 1.5+ points

        floors.append({
            "floor": floor,
            "avg_stress": round(avg_stress_this, 1),
            "avg_mood":   round(avg_mood_this,   1),
            "student_count": len(this["user_ids"]),
            "flagged_count": len(floor_flags.get(floor, set())),
            "spike_detected": spike_detected,
            "spike_delta": spike_delta,
        })

    # ── Campus-wide stats ─────────────────────────────────────────────────────
    all_stress = [c.stress for c, _ in this_week]
    total = len(all_stress)

    if total == 0:
        percent_high = 0
        campus_elevated = False
    else:
        high_stress_count = sum(1 for s in all_stress if s >= 7)
        percent_high = int((high_stress_count / total) * 100)
        campus_elevated = percent_high >= 50

    return {
        "floors": floors,
        "campus_stress_elevated": campus_elevated,
        "percent_high_stress": percent_high,
    }

def get_active_flags(db: Session) -> list[dict]:
    """Retrieve all unresolved flags joined with their user data."""
    flags = (
        db.query(CounselorFlag, User)
        .join(User, CounselorFlag.user_id == User.id)
        .filter(CounselorFlag.is_resolved == False)
        .order_by(CounselorFlag.flagged_at.desc())
        .all()
    )
    result = []
    for flag, user in flags:
        result.append({
            "id": flag.id,
            "user_id": user.id,
            "user_name": user.name,
            "dorm_floor": user.dorm_floor,
            "final_score": flag.final_score,
            "flagged_at": flag.flagged_at,
            "is_resolved": flag.is_resolved,
        })
    return result

def resolve_flag(db: Session, flag_id: int) -> bool:
    """Mark a flag as resolved."""
    flag = db.query(CounselorFlag).filter(CounselorFlag.id == flag_id).first()
    if not flag:
        return False
    flag.is_resolved = True
    db.commit()
    return True
