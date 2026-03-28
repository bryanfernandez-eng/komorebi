"""
Trend Agent — A2A Specialist

Triggered by: Response Agent via A2A when final_score > 70
Input:  current_date + anonymised population check-in data from DB
Logic:  Queries campus-wide check-in averages for the current week
        and determines whether the student's decline is unusual or
        matches a campus-wide pattern.
Output: PopulationContext dict
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session
from app.models.orm import Checkin


@dataclass
class PopulationContext:
    campus_stress_elevated: bool
    percent_high_stress: int
    context: str
    student_decline_unusual: bool


def run_trend_agent(db: Session, current_date: date | None = None) -> PopulationContext:
    """
    A2A Trend Agent — called by Response Agent when final_score > 70.
    Queries anonymised campus-wide data to provide population context.
    """
    if current_date is None:
        current_date = date.today()

    week_start = datetime.combine(current_date - timedelta(days=7), datetime.min.time())

    # ── Query anonymised population check-ins ─────────────────────────────
    recent = (
        db.query(Checkin)
        .filter(Checkin.submitted_at >= week_start)
        .all()
    )

    total = len(recent)

    if total == 0:
        return PopulationContext(
            campus_stress_elevated=False,
            percent_high_stress=0,
            context="Insufficient campus data to determine population trends.",
            student_decline_unusual=True,
        )

    # High stress = stress score >= 7
    high_stress_count = sum(1 for c in recent if c.stress >= 7)
    percent_high = int((high_stress_count / total) * 100)
    campus_elevated = percent_high >= 50

    # Campus avg mood
    avg_mood = sum(c.mood for c in recent) / total
    avg_stress = sum(c.stress for c in recent) / total

    # Student's decline is unusual if campus is doing well (not elevated)
    student_decline_unusual = not campus_elevated

    if campus_elevated:
        context = (
            f"Campus stress is elevated this week — {percent_high}% of students "
            f"reporting high stress (avg stress: {avg_stress:.1f}/10). "
            f"You are not alone in what you're feeling."
        )
    else:
        context = (
            f"Most students are managing okay this week "
            f"({percent_high}% reporting high stress, avg mood: {avg_mood:.1f}/10). "
            f"Your experience may benefit from additional personal support."
        )

    return PopulationContext(
        campus_stress_elevated=campus_elevated,
        percent_high_stress=percent_high,
        context=context,
        student_decline_unusual=student_decline_unusual,
    )
