"""
Router: POST /admin/trigger-silence

Manual trigger for the silence detection cron job.
For demo and testing purposes — lets you fire the nightly job on demand
without waiting for midnight.
"""

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.scheduler import silence_detection

router = APIRouter(tags=["Admin"])


class TriggerResponse(BaseModel):
    success: bool
    message: str


@router.post(
    "/admin/trigger-silence",
    response_model=TriggerResponse,
    status_code=status.HTTP_200_OK,
    summary="Manually trigger silence detection",
    description=(
        "Fires the nightly silence detection job immediately. "
        "Finds all users who haven't checked in for 2+ days and sends "
        "a gentle Gemini outreach. Respects the 24hr dedup guard. "
        "For demo and testing use only."
    ),
)
def trigger_silence_detection():
    silence_detection()
    return TriggerResponse(
        success=True,
        message="Silence detection job completed. Check server logs for details.",
    )
