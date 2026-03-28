from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date, DateTime,
    ForeignKey, CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    language = Column(String, default="en")
    dorm_floor = Column(String)
    consecutive_checkin_days = Column(Integer, default=0)
    last_checkin_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())

    checkins = relationship("Checkin", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    counselor_flags = relationship("CounselorFlag", back_populates="user")


class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mood = Column(Integer, nullable=False)
    sleep = Column(Integer, nullable=False)
    stress = Column(Integer, nullable=False)
    text_entry = Column(Text)
    submitted_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="checkins")

    __table_args__ = (
        CheckConstraint("mood BETWEEN 1 AND 10", name="check_mood_range"),
        CheckConstraint("sleep BETWEEN 1 AND 10", name="check_sleep_range"),
        CheckConstraint("stress BETWEEN 1 AND 10", name="check_stress_range"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    risk_score = Column(Integer)
    stress_multiplier = Column(Integer)
    final_score = Column(Integer)
    action_taken = Column(String)
    message_en = Column(Text)
    message_es = Column(Text)
    prediction = Column(Text)
    counselor_flagged = Column(Boolean, default=False)
    minimization_detected = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="alerts")

    __table_args__ = (
        CheckConstraint(
            "action_taken IN ('none', 'nudge', 'full_outreach', 'silence_outreach')",
            name="check_action_taken",
        ),
    )


class CounselorFlag(Base):
    __tablename__ = "counselor_flags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dorm_floor = Column(String)
    final_score = Column(Integer)
    flagged_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="counselor_flags")
