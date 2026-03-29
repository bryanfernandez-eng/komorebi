"""
Seed script — populates the DB with demo users and realistic check-in history.

Run from backend/ directory:
    python seed.py

Demo users (from architecture.md):
  user_id 1 — Alex Rivera    | Floor 3 - Cypress Hall | en | Declining (demo hero)
  user_id 2 — Maria Lopez    | Floor 3 - Cypress Hall | es | Spanish demo user
  user_id 3 — Jordan Kim     | Floor 2 - Oak Hall     | en | Stable (contrast)

Safe to re-run — skips users that already exist by ID.
"""

from datetime import date, datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

import app.models.orm  # noqa: F401 — registers all ORM models with Base
from app.config.database import engine, Base, SessionLocal
from app.models.orm import User, Checkin, Alert, CounselorFlag

# ── Create all tables (idempotent) ────────────────────────────────────────────
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    today = date.today()

    try:
        seeded_users = 0
        seeded_checkins = 0

        # ── Users ─────────────────────────────────────────────────────────────
        users = [
            User(
                id=1,
                name="Alex Rivera",
                email="alex.rivera@usf.edu",
                language="en",
                dorm_floor="Floor 3 - Cypress Hall",
                consecutive_checkin_days=7,
                last_checkin_date=today,
            ),
            User(
                id=2,
                name="Maria Lopez",
                email="maria.lopez@usf.edu",
                language="es",
                dorm_floor="Floor 3 - Cypress Hall",
                consecutive_checkin_days=7,
                last_checkin_date=today,
            ),
            User(
                id=3,
                name="Jordan Kim",
                email="jordan.kim@usf.edu",
                language="en",
                dorm_floor="Floor 2 - Oak Hall",
                consecutive_checkin_days=7,
                last_checkin_date=today,
            ),
        ]

        for user in users:
            if db.query(User).filter(User.id == user.id).first():
                print(f"  ~ User {user.id} ({user.name}) already exists — skipping.")
                continue
            db.add(user)
            db.flush()
            seeded_users += 1

            checkins_data = _CHECKINS[user.id]
            for days_ago, mood, sleep, stress, text in checkins_data:
                submitted = datetime.combine(
                    today - timedelta(days=days_ago), datetime.min.time()
                ).replace(hour=9)
                db.add(Checkin(
                    user_id=user.id,
                    mood=mood,
                    sleep=sleep,
                    stress=stress,
                    text_entry=text,
                    submitted_at=submitted,
                ))
                seeded_checkins += 1

            print(f"  + Seeded {user.name} (id={user.id}) with {len(checkins_data)} check-ins.")

        # ── Pre-seed Alex's alert + counselor flag ────────────────────────────
        # Simulates a previous assessment — demonstrates the full pipeline output
        alex_exists = db.query(User).filter(User.id == 1).first()
        alert_exists = db.query(Alert).filter(Alert.user_id == 1).first()

        if alex_exists and not alert_exists:
            alert = Alert(
                user_id=1,
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
                    "this week may be especially challenging — pace yourself."
                ),
                counselor_flagged=True,
                minimization_detected=True,
                created_at=datetime.combine(
                    today - timedelta(days=1), datetime.min.time()
                ).replace(hour=14, minute=30),
            )
            db.add(alert)
            db.flush()

            db.add(CounselorFlag(
                user_id=1,
                dorm_floor="Floor 3 - Cypress Hall",
                final_score=93,
                flagged_at=alert.created_at,
            ))
            print("  + Pre-seeded alert + counselor flag for Alex.")

        db.commit()
        print(f"\nDone — {seeded_users} user(s), {seeded_checkins} check-in(s) seeded.")

    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}")
        raise
    finally:
        db.close()


# ── Check-in data ─────────────────────────────────────────────────────────────
# Format: (days_ago, mood, sleep, stress, text_entry)
# days_ago=0 → today, days_ago=6 → 6 days ago

_CHECKINS = {
    # Alex — clear declining spiral with minimization on day 2
    1: [
        (6, 7, 7, 3, None),
        (5, 6, 6, 4, "A little tired but managing okay."),
        (4, 6, 5, 5, None),
        (3, 5, 5, 7, "Things are piling up a bit."),
        (2, 5, 4, 8, "I'm fine, just busy."),   # minimization
        (1, 4, 4, 9, "Honestly stressed but whatever, everyone is."),
        (0, 4, 3, 9, "Super stressed about midterms. Can't sleep, feeling hopeless."),
    ],
    # Maria — moderately stressed, Spanish text entries
    2: [
        (6, 6, 6, 5, None),
        (5, 6, 6, 5, "Todo bien por ahora."),
        (4, 5, 6, 6, None),
        (3, 5, 5, 6, "Hay mucho por hacer esta semana."),
        (2, 5, 5, 7, None),
        (1, 5, 5, 7, "Estresada pero sobreviviendo."),
        (0, 4, 4, 8, "Agotada. No puedo concentrarme."),
    ],
    # Jordan — stable, positive contrast user
    3: [
        (6, 7, 7, 3, None),
        (5, 7, 7, 3, "Good week so far."),
        (4, 8, 7, 3, None),
        (3, 7, 8, 4, "A bit of pressure but nothing too bad."),
        (2, 8, 8, 3, None),
        (1, 8, 7, 3, "Feeling solid, managed to prep ahead for midterms."),
        (0, 8, 8, 3, "Motivated and doing well."),
    ],
}


if __name__ == "__main__":
    print("Seeding Komorebi demo data...\n")
    seed()
