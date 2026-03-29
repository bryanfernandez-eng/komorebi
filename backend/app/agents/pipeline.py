"""
Agent Pipeline — entry point for the full assessment pipeline.

Delegates to the Google ADK native pipeline (adk_pipeline.py) which uses
real ParallelAgent, LoopAgent, and BaseAgent subclasses for Dev UI tracing.

Architecture:
  ParallelAgent("ParallelAnalysis")
    ├── LoopAgent("SignalLoop", max_iterations=3)
    │     └── SignalIterationAgent
    └── KomorebiContextAgent

  → KomorebiResponseAgent
        └── A2A → KomorebiTrendAgent  (when final_score > 70)
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.agents.adk_pipeline import run_adk_pipeline, run_adk_pipeline_sync
from app.agents.response_agent import AssessmentResult


async def run_pipeline(db: Session, user_id: int) -> AssessmentResult:
    """Full assessment pipeline — async entry point (ADK-native)."""
    return await run_adk_pipeline(db, user_id)


def run_pipeline_sync(db: Session, user_id: int) -> AssessmentResult:
    """Synchronous wrapper — for use in non-async contexts (e.g. scheduler)."""
    return run_adk_pipeline_sync(db, user_id)
