from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.sql_models import User, Session, Report, DailyUsage
from app.core.redis_client import redis_client
import json

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. User Stats
    total_users = db.query(User).count()
    verified_users = total_users # Since we only store verified
    
    # Gender Distribution
    males = db.query(User).filter(User.gender == "male").count()
    females = db.query(User).filter(User.gender == "female").count()
    
    # 2. Session Stats
    total_sessions = db.query(Session).count()
    active_sessions = db.query(Session).filter(Session.is_active == True).count()
    
    # 3. Reports
    total_reports = db.query(Report).count()
    
    # 4. Redis Queue Stats (Real-time)
    redis = redis_client.get_client()
    waiting_male = redis.llen("queue:waiting:male") if redis else 0
    waiting_female = redis.llen("queue:waiting:female") if redis else 0
    waiting_any = redis.llen("queue:waiting:any") if redis else 0
    
    return {
        "users": {
            "total": total_users,
            "male": males,
            "female": females,
        },
        "sessions": {
            "total": total_sessions,
            "active_now": active_sessions,
        },
        "queues": {
            "male": waiting_male,
            "female": waiting_female,
            "any": waiting_any,
            "total_waiting": waiting_male + waiting_female + waiting_any
        },
        "safety": {
            "reports": total_reports
        }
    }
