"""
Komorebi — Database Seed Script
Populates demo users and check-in data for hackathon demo.

Users (from architecture.md):
  user_id 1 — Alex Rivera   | Floor 3 - Cypress Hall | en  | Declining (demo hero)
  user_id 2 — Maria Lopez   | Floor 3 - Cypress Hall | es  | Spanish demo user
  user_id 3 — Jordan Kim    | Floor 2 - Oak Hall     | en  | Stable (contrast user)

Run from backend/ directory:
  python -m backend.seed
Or from the project root:
  python seed.py  (after adjusting the import path)
"""

import sys
import os
from datetime import date, datetime, timedelta

# Allow running from the project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, SessionLocal, Base
from backend import models  # noqa: F401  — registers all ORM models

# ── Create all tables ────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # ── Guard: skip if already seeded ──────────────────────────────────
        if db.query(models.User).count() > 0:
            print("✅ Database already seeded — skipping.")
            return

        today = date.today()

        # ──────────────────────────────────────────────────────────────────────
        # USERS
        # ──────────────────────────────────────────────────────────────────────
        alex = models.User(
            id=1,
            name="Alex Rivera",
            email="alex.rivera@usf.edu",
            language="en",
            dorm_floor="Floor 3 - Cypress Hall",
            consecutive_checkin_days=7,
            last_checkin_date=today,
        )
        maria = models.User(
            id=2,
            name="Maria Lopez",
            email="maria.lopez@usf.edu",
            language="es",
            dorm_floor="Floor 3 - Cypress Hall",
            consecutive_checkin_days=5,
            last_checkin_date=today,
        )
        jordan = models.User(
            id=3,
            name="Jordan Kim",
            email="jordan.kim@usf.edu",
            language="en",
            dorm_floor="Floor 2 - Oak Hall",
            consecutive_checkin_days=5,
            last_checkin_date=today,
        )

        db.add_all([alex, maria, jordan])
        db.flush()  # flush so IDs are available for FK references

        # ──────────────────────────────────────────────────────────────────────
        # ALEX — 7-day DECLINING arc (demo hero)
        # Mood:  7 → 4  (steady drop)
        # Sleep: 7 → 4  (degrading)
        # Stress:3 → 9  (sharply rising)
        # Day 5 text: minimisation detected → signals discrepancy
        # ──────────────────────────────────────────────────────────────────────
        alex_checkins = [
            # day_offset, mood, sleep, stress, text_entry
            (-6, 7, 7, 3, None),
            (-5, 6, 6, 4, "A little tired but managing okay."),
            (-4, 6, 5, 5, None),
            (-3, 5, 5, 7, "Things are piling up a bit."),
            (-2, 5, 4, 8, "I'm fine, just busy."),   # minimisation — says fine but scores say otherwise
            (-1, 4, 4, 9, "Honestly stressed but whatever, everyone is."),
            ( 0, 4, 4, 9, "Super stressed about midterms. Can't sleep."),
        ]

        for day_offset, mood, sleep, stress, text in alex_checkins:
            submitted = datetime.combine(today + timedelta(days=day_offset), datetime.min.time()).replace(hour=9)
            db.add(models.Checkin(
                user_id=alex.id,
                mood=mood,
                sleep=sleep,
                stress=stress,
                text_entry=text,
                submitted_at=submitted,
            ))

        # ──────────────────────────────────────────────────────────────────────
        # MARIA — 7-day moderately stressed arc (Spanish user)
        # Mood:  6 → 5, Sleep: 6 → 5, Stress: 5 → 7
        # ──────────────────────────────────────────────────────────────────────
        maria_checkins = [
            (-6, 6, 6, 5, None),
            (-5, 6, 6, 5, "Todo bien por ahora."),
            (-4, 5, 6, 6, None),
            (-3, 5, 5, 6, "Hay mucho por hacer esta semana."),
            (-2, 5, 5, 7, None),
            (-1, 5, 5, 7, "Estresada pero sobreviviendo."),
            ( 0, 5, 5, 7, None),
        ]

        for day_offset, mood, sleep, stress, text in maria_checkins:
            submitted = datetime.combine(today + timedelta(days=day_offset), datetime.min.time()).replace(hour=9, minute=30)
            db.add(models.Checkin(
                user_id=maria.id,
                mood=mood,
                sleep=sleep,
                stress=stress,
                text_entry=text,
                submitted_at=submitted,
            ))

        # ──────────────────────────────────────────────────────────────────────
        # JORDAN — 7-day STABLE arc (contrast user — doing well)
        # Mood:  7 → 8, Sleep: 7 → 8, Stress: 3 → 3
        # ──────────────────────────────────────────────────────────────────────
        jordan_checkins = [
            (-6, 7, 7, 3, None),
            (-5, 7, 7, 3, "Good week so far."),
            (-4, 8, 7, 3, None),
            (-3, 7, 8, 4, "A bit of pressure but nothing too bad."),
            (-2, 8, 8, 3, None),
            (-1, 8, 7, 3, "Feeling solid, managed to prep ahead for midterms."),
            ( 0, 8, 8, 3, None),
        ]

        for day_offset, mood, sleep, stress, text in jordan_checkins:
            submitted = datetime.combine(today + timedelta(days=day_offset), datetime.min.time()).replace(hour=8, minute=45)
            db.add(models.Checkin(
                user_id=jordan.id,
                mood=mood,
                sleep=sleep,
                stress=stress,
                text_entry=text,
                submitted_at=submitted,
            ))

        # ──────────────────────────────────────────────────────────────────────
        # Pre-seed a past alert for Alex (simulates a previous assessment)
        # Demonstrates the alerts table is in use for the demo
        # ──────────────────────────────────────────────────────────────────────
        alex_alert = models.Alert(
            user_id=alex.id,
            risk_score=68,
            stress_multiplier=25,
            final_score=93,
            action_taken="full_outreach",
            message_en=(
                "Hey, this week sounds really heavy — you're not alone in this. "
                "67% of campus is feeling the pressure right now with midterms coming up. "
                "When you're ready, USF Counseling is one tap away: (813) 974-2831."
            ),
            message_es=(
                "Hola, esta semana suena muy difícil — no estás solo/a en esto. "
                "El 67% del campus está sintiendo la presión con los parciales. "
                "Cuando estés listo/a, Consejería de USF está a un toque: (813) 974-2831."
            ),
            prediction=(
                "Based on your pattern and Midterm Week starting in 2 days, "
                "this week may be especially challenging."
            ),
            counselor_flagged=True,
            minimization_detected=True,
            created_at=datetime.combine(today - timedelta(days=1), datetime.min.time()).replace(hour=14, minute=30),
        )
        db.add(alex_alert)
        db.flush()

        # ── Counselor flag that matches the alert ──────────────────────────
        db.add(models.CounselorFlag(
            user_id=alex.id,
            dorm_floor=alex.dorm_floor,
            final_score=93,
            flagged_at=alex_alert.created_at,
        ))

        db.commit()
        print("🌿 Komorebi database seeded successfully!")
        print(f"   → Alex Rivera   (id=1) — 7-day declining arc seeded")
        print(f"   → Maria Lopez   (id=2) — moderate stress arc seeded")
        print(f"   → Jordan Kim    (id=3) — stable arc seeded")
        print(f"   → 1 alert + 1 counselor flag seeded for Alex")

    except Exception as exc:
        db.rollback()
        print(f"❌ Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
