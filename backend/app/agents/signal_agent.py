"""
Signal Agent — LoopAgent (runs inside ParallelAgent)

Input:  user_id — fetches its own check-in data directly from the DB
Logic:  3-loop iterative risk scoring:
          Loop 1: mood scores only    → initial risk
          Loop 2: + sleep             → adjusted risk
          Loop 3: + stress + text     → final risk + minimisation flag
Output: RiskReport dict
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from app.models.orm import Checkin


@dataclass
class RiskReport:
    risk_score: int
    confidence: float
    trend: str                # "declining" | "stable" | "improving"
    reasoning: str
    loops_run: int
    minimization_detected: bool
    emotion_signals: list[str]  # human-readable tags, e.g. ["distress", "isolation"]


def run_signal_agent(db: Session, user_id: int) -> RiskReport:
    """
    Pure-Python LoopAgent implementation.
    Iterates up to 3 times, each loop refining the risk score.
    Terminates early when confidence > 0.85.
    """
    # ── Fetch the 7 most recent check-ins (newest first, then reverse) ──────
    rows = (
        db.query(Checkin)
        .filter(Checkin.user_id == user_id)
        .order_by(Checkin.submitted_at.desc())
        .limit(7)
        .all()
    )
    rows = list(reversed(rows))  # oldest→newest for trend calculation

    if not rows:
        return RiskReport(
            risk_score=0,
            confidence=1.0,
            trend="stable",
            reasoning="No check-in data available.",
            loops_run=0,
            minimization_detected=False,
            emotion_signals=[],
        )

    moods    = [r.mood   for r in rows]
    sleeps   = [r.sleep  for r in rows]
    stresses = [r.stress for r in rows]
    texts    = [r.text_entry for r in rows if r.text_entry]

    # Recency weights: most recent check-in counts 2x, oldest counts 1x
    n = len(rows)
    weights = [1 + (i / max(n - 1, 1)) for i in range(n)]  # 1.0 … 2.0
    total_w = sum(weights)

    confidence = 0.0
    risk_score = 0
    loops_run = 0
    minimization_detected = False

    # ── Loop 1: mood-only analysis (recency-weighted) ─────────────────────
    loops_run = 1
    avg_mood = sum(m * w for m, w in zip(moods, weights)) / total_w
    mood_drop = moods[0] - moods[-1] if len(moods) > 1 else 0

    if avg_mood <= 3:
        risk_score = 75
    elif avg_mood <= 5:
        risk_score = 55
    elif avg_mood <= 7:
        risk_score = 35
    else:
        risk_score = 15

    # Add drop penalty (max +20)
    risk_score += min(mood_drop * 4, 20)
    risk_score = min(risk_score, 95)
    confidence = 0.55

    if confidence > 0.85:
        return _build_report(risk_score, confidence, moods, loops_run, minimization_detected, [])

    # ── Loop 2: factor in sleep (recency-weighted) ───────────────────────
    loops_run = 2
    avg_sleep = sum(s * w for s, w in zip(sleeps, weights)) / total_w
    sleep_drop = sleeps[0] - sleeps[-1] if len(sleeps) > 1 else 0

    if avg_sleep < 4:
        risk_score += 15
    elif avg_sleep < 6:
        risk_score += 8

    risk_score += min(sleep_drop * 2, 8)
    risk_score = min(risk_score, 95)
    confidence = 0.72

    if confidence > 0.85:
        return _build_report(risk_score, confidence, moods, loops_run, minimization_detected, [])

    # ── Loop 3: stress + text (recency-weighted) ────────────────────────
    loops_run = 3
    avg_stress = sum(st * w for st, w in zip(stresses, weights)) / total_w
    stress_rise = stresses[-1] - stresses[0] if len(stresses) > 1 else 0

    if avg_stress >= 8:
        risk_score += 12
    elif avg_stress >= 6:
        risk_score += 6

    risk_score += min(stress_rise * 2, 10)
    risk_score = min(risk_score, 95)

    # Emotion-aware text analysis
    text_delta, emotion_signals, minimization_detected = _analyze_text_emotion(
        texts, avg_mood, avg_stress
    )
    risk_score = min(max(risk_score + text_delta, 0), 95)

    confidence = 0.89
    return _build_report(risk_score, confidence, moods, loops_run, minimization_detected, emotion_signals)


def _analyze_text_emotion(
    texts: list[str],
    avg_mood: float,
    avg_stress: float,
) -> tuple[int, list[str], bool]:
    """
    Classifies emotional tone across three tiers and returns:
      - score_delta: int adjustment to apply to risk_score
      - emotion_signals: list of detected signal tags for reasoning
      - minimization_detected: bool

    Tiers (applied independently, capped in caller):
      distress   → +15  (acute crisis language)
      negative   → +8   (sustained emotional strain)
      isolation  → +6   (social withdrawal signals)
      positive   → -5   (genuine wellbeing language)
      minimization detected when dismissive language contradicts bad scores
    """
    if not texts:
        return 0, [], False

    combined = " ".join(texts).lower()
    signals: list[str] = []
    delta = 0

    _DISTRESS = {
        "can't sleep", "cant sleep", "can't eat", "cant eat",
        "breaking down", "broken down", "crying", "cried myself",
        "panic attack", "panicking", "hopeless", "worthless",
        "giving up", "give up", "can't do this", "cant do this",
        "falling apart", "want to disappear", "don't see the point",
    }
    _NEGATIVE = {
        "exhausted", "burned out", "burnt out", "overwhelmed",
        "anxious", "anxiety", "scared", "terrified", "miserable",
        "depressed", "depression", "numb", "empty", "struggling",
        "stressed out", "so stressed", "falling behind", "behind on",
        "can't focus", "cant focus", "can't concentrate",
    }
    _ISOLATION = {
        "lonely", "alone", "no one", "nobody", "isolated",
        "no friends", "don't belong", "dont belong", "left out",
        "no one cares", "nobody cares",
    }
    _POSITIVE = {
        "excited", "happy", "great day", "amazing", "motivated",
        "proud of", "grateful", "doing well", "feeling good",
        "much better", "things are looking", "really good",
    }
    _MINIMIZATION = {
        "fine", "okay", "ok", "whatever", "alright",
        "i'm good", "im good", "it's fine", "its fine", "no big deal",
    }

    if any(kw in combined for kw in _DISTRESS):
        signals.append("distress")
        delta += 15

    if any(kw in combined for kw in _NEGATIVE):
        signals.append("negative_emotion")
        delta += 8

    if any(kw in combined for kw in _ISOLATION):
        signals.append("isolation")
        delta += 6

    if any(kw in combined for kw in _POSITIVE):
        signals.append("positive_emotion")
        delta -= 5

    minimization_detected = False
    if avg_mood <= 5 and avg_stress >= 7 and any(kw in combined for kw in _MINIMIZATION):
        minimization_detected = True
        signals.append("minimization")
        delta += 8

    return delta, signals, minimization_detected


def _build_report(
    risk_score: int,
    confidence: float,
    moods: list[int],
    loops_run: int,
    minimization_detected: bool,
    emotion_signals: list[str],
) -> RiskReport:
    if len(moods) >= 2:
        if moods[-1] < moods[0] - 1:
            trend = "declining"
        elif moods[-1] > moods[0] + 1:
            trend = "improving"
        else:
            trend = "stable"
    else:
        trend = "stable"

    avg_mood = sum(moods) / len(moods)
    mood_drop = moods[0] - moods[-1] if len(moods) > 1 else 0
    reasoning = (
        f"Mood averaged {avg_mood:.1f}/10 over {len(moods)} days "
        f"(dropped {mood_drop} points). "
        f"Risk score: {risk_score}. "
    )
    if emotion_signals:
        reasoning += f"Text signals detected: {', '.join(emotion_signals)}. "
    if minimization_detected:
        reasoning += "Text entries suggest emotional minimisation despite declining scores."

    return RiskReport(
        risk_score=int(risk_score),
        confidence=confidence,
        trend=trend,
        reasoning=reasoning,
        loops_run=loops_run,
        minimization_detected=minimization_detected,
        emotion_signals=emotion_signals,
    )
