from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/usf", tags=["USF Resources"])

class CounselingHoursResponse(BaseModel):
    general_hours: str
    urgent_hours: str
    crisis_hotline: str
    location: str
    after_hours_instructions: str

@router.get("/counseling-hours", response_model=CounselingHoursResponse)
async def get_counseling_hours():
    """
    Returns the official hours and contact information for the USF Counseling Center.
    Data scraped from official USF directories.
    """
    return CounselingHoursResponse(
        general_hours="Monday–Friday, 8:00 a.m. – 5:00 p.m.",
        urgent_hours="Monday–Friday, 9:00 a.m. – 4:00 p.m. (First-come, first-served)",
        crisis_hotline="(813) 974-2831",
        location="Student Services Building (SVC), Suite 2124 (Tampa Campus)",
        after_hours_instructions="Call the crisis hotline and press option 3 to speak with a licensed mental healthcare professional. Also available 24/7 via TimelyCare."
    )
