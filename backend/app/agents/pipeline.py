"""
Agent Pipeline — wires ParallelAgent pattern + full pipeline.

Architecture (from komorebi.md):

  Student submits check-in
          │
          ├──→ Signal Agent (LoopAgent)    ─┐
          │    input: user_id only          │  (run concurrently)
          │                                 │
          └──→ Context Agent (Standard)   ──┘
               input: current_date only
                              │
                              ↓
                     Response Agent (Standard)
                     input: RiskReport + ContextReport
                              │
                        if final_score > 70
                              │
                              ↓
                     Trend Agent (A2A specialist)
                     input: date + population data
                              │
                              ↓
                     Response Agent (resumed)
                     → Gemini message + DB write

We run Signal and Context concurrently using asyncio.gather,
mirroring the ParallelAgent behaviour from the ADK spec.
"""

from __future__ import annotations
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import date

from sqlalchemy.orm import Session

from app.agents.signal_agent import run_signal_agent, RiskReport
from app.agents.context_agent import run_context_agent, ContextReport
from app.agents.response_agent import run_response_agent, AssessmentResult

# Shared executor for running sync DB calls inside async context
_executor = ThreadPoolExecutor(max_workers=4)


async def run_pipeline(db: Session, user_id: int) -> AssessmentResult:
    """
    Full assessment pipeline — async entry point.
    Signal and Context run in parallel (ParallelAgent pattern).
    Response Agent fires after both complete.
    """
    loop = asyncio.get_event_loop()
    current_date = date.today()

    # ── ParallelAgent: run Signal + Context concurrently ──────────────────
    risk_report, context_report = await asyncio.gather(
        loop.run_in_executor(_executor, run_signal_agent, db, user_id),
        loop.run_in_executor(_executor, run_context_agent, current_date),
    )

    # ── Response Agent fires after both complete ───────────────────────────
    result = await loop.run_in_executor(
        _executor,
        run_response_agent,
        db,
        user_id,
        risk_report,
        context_report,
        current_date,
    )

    return result


def run_pipeline_sync(db: Session, user_id: int) -> AssessmentResult:
    """Synchronous wrapper — for use in non-async contexts (e.g. scheduler)."""
    return asyncio.run(run_pipeline(db, user_id))
