"""
Context Agent — Standard Agent (runs inside ParallelAgent alongside Signal Agent)

Input:  current_date — never touches check-in data
Logic:  Reads calendar_data.json and calculates proximity to nearest stressor
Output: ContextReport dict

Stress multiplier rules (from architecture.md):
  ≤ 2 days  → +25  (imminent)
  ≤ 5 days  → +15  (approaching)
  ≤ 7 days  → +10  (on the horizon)
  7+ days   → +0
"""

from __future__ import annotations
import json
import os
from dataclasses import dataclass
from datetime import date, datetime


CALENDAR_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "calendar_data.json",
)


@dataclass
class ContextReport:
    nearest_event: str
    days_until: int
    stress_multiplier: int
    label: str


def run_context_agent(current_date: date | None = None) -> ContextReport:
    """
    Pure-Python Context Agent.
    Completely independent from check-in data — takes only a date as input.
    """
    if current_date is None:
        current_date = date.today()

    # ── Load calendar ─────────────────────────────────────────────────────
    try:
        with open(CALENDAR_PATH, "r") as f:
            calendar = json.load(f)
        events = calendar.get("academic_events", [])
    except (FileNotFoundError, json.JSONDecodeError):
        # Graceful degradation — no calendar data available
        return ContextReport(
            nearest_event="Unknown",
            days_until=999,
            stress_multiplier=0,
            label="No academic calendar data available.",
        )

    # ── Find nearest upcoming or active event ─────────────────────────────
    nearest_event = None
    min_days = float("inf")

    for event in events:
        start = date.fromisoformat(event["start"])
        end   = date.fromisoformat(event["end"])

        # If we're inside the event window, days_until = 0
        if start <= current_date <= end:
            days_until = 0
        elif start > current_date:
            days_until = (start - current_date).days
        else:
            continue  # event already passed

        if days_until < min_days:
            min_days = days_until
            nearest_event = event

    if nearest_event is None:
        return ContextReport(
            nearest_event="None upcoming",
            days_until=999,
            stress_multiplier=0,
            label="No upcoming academic stressors in the calendar.",
        )

    # ── Apply multiplier rules ────────────────────────────────────────────
    days = int(min_days)
    if days <= 2:
        multiplier = 25
        proximity = "starts in 2 days" if days > 0 else "is happening now"
    elif days <= 5:
        multiplier = 15
        proximity = f"starts in {days} days"
    elif days <= 7:
        multiplier = 10
        proximity = f"starts in {days} days"
    else:
        multiplier = 0
        proximity = f"starts in {days} days"

    label = f"{nearest_event['event']} {proximity}"

    return ContextReport(
        nearest_event=nearest_event["event"],
        days_until=days,
        stress_multiplier=multiplier,
        label=label,
    )
