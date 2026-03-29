"""
Response Agent — Standard Agent

Fires after Signal + Context complete (ParallelAgent resolves).
Receives: RiskReport + ContextReport
Logic:
  - final_score = risk_score + stress_multiplier
  - < 40  → no action
  - 40-70 → gentle nudge via Gemini
  - > 70  → calls Trend Agent (A2A), then full warm outreach via Gemini
  - Writes Alert to DB
  - If score > 70: flags CounselorFlag
  
Output: AssessmentResult dict
"""

from __future__ import annotations
import asyncio
from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from app.agents.signal_agent import RiskReport
from app.agents.context_agent import ContextReport
from app.agents.trend_agent import run_trend_agent, PopulationContext
from app.models.orm import Alert, CounselorFlag, User
from app.services.gemini_client import get_gemini_client
from app.config.settings import settings


@dataclass
class AssessmentResult:
    user_id: int
    risk_score: int
    stress_multiplier: int
    final_score: int
    action_taken: str
    message_en: str
    message_es: str
    prediction: str
    counselor_flagged: bool
    trend_context: str
    minimization_detected: bool


_OUTREACH_PROMPT = """\
You are a compassionate peer support assistant for college students.
A student has the following profile:
- Risk score: {risk_score}/100 (trend: {trend})
- Reasoning: {reasoning}
- Academic context: {label}
- Population context: {population_context}
- Language for response: {language}

Generate a warm, non-clinical outreach message in {language_name} that is under 3 sentences.
Do NOT mention scores, data, or risk levels.
Sound like a caring friend, not a therapist.
End with one specific USF resource relevant to their situation.
USF Counseling: (813) 974-2831, available Mon-Fri 8am-5pm. Crisis line 24/7.
"""

_NUDGE_PROMPT = """\
You are a compassionate peer support assistant for college students.
A student is showing early signs of stress (not yet critical).
Academic context: {label}
Generate a single warm, encouraging sentence in {language_name} — like a friend checking in.
Do NOT mention scores or data. Keep it under 20 words.
"""

_PREDICTION_PROMPT = """\
Based on a student's 7-day check-in pattern (trend: {trend}) \
and the upcoming academic event "{event}" in {days} days, \
write one sentence predicting how the next 7 days may feel for them. \
Be realistic but not alarming. Under 25 words.
"""


