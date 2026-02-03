import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Date
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    device_id = Column(String(64), primary_key=True, index=True)
    gender = Column(String(10), nullable=False)
    nickname = Column(String(50), nullable=True)
    bio = Column(String(200), nullable=True)
    verified_at = Column(DateTime, nullable=False) # Constraint from image
    created_at = Column(DateTime, default=func.now())
    is_banned = Column(Boolean, default=False)
    trust_score = Column(Integer, default=100)

    # Relationships (optional for now, but good for ORM)
    sessions_as_user1 = relationship("Session", foreign_keys="[Session.user1_device_id]")
    sessions_as_user2 = relationship("Session", foreign_keys="[Session.user2_device_id]")
    reported = relationship("Report", foreign_keys="[Report.reported_device_id]")
    reporter = relationship("Report", foreign_keys="[Report.reporter_device_id]")
    daily_usage = relationship("DailyUsage", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user1_device_id = Column(String(64), ForeignKey("users.device_id"), nullable=False)
    user2_device_id = Column(String(64), ForeignKey("users.device_id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    user1 = relationship("User", foreign_keys=[user1_device_id])
    user2 = relationship("User", foreign_keys=[user2_device_id])
    reports = relationship("Report", back_populates="session")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True) # Serial is implicit with Integer PK
    reporter_device_id = Column(String(64), ForeignKey("users.device_id"))
    reported_device_id = Column(String(64), ForeignKey("users.device_id"))
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.session_id"))
    reason = Column(Text, nullable=True) # "Report description"
    reported_at = Column(DateTime, default=func.now())

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_device_id])
    reported = relationship("User", foreign_keys=[reported_device_id])
    session = relationship("Session", back_populates="reports")


class DailyUsage(Base):
    __tablename__ = "daily_usage"

    device_id = Column(String(64), ForeignKey("users.device_id"), primary_key=True)
    date = Column(Date, nullable=False, primary_key=True)
    specific_matches_count = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="daily_usage")
