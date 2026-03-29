"""
Digest Service — generates a personalised weekly reflection for a student.

Called by:
  - GET /digest/{user_id}          (on-demand)
  - weekly_digest cron job         (every Sunday 08:00)

Uses the last 7 days of check-in data to find patterns, best/worst day,
and generate a compassionate Gemini summary.
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.orm import Checkin
from app.services.gemini_client import get_gemini_client
from app.config.settings import settings


@dataclass
class DigestResult:
    user_id: int
    digest: str
    best_day: str
    worst_day: str
    pattern: str
    generated_at: str


_DIGEST_PROMPT = """\
You are a compassionate, non-clinical peer support assistant reviewing a college student's week.

Their 7-day check-in data (mood/sleep/stress each scored 1-10):
{checkin_summary}

Best day: {best_day} (mood {best_mood}, sleep {best_sleep}, stress {best_stress})
Worst day: {worst_day} (mood {worst_mood}, sleep {worst_sleep}, stress {worst_stress})
Overall trend: {trend}

Write a warm, personal 2-3 sentence weekly reflection in {language_name}.
- Sound like a supportive friend finding "the silver lining", not a therapist
- Highlight one positive observation and one gentle pattern you noticed
- Do NOT mention scores, numbers, or data
- End with one encouraging sentence about the week ahead
"""

_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

_FALLBACK_DIGEST = (
    "This week had its ups and downs, and that's completely normal. "
    "You showed up every day, and that takes strength. "
    "The week ahead is a fresh start — take it one day at a time."
)
_FALLBACK_DIGEST_ES = (
    "Esta semana tuvo sus altibajos, y eso es completamente normal. "
    "Te presentaste cada día, y eso requiere fortaleza. "
    "La próxima semana es un nuevo comienzo — tómalo un día a la vez."
)


def generate_digest(db: Session, user_id: int) -> DigestResult:
    """
    Fetches the last 7 days of check-ins for a user and generates
    a Gemini-powered weekly reflection. Falls back gracefully if Gemini
    is unavailable.
    """
    cutoff = datetime.utcnow() - timedelta(days=7)
    rows = (
        db.query(Checkin)
        .filter(Checkin.user_id == user_id, Checkin.submitted_at >= cutoff)
        .order_by(Checkin.submitted_at.asc())
        .all()
    )

    if not rows:
        return DigestResult(
            user_id=user_id,
            digest="No check-in data found for this week.",
            best_day="N/A",
            worst_day="N/A",
            pattern="No data available.",
            generated_at=datetime.utcnow().isoformat(),
        )

    # ── Find best and worst days ──────────────────────────────────────────
    # Wellness score = mood + sleep - stress (higher is better)
    def wellness(row: Checkin) -> int:
        return row.mood + row.sleep - row.stress

    best_row  = max(rows, key=wellness)
    worst_row = min(rows, key=wellness)

    best_day  = best_row.submitted_at.strftime("%A")
    worst_day = worst_row.submitted_at.strftime("%A")

    # ── Detect overall trend ──────────────────────────────────────────────
    first_mood = rows[0].mood
    last_mood  = rows[-1].mood
    if last_mood > first_mood + 1:
        trend = "improving"
    elif last_mood < first_mood - 1:
        trend = "declining"
    else:
        trend = "stable"

    # ── Detect sleep-mood correlation pattern ─────────────────────────────
    low_sleep_days = [r for r in rows if r.sleep <= 4]
    if low_sleep_days:
        low_sleep_moods = sum(r.mood for r in low_sleep_days) / len(low_sleep_days)
        all_moods = sum(r.mood for r in rows) / len(rows)
        if low_sleep_moods < all_moods - 1:
            pattern = (
                f"Your mood on low-sleep days averaged {low_sleep_moods:.1f}/10 "
                f"vs {all_moods:.1f}/10 overall — sleep seems to affect how you feel."
            )
        else:
            pattern = f"Your mood stayed relatively consistent despite sleep variation this week."
    else:
        avg_mood = sum(r.mood for r in rows) / len(rows)
        pattern = f"You maintained solid sleep all week. Average mood: {avg_mood:.1f}/10."

    # ── Build check-in summary for Gemini ────────────────────────────────
    checkin_lines = []
    for row in rows:
        day = row.submitted_at.strftime("%A")
        checkin_lines.append(f"  {day}: mood={row.mood}, sleep={row.sleep}, stress={row.stress}")
    checkin_summary = "\n".join(checkin_lines)

    # ── Generate Gemini digest ────────────────────────────────────────────
    digest_en = _FALLBACK_DIGEST
    digest_es = _FALLBACK_DIGEST_ES

    if settings.gemini_api_key:
        try:
            client = get_gemini_client()

            prompt_en = _DIGEST_PROMPT.format(
                checkin_summary=checkin_summary,
                best_day=best_day,
                best_mood=best_row.mood,
                best_sleep=best_row.sleep,
                best_stress=best_row.stress,
                worst_day=worst_day,
                worst_mood=worst_row.mood,
                worst_sleep=worst_row.sleep,
                worst_stress=worst_row.stress,
                trend=trend,
                language_name="English",
            )
            digest_en = client.models.generate_content(
                model=settings.gemini_model, contents=prompt_en
            ).text.strip()

            prompt_es = _DIGEST_PROMPT.format(
                checkin_summary=checkin_summary,
                best_day=best_day,
                best_mood=best_row.mood,
                best_sleep=best_row.sleep,
                best_stress=best_row.stress,
                worst_day=worst_day,
                worst_mood=worst_row.mood,
                worst_sleep=worst_row.sleep,
                worst_stress=worst_row.stress,
                trend=trend,
                language_name="Spanish",
            )
            digest_es = client.models.generate_content(
                model=settings.gemini_model, contents=prompt_es
            ).text.strip()

        except Exception:
            pass  # fallback already set above

    return DigestResult(
        user_id=user_id,
        digest=digest_en,
        best_day=best_day,
        worst_day=worst_day,
        pattern=pattern,
        generated_at=datetime.utcnow().isoformat(),
    )