def run_response_agent(
    db: Session,
    user_id: int,
    risk_report: RiskReport,
    context_report: ContextReport,
    current_date: date | None = None,
) -> AssessmentResult:
    """
    Orchestrates the full assessment pipeline:
    1. Calculate final_score
    2. Decide action
    3. Conditionally call Trend Agent (A2A, score > 70)
    4. Call Gemini for message generation
    5. Write Alert + CounselorFlag to DB
    """
    if current_date is None:
        current_date = date.today()

    # Fetch user language preference
    user = db.query(User).filter(User.id == user_id).first()
    language = user.language if user else "en"
    language_name = "Spanish" if language == "es" else "English"

    # ── Step 1: Calculate final score ─────────────────────────────────────
    final_score = min(risk_report.risk_score + context_report.stress_multiplier, 100)

    # ── Step 2: Determine action ──────────────────────────────────────────
    if final_score < 40:
        action_taken = "none"
    elif final_score <= 70:
        action_taken = "nudge"
    else:
        action_taken = "full_outreach"

    # ── Step 3: A2A call to Trend Agent (only when score > 70) ───────────
    population_context: PopulationContext | None = None
    trend_context_str = ""

    if final_score > 70:
        population_context = run_trend_agent(db, current_date)
        trend_context_str = population_context.context

    # ── Step 4: Generate messages via Gemini ──────────────────────────────
    message_en = ""
    message_es = ""
    prediction = ""

    if action_taken != "none":
        gemini_available = bool(settings.gemini_api_key)

        if gemini_available:
            try:
                client = get_gemini_client()
                pop_ctx = trend_context_str or "No population data available."

                if action_taken == "full_outreach":
                    # English outreach
                    prompt_en = _OUTREACH_PROMPT.format(
                        risk_score=risk_report.risk_score,
                        trend=risk_report.trend,
                        reasoning=risk_report.reasoning,
                        label=context_report.label,
                        population_context=pop_ctx,
                        language="English",
                        language_name="English",
                    )
                    resp_en = client.models.generate_content(
                        model=settings.gemini_model, contents=prompt_en
                    )
                    message_en = resp_en.text.strip()

                    # Spanish outreach
                    prompt_es = _OUTREACH_PROMPT.format(
                        risk_score=risk_report.risk_score,
                        trend=risk_report.trend,
                        reasoning=risk_report.reasoning,
                        label=context_report.label,
                        population_context=pop_ctx,
                        language="Spanish",
                        language_name="Spanish",
                    )
                    resp_es = client.models.generate_content(
                        model=settings.gemini_model, contents=prompt_es
                    )
                    message_es = resp_es.text.strip()

                else:  # nudge
                    nudge_prompt_en = _NUDGE_PROMPT.format(
                        label=context_report.label, language_name="English"
                    )
                    resp_en = client.models.generate_content(
                        model=settings.gemini_model, contents=nudge_prompt_en
                    )
                    message_en = resp_en.text.strip()

                    nudge_prompt_es = _NUDGE_PROMPT.format(
                        label=context_report.label, language_name="Spanish"
                    )
                    resp_es = client.models.generate_content(
                        model=settings.gemini_model, contents=nudge_prompt_es
                    )
                    message_es = resp_es.text.strip()

                # Prediction (always generate if not "none")
                pred_prompt = _PREDICTION_PROMPT.format(
                    trend=risk_report.trend,
                    event=context_report.nearest_event,
                    days=context_report.days_until,
                )
                resp_pred = client.models.generate_content(
                    model=settings.gemini_model, contents=pred_prompt
                )
                prediction = resp_pred.text.strip()

            except Exception:
                # Gemini unavailable — use fallback messages
                message_en, message_es, prediction = _fallback_messages(
                    action_taken, context_report, risk_report, trend_context_str
                )
        else:
            # No API key configured — use deterministic fallback for demo
            message_en, message_es, prediction = _fallback_messages(
                action_taken, context_report, risk_report, trend_context_str
            )

    # ── Step 5: Write Alert to DB ─────────────────────────────────────────
    counselor_flagged = final_score > 70

    alert = Alert(
        user_id=user_id,
        risk_score=risk_report.risk_score,
        stress_multiplier=context_report.stress_multiplier,
        final_score=final_score,
        action_taken=action_taken,
        message_en=message_en,
        message_es=message_es,
        prediction=prediction,
        counselor_flagged=counselor_flagged,
        minimization_detected=risk_report.minimization_detected,
    )
    db.add(alert)

    # ── Step 6: Flag counselor dashboard if high risk ─────────────────────
    if counselor_flagged and user:
        flag = CounselorFlag(
            user_id=user_id,
            dorm_floor=user.dorm_floor,
            final_score=final_score,
        )
        db.add(flag)

    db.commit()

    return AssessmentResult(
        user_id=user_id,
        risk_score=risk_report.risk_score,
        stress_multiplier=context_report.stress_multiplier,
        final_score=final_score,
        action_taken=action_taken,
        message_en=message_en,
        message_es=message_es,
        prediction=prediction,
        counselor_flagged=counselor_flagged,
        trend_context=trend_context_str,
        minimization_detected=risk_report.minimization_detected,
    )


def _fallback_messages(
    action_taken: str,
    context_report: ContextReport,
    risk_report: RiskReport,
    trend_context: str,
) -> tuple[str, str, str]:
    """Deterministic fallback messages when Gemini is unavailable."""
    pop_snippet = (
        " You're definitely not alone — " + trend_context.split(".")[0] + "."
        if trend_context
        else ""
    )

    if action_taken == "full_outreach":
        en = (
            f"Hey, this week sounds really heavy — and that's completely valid.{pop_snippet} "
            f"When you're ready, USF Counseling is here for you: (813) 974-2831."
        )
        es = (
            f"Hola, esta semana suena muy difícil — y eso es completamente válido.{pop_snippet} "
            f"Cuando estés listo/a, Consejería de USF está aquí: (813) 974-2831."
        )
    else:
        en = f"Hey, just checking in on you — {context_report.label}. You've got this! 💙"
        es = f"Hola, solo pasando a saludarte — {context_report.label}. ¡Tú puedes! 💙"

    prediction = (
        f"Based on your recent pattern and {context_report.nearest_event} "
        f"{'starting soon' if context_report.days_until <= 5 else 'on the horizon'}, "
        f"this week may feel particularly {'challenging' if risk_report.trend == 'declining' else 'manageable'}."
    )

    return en, es, prediction
