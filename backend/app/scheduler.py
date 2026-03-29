"""
Komorebi Scheduler — APScheduler cron jobs.

Jobs defined here (from architecture spec):

  1. silence_detection  — nightly at midnight (00:00)
     Find users who haven't checked in for 2+ days.
     Fire a gentle Gemini outreach (action_taken = "silence_outreach").
     Guard: skip if user already received a silence_outreach in the last 24hrs.

  2. weekly_digest      — every Sunday at 08:00   [stub — see digest.py ticket]
     For each active user, generate a Sunday reflection via Gemini.

Usage:
  The scheduler is started/stopped from app/main.py via the FastAPI lifespan hook.
  This keeps lifecycle tied to the server — no orphaned background threads.
"""

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config.database import SessionLocal
from app.models.orm import User, Alert
from app.services.gemini_client import get_gemini_client
from app.config.settings import settings

logger = logging.getLogger("komorebi.scheduler")

# ── Singleton scheduler instance ───────────────────────────────────────────────
scheduler = BackgroundScheduler(timezone="America/New_York")


# ──────────────────────────────────────────────────────────────────────────────
# Job 1 — Silence Detection  (nightly midnight)
# ──────────────────────────────────────────────────────────────────────────────

_SILENCE_PROMPT = """\
You are a compassionate peer support assistant.
A college student hasn't logged a check-in for the past {days} days.
Their name is not known to you.
Write a single warm, non-intrusive message in {language_name} — under 2 sentences.
Sound like a caring friend checking in, not a system notification.
Do NOT mention "check-in", "app", "data", or "login".
End with one gentle reminder that USF Counseling is available: (813) 974-2831.
"""


def _generate_silence_message(language: str, days_silent: int) -> tuple[str, str]:
    """Generate bilingual silence outreach via Gemini, or use fallback."""
    language_name_en = "English"
    language_name_es = "Spanish"
    fallback_en = (
        "Hey, we've been thinking about you and just wanted to check in. "
        "USF Counseling is always here if you need a chat: (813) 974-2831."
    )
    fallback_es = (
        "Oye, hemos estado pensando en ti y solo queríamos saludarte. "
        "Consejería de USF siempre está disponible: (813) 974-2831."
    )

    if not settings.gemini_api_key:
        return fallback_en, fallback_es

    try:
        client = get_gemini_client()
        prompt_en = _SILENCE_PROMPT.format(days=days_silent, language_name=language_name_en)
        prompt_es = _SILENCE_PROMPT.format(days=days_silent, language_name=language_name_es)
        msg_en = client.models.generate_content(model="gemini-2.0-flash", contents=prompt_en).text.strip()
        msg_es = client.models.generate_content(model="gemini-2.0-flash", contents=prompt_es).text.strip()
        return msg_en, msg_es
    except Exception as exc:
        logger.warning("Gemini unavailable for silence outreach, using fallback: %s", exc)
        return fallback_en, fallback_es


def silence_detection() -> None:
    """
    Nightly job — finds silent users and fires gentle outreach.

    Silent = last_checkin_date is None or more than 2 days ago.
    Guard  = skip if a silence_outreach alert was already sent in the last 24hrs
             (prevents spam if the server restarts or the job fires twice).
    """
    logger.info("[silence_detection] Starting job at %s", datetime.now().isoformat())
    db = SessionLocal()
    fired = 0

    try:
        cutoff_date    = (datetime.now() - timedelta(days=2)).date()
        cutoff_24h_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)

        # Users whose last check-in was 2+ days ago (or never)
        silent_users = (
            db.query(User)
            .filter(
                (User.last_checkin_date == None) |          # noqa: E711
                (User.last_checkin_date <= cutoff_date)
            )
            .all()
        )

        for user in silent_users:
            # Guard: already sent a silence_outreach in the last 24 hrs?
            recent_silence = (
                db.query(Alert)
                .filter(
                    Alert.user_id == user.id,
                    Alert.action_taken == "silence_outreach",
                    Alert.created_at >= cutoff_24h_ago,
                )
                .first()
            )
            if recent_silence:
                logger.debug(
                    "[silence_detection] Skipping user %d — already outreached today", user.id
                )
                continue

            # Calculate days silent
            if user.last_checkin_date:
                days_silent = (datetime.now().date() - user.last_checkin_date).days
            else:
                days_silent = 3  # default for never-checked-in users

            # Generate message
            msg_en, msg_es = _generate_silence_message(user.language or "en", days_silent)

            # Write Alert
            alert = Alert(
                user_id=user.id,
                action_taken="silence_outreach",
                message_en=msg_en,
                message_es=msg_es,
                counselor_flagged=False,
                minimization_detected=False,
            )
            db.add(alert)
            fired += 1
            logger.info(
                "[silence_detection] Outreach queued for user %d (%d days silent)",
                user.id, days_silent
            )

        db.commit()
        logger.info("[silence_detection] Done — %d outreach(es) sent.", fired)

    except Exception as exc:
        db.rollback()
        logger.error("[silence_detection] Job failed: %s", exc, exc_info=True)
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────────────────────
# Job 2 — Weekly Digest  (every Sunday 08:00 ET)  — stub until digest ticket
# ──────────────────────────────────────────────────────────────────────────────

def weekly_digest() -> None:
    """
    Sunday 08:00 — generates a personalised weekly reflection for each active user.
    Full implementation lives in the digest ticket; this stub logs and no-ops.
    """
    logger.info("[weekly_digest] Job triggered at %s — digest not yet implemented.", datetime.now().isoformat())


# ──────────────────────────────────────────────────────────────────────────────
# Register jobs
# ──────────────────────────────────────────────────────────────────────────────

def register_jobs() -> None:
    """Add all cron jobs to the scheduler. Called once during app startup."""

    # Job 1 — silence detection: nightly at 00:00 ET
    scheduler.add_job(
        silence_detection,
        trigger=CronTrigger(hour=0, minute=0, timezone="America/New_York"),
        id="silence_detection",
        name="Nightly Silence Detection",
        replace_existing=True,
        misfire_grace_time=3600,   # tolerate up to 1hr late start (e.g. after deploy)
    )

    # Job 2 — weekly digest: every Sunday at 08:00 ET
    scheduler.add_job(
        weekly_digest,
        trigger=CronTrigger(day_of_week="sun", hour=8, minute=0, timezone="America/New_York"),
        id="weekly_digest",
        name="Sunday Weekly Digest",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    logger.info("[scheduler] Jobs registered: silence_detection (00:00), weekly_digest (Sun 08:00)")


def start() -> None:
    """Start the APScheduler background thread."""
    register_jobs()
    scheduler.start()
    logger.info("[scheduler] APScheduler started.")


def stop() -> None:
    """Gracefully shut down the scheduler (called on app shutdown)."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[scheduler] APScheduler stopped.")
