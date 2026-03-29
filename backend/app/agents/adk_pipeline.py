"""
Komorebi ADK Pipeline — Google ADK native implementation.

Uses real ADK classes (LoopAgent, ParallelAgent, BaseAgent) so the
Dev UI shows full trace: LoopAgent iterations, ParallelAgent branches,
and the A2A handshake from Response → Trend.

Architecture:
  ParallelAgent("ParallelAnalysis")
    ├── LoopAgent("SignalLoop", max_iterations=3)
    │     └── SignalIterationAgent   (BaseAgent)
    └── KomorebiContextAgent         (BaseAgent)

  → KomorebiResponseAgent            (BaseAgent)
        └── A2A → KomorebiTrendAgent (BaseAgent, only if final_score > 70)

Non-serializable objects (SQLAlchemy Session, dataclass results) are kept in
a module-level _CTX registry keyed by session_id so they survive ADK's
deepcopy of session state.  Only primitives flow through state_delta.

_CTX[session_id] keys:
  "db"             Session         — SQLAlchemy session
  "current_date"   date            — assessment date
  "risk_report"    RiskReport      — written by SignalLoop
  "context_report" ContextReport   — written by ContextAgent
  "assessment"     AssessmentResult — final result
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date
from typing import AsyncGenerator

from google.adk.agents import BaseAgent, LoopAgent, ParallelAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from sqlalchemy.orm import Session

from app.agents.signal_agent import (
    RiskReport,
    _analyze_text_emotion,
    _build_report,
)
from app.agents.context_agent import run_context_agent, ContextReport
from app.agents.trend_agent import run_trend_agent
from app.agents.response_agent import run_response_agent, AssessmentResult

logger = logging.getLogger("komorebi.adk_pipeline")

# Module-level context registry — keyed by session_id
# Holds non-serializable objects that can't go through ADK state_delta deepcopy
_CTX: dict[str, dict] = {}


# ──────────────────────────────────────────────────────────────────────────────
# Signal Loop — one iteration of the 3-step risk refinement
# ──────────────────────────────────────────────────────────────────────────────

class SignalIterationAgent(BaseAgent):
    """
    One iteration of the Signal Agent loop.

    Reads from _CTX:   "db", "current_date"
    Reads from state:  "session_id", "signal_loop_count",
                       "_signal_score", "_signal_minimize", "_signal_emotions"
    Writes via state_delta: above primitives + "loops_run"
    Writes to _CTX:    "risk_report"
    Escalates when confidence > 0.85 (after loop 3 or no data).
    """

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        state = ctx.session.state
        session_id: str = state["session_id"]
        context = _CTX[session_id]
        db: Session = context["db"]
        user_id: int = state["user_id"]

        iteration: int = state.get("signal_loop_count", 0) + 1
        logger.info("[SignalIterationAgent] Loop %d for user %d", iteration, user_id)

        from app.models.orm import Checkin

        rows = (
            db.query(Checkin)
            .filter(Checkin.user_id == user_id)
            .order_by(Checkin.submitted_at.desc())
            .limit(7)
            .all()
        )
        rows = list(reversed(rows))

        if not rows:
            report = RiskReport(
                risk_score=0,
                confidence=1.0,
                trend="stable",
                reasoning="No check-in data available.",
                loops_run=iteration,
                minimization_detected=False,
                emotion_signals=[],
            )
            context["risk_report"] = report
            yield Event(
                author=self.name,
                actions=EventActions(
                    state_delta={"signal_loop_count": iteration, "loops_run": iteration},
                    escalate=True,
                ),
            )
            return

        moods    = [r.mood   for r in rows]
        sleeps   = [r.sleep  for r in rows]
        stresses = [r.stress for r in rows]
        texts    = [r.text_entry for r in rows if r.text_entry]

        n = len(rows)
        weights = [1 + (i / max(n - 1, 1)) for i in range(n)]
        total_w = sum(weights)

        risk_score: int = state.get("_signal_score", 0)
        minimization_detected: bool = state.get("_signal_minimize", False)
        emotion_signals: list = list(state.get("_signal_emotions", []))
        confidence = 0.0

        if iteration == 1:
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

            risk_score += min(mood_drop * 4, 20)
            risk_score = min(risk_score, 95)
            confidence = 0.55

        elif iteration == 2:
            avg_sleep = sum(s * w for s, w in zip(sleeps, weights)) / total_w
            sleep_drop = sleeps[0] - sleeps[-1] if len(sleeps) > 1 else 0

            if avg_sleep < 4:
                risk_score += 15
            elif avg_sleep < 6:
                risk_score += 8
            risk_score += min(sleep_drop * 2, 8)
            risk_score = min(risk_score, 95)
            confidence = 0.72

        else:
            avg_mood = sum(m * w for m, w in zip(moods, weights)) / total_w
            avg_stress = sum(st * w for st, w in zip(stresses, weights)) / total_w
            stress_rise = stresses[-1] - stresses[0] if len(stresses) > 1 else 0

            if avg_stress >= 8:
                risk_score += 12
            elif avg_stress >= 6:
                risk_score += 6
            risk_score += min(stress_rise * 2, 10)
            risk_score = min(risk_score, 95)

            text_delta, emotion_signals, minimization_detected = _analyze_text_emotion(
                texts, avg_mood, avg_stress
            )
            risk_score = min(max(risk_score + text_delta, 0), 95)
            confidence = 0.89

        report = _build_report(
            risk_score, confidence, moods, iteration, minimization_detected, emotion_signals
        )
        context["risk_report"] = report  # store in registry (non-serializable)

        logger.info(
            "[SignalIterationAgent] Loop %d done — score=%d confidence=%.2f",
            iteration, risk_score, confidence,
        )

        should_escalate = confidence > 0.85 or iteration >= 3

        yield Event(
            author=self.name,
            content=genai_types.Content(
                parts=[genai_types.Part(
                    text=f"loop={iteration} score={risk_score} confidence={confidence:.2f}"
                )]
            ),
            actions=EventActions(
                state_delta={
                    "signal_loop_count": iteration,
                    "loops_run": iteration,
                    "_signal_score": risk_score,
                    "_signal_minimize": minimization_detected,
                    "_signal_emotions": emotion_signals,
                },
                escalate=should_escalate,
            ),
        )


# ──────────────────────────────────────────────────────────────────────────────
# Context Agent — standard agent (parallel with Signal Loop)
# ──────────────────────────────────────────────────────────────────────────────

class KomorebiContextAgent(BaseAgent):
    """
    Reads calendar, computes stress multiplier.

    Reads from _CTX:  "current_date"
    Reads from state: "session_id"
    Writes to _CTX:   "context_report"
    Writes via state_delta: "context_done" flag
    """

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        state = ctx.session.state
        session_id: str = state["session_id"]
        context = _CTX[session_id]
        current_date: date = context["current_date"]

        logger.info("[KomorebiContextAgent] Running for date %s", current_date)

        loop = asyncio.get_event_loop()
        context_report: ContextReport = await loop.run_in_executor(
            None, run_context_agent, current_date
        )

        context["context_report"] = context_report

        logger.info(
            "[KomorebiContextAgent] Done — event=%s multiplier=%d",
            context_report.nearest_event, context_report.stress_multiplier,
        )

        yield Event(
            author=self.name,
            content=genai_types.Content(
                parts=[genai_types.Part(
                    text=f"event={context_report.nearest_event} multiplier={context_report.stress_multiplier}"
                )]
            ),
            actions=EventActions(state_delta={"context_done": True}),
        )


# ──────────────────────────────────────────────────────────────────────────────
# Trend Agent — A2A specialist
# ──────────────────────────────────────────────────────────────────────────────

class KomorebiTrendAgent(BaseAgent):
    """
    A2A Trend Agent — invoked by ResponseAgent when final_score > 70.

    Reads from _CTX:  "db", "current_date"
    Reads from state: "session_id"
    Writes via state_delta: "trend_context" (string — serializable)
    """

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        state = ctx.session.state
        session_id: str = state["session_id"]
        context = _CTX[session_id]
        db: Session = context["db"]
        current_date: date = context["current_date"]

        logger.info("[KomorebiTrendAgent] Running trend analysis (A2A)")

        loop = asyncio.get_event_loop()
        population = await loop.run_in_executor(
            None, run_trend_agent, db, current_date
        )

        logger.info(
            "[KomorebiTrendAgent] Done — campus_elevated=%s pct=%d",
            population.campus_stress_elevated, population.percent_high_stress,
        )

        # trend_context is a string — safe for state_delta
        yield Event(
            author=self.name,
            content=genai_types.Content(
                parts=[genai_types.Part(text=population.context)]
            ),
            actions=EventActions(state_delta={"trend_context": population.context}),
        )


# ──────────────────────────────────────────────────────────────────────────────
# Response Agent — orchestrator
# ──────────────────────────────────────────────────────────────────────────────

class KomorebiResponseAgent(BaseAgent):
    """
    Response Agent — fires after ParallelAgent resolves.

    Reads from _CTX:  "db", "current_date", "risk_report", "context_report"
    Reads from state: "session_id", "user_id"
    A2A:              Calls TrendAgent inline when final_score > 70
    Writes to _CTX:   "assessment"
    Writes via state_delta: "action_taken", "final_score"
    """

    trend_agent: KomorebiTrendAgent

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        state = ctx.session.state
        session_id: str = state["session_id"]
        context = _CTX[session_id]

        risk_report: RiskReport = context["risk_report"]
        context_report: ContextReport = context["context_report"]
        db: Session = context["db"]
        current_date: date = context["current_date"]
        user_id: int = state["user_id"]

        final_score = min(risk_report.risk_score + context_report.stress_multiplier, 100)

        logger.info(
            "[KomorebiResponseAgent] final_score=%d (risk=%d + multiplier=%d)",
            final_score, risk_report.risk_score, context_report.stress_multiplier,
        )

        # ── A2A: invoke Trend Agent if high risk ──────────────────────────
        if final_score > 70:
            logger.info("[KomorebiResponseAgent] A2A → KomorebiTrendAgent")
            async for _ in self.trend_agent._run_async_impl(ctx):
                pass  # state_delta applied directly to ctx.session.state in-memory

        # ── Delegate to existing response logic ───────────────────────────
        loop = asyncio.get_event_loop()
        assessment: AssessmentResult = await loop.run_in_executor(
            None,
            run_response_agent,
            db,
            user_id,
            risk_report,
            context_report,
            current_date,
        )

        context["assessment"] = assessment

        logger.info(
            "[KomorebiResponseAgent] Done — action=%s counselor_flagged=%s",
            assessment.action_taken, assessment.counselor_flagged,
        )

        yield Event(
            author=self.name,
            content=genai_types.Content(
                parts=[genai_types.Part(
                    text=f"action={assessment.action_taken} score={assessment.final_score}"
                )]
            ),
            actions=EventActions(
                state_delta={
                    "action_taken": assessment.action_taken,
                    "final_score": assessment.final_score,
                }
            ),
        )


# ──────────────────────────────────────────────────────────────────────────────
# Pipeline entry point
# ──────────────────────────────────────────────────────────────────────────────

async def run_adk_pipeline(db: Session, user_id: int) -> AssessmentResult:
    """
    Full ADK pipeline entry point.

    Stages:
      1. ParallelAgent: SignalLoop (LoopAgent x3) + ContextAgent run concurrently
      2. ResponseAgent: reads _CTX, A2A to TrendAgent if score > 70, writes DB
    """
    today = date.today()
    session_service = InMemorySessionService()
    session_id = f"checkin-{user_id}-{today.isoformat()}"

    # Register non-serializable objects in module-level registry
    _CTX[session_id] = {
        "db": db,
        "current_date": today,
    }

    try:
        # Only primitives in ADK session state
        await session_service.create_session(
            app_name="komorebi",
            user_id=str(user_id),
            session_id=session_id,
            state={
                "session_id": session_id,
                "user_id": user_id,
                "signal_loop_count": 0,
            },
        )

        # Build agent tree
        signal_iter = SignalIterationAgent(name="SignalIterationAgent")
        signal_loop = LoopAgent(
            name="SignalLoop",
            sub_agents=[signal_iter],
            max_iterations=3,
        )
        context_agent = KomorebiContextAgent(name="ContextAgent")
        parallel_analysis = ParallelAgent(
            name="ParallelAnalysis",
            sub_agents=[signal_loop, context_agent],
        )
        trend_agent = KomorebiTrendAgent(name="TrendAgent")
        response_agent = KomorebiResponseAgent(
            name="ResponseAgent",
            trend_agent=trend_agent,
        )

        trigger = genai_types.Content(
            parts=[genai_types.Part(text=f"assess user {user_id}")]
        )

        # Stage 1: ParallelAgent (SignalLoop + ContextAgent)
        parallel_runner = Runner(
            agent=parallel_analysis,
            app_name="komorebi",
            session_service=session_service,
        )
        async for event in parallel_runner.run_async(
            user_id=str(user_id),
            session_id=session_id,
            new_message=trigger,
        ):
            logger.debug("[ADK] parallel event: author=%s", event.author)

        # Stage 2: ResponseAgent (+ A2A TrendAgent if needed)
        response_runner = Runner(
            agent=response_agent,
            app_name="komorebi",
            session_service=session_service,
        )
        async for event in response_runner.run_async(
            user_id=str(user_id),
            session_id=session_id,
            new_message=genai_types.Content(
                parts=[genai_types.Part(text="generate assessment")]
            ),
        ):
            logger.debug("[ADK] response event: author=%s", event.author)

        return _CTX[session_id]["assessment"]

    finally:
        # Clean up registry entry
        _CTX.pop(session_id, None)


def run_adk_pipeline_sync(db: Session, user_id: int) -> AssessmentResult:
    """Synchronous wrapper for non-async contexts (scheduler, tests)."""
    return asyncio.run(run_adk_pipeline(db, user_id))
