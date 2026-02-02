from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.sql_models import Report, User
from app.services.rate_limit_service import get_rate_limit_service

router = APIRouter()

class ReportRequest(BaseModel):
    reporter_device_id: str = Field(..., description="Device ID of reporter")
    reported_device_id: str = Field(..., description="Device ID of reported user")
    session_id: str = Field(..., description="Session ID where violation occurred")
    reason: str = Field(..., min_length=1, max_length=500, description="Report reason")
    category: str = Field(..., description="Report category", pattern="^(inappropriate|harassment|spam|offensive|underage|other)$")
    details: Optional[str] = Field(None, max_length=1000, description="Additional details")

class ReportResponse(BaseModel):
    status: str
    report_id: int
    message: str
    auto_action_taken: Optional[str] = None

@router.post("/submit", response_model=ReportResponse)
def submit_report(
    report: ReportRequest,
    db: Session = Depends(get_db)
):
    """
    Submit a report for a user.
    Includes spam prevention and auto-moderation for repeat offenders.
    """
    rate_limiter = get_rate_limit_service()
    
    # 1. Check report spam limit (5 reports per hour)
    report_limit = rate_limiter.check_report_limit(
        report.reporter_device_id,
        max_reports=5,
        window_minutes=60
    )
    
    if not report_limit['allowed']:
        raise HTTPException(
            status_code=429,
            detail=f"Too many reports submitted. Please try again in {report_limit['retry_after_seconds'] // 60} minutes",
            headers={"Retry-After": str(report_limit['retry_after_seconds'])}
        )
    
    # 2. Validate users exist
    reporter = db.query(User).filter(User.device_id == report.reporter_device_id).first()
    reported = db.query(User).filter(User.device_id == report.reported_device_id).first()
    
    if not reporter:
        raise HTTPException(status_code=404, detail="Reporter not found")
    if not reported:
        raise HTTPException(status_code=404, detail="Reported user not found")
    
    # 3. Check if reported user is already banned
    ban_status = rate_limiter.check_ban_status(report.reported_device_id)
    if ban_status['is_banned']:
        return ReportResponse(
            status="already_banned",
            report_id=0,
            message="User is already banned",
            auto_action_taken="User already suspended"
        )
    
    # 4. Create report
    new_report = Report(
        reporter_device_id=report.reporter_device_id,
        reported_device_id=report.reported_device_id,
        session_id=report.session_id,
        reason=f"[{report.category}] {report.reason}",
        reported_at=datetime.utcnow()
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # 5. Check report count for auto-moderation
    report_count = db.query(Report).filter(
        Report.reported_device_id == report.reported_device_id
    ).count()
    
    auto_action = None
    
    # Auto-ban after 3 reports
    if report_count >= 3:
        # Ban for 24 hours
        rate_limiter.ban_user(
            report.reported_device_id,
            duration_hours=24,
            reason=f"Multiple reports ({report_count} total)"
        )
        auto_action = f"User automatically banned for 24h ({report_count} reports)"
        
        # Mark user as banned in DB
        reported.is_banned = True
        db.commit()
    
    # Warning after 2 reports
    elif report_count >= 2:
        auto_action = "User flagged for review"
    
    return ReportResponse(
        status="success",
        report_id=new_report.id,
        message="Report submitted successfully",
        auto_action_taken=auto_action
    )

@router.get("/stats/{device_id}")
def get_report_stats(device_id: str, db: Session = Depends(get_db)):
    """
    Get report statistics for a user.
    """
    # Reports filed BY this user
    reports_filed = db.query(Report).filter(
        Report.reporter_device_id == device_id
    ).count()
    
    # Reports filed AGAINST this user
    reports_received = db.query(Report).filter(
        Report.reported_device_id == device_id
    ).count()
    
    # Check ban status
    rate_limiter = get_rate_limit_service()
    ban_status = rate_limiter.check_ban_status(device_id)
    
    # Check report limit
    report_limit = rate_limiter.check_report_limit(device_id)
    
    return {
        "reports_filed": reports_filed,
        "reports_received": reports_received,
        "is_banned": ban_status['is_banned'],
        "ban_details": ban_status if ban_status['is_banned'] else None,
        "report_limit": {
            "remaining": report_limit['remaining'],
            "retry_after_seconds": report_limit['retry_after_seconds']
        }
    }

@router.get("/history/{device_id}")
def get_report_history(
    device_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recent reports filed by a user.
    """
    reports = db.query(Report).filter(
        Report.reporter_device_id == device_id
    ).order_by(Report.reported_at.desc()).limit(limit).all()
    
    return {
        "reports": [
            {
                "id": r.id,
                "reported_user": r.reported_device_id,
                "session_id": r.session_id,
                "reason": r.reason,
                "reported_at": r.reported_at.isoformat()
            }
            for r in reports
        ]
    }

@router.post("/appeal/{device_id}")
def appeal_ban(device_id: str, reason: str = Body(..., embed=True, min_length=10, max_length=500)):
    """
    Submit an appeal for a ban.
    (In production, this would create a ticket for human review)
    """
    rate_limiter = get_rate_limit_service()
    ban_status = rate_limiter.check_ban_status(device_id)
    
    if not ban_status['is_banned']:
        raise HTTPException(status_code=400, detail="User is not banned")
    
    # In production, log this to a moderation queue
    # For now, just return acknowledgment
    
    return {
        "status": "appeal_submitted",
        "message": "Your appeal has been submitted and will be reviewed by our team",
        "ban_expires_in_hours": ban_status['expires_in_seconds'] // 3600
    }