from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Literal

from app.core.database import get_db
from app.services.matching_service import MatchingService
from app.services.rate_limit_service import get_rate_limit_service

router = APIRouter()

class JoinRequest(BaseModel):
    device_id: str
    preference: Literal['male', 'female', 'any'] = 'any'

class MatchResponse(BaseModel):
    status: Literal['matched', 'queued', 'rate_limited', 'banned']
    session_id: str = None
    partner: dict = None
    message: str = None
    retry_after: int = None  # Seconds until can retry
    daily_stats: dict = None

@router.post("/join", response_model=MatchResponse)
def join_match(request: JoinRequest, db: Session = Depends(get_db)):
    """
    Join the matching queue or get an instant match.
    Includes rate limiting and abuse prevention.
    """
    rate_limiter = get_rate_limit_service()
    device_id = request.device_id
    
    try:
        # 1. Check if user is banned
        ban_status = rate_limiter.check_ban_status(device_id)
        if ban_status['is_banned']:
            return MatchResponse(
                status='banned',
                message=f"Account temporarily suspended: {ban_status['reason']}. Expires in {ban_status['expires_in_seconds'] // 3600}h",
                retry_after=ban_status['expires_in_seconds']
            )
        
        # 2. Check session cooldown (prevent rapid re-matching)
        cooldown = rate_limiter.check_session_cooldown(device_id)
        if cooldown['on_cooldown']:
            return MatchResponse(
                status='rate_limited',
                message=cooldown['message'],
                retry_after=cooldown['remaining_seconds']
            )
        
        # 3. Check daily match limit
        daily_limit = rate_limiter.increment_daily_matches(device_id, max_matches=50)
        if not daily_limit['allowed']:
            return MatchResponse(
                status='rate_limited',
                message=f"Daily match limit reached ({daily_limit['limit']}). Resets at midnight UTC.",
                retry_after=None,  # Resets at midnight
                daily_stats=daily_limit
            )
        
        # 4. Proceed with matching
        result = MatchingService.join_queue(db, device_id, request.preference)
        
        # 5. Add daily stats to response
        result['daily_stats'] = {
            'matches_today': daily_limit['count'],
            'remaining': daily_limit['remaining'],
            'limit': daily_limit['limit']
        }
        
        return MatchResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@router.post("/leave")
def leave_match(device_id: str = Body(..., embed=True)):
    """
    Leave any matching queue.
    Sets a cooldown to prevent immediate re-matching.
    """
    rate_limiter = get_rate_limit_service()
    
    # Remove from queue
    found = MatchingService.leave_queue(device_id)
    
    # Set cooldown (10 seconds)
    rate_limiter.set_session_cooldown(device_id, cooldown_seconds=10)
    
    if found:
        return {"status": "success", "message": "Removed from queue", "cooldown_seconds": 10}
    return {"status": "info", "message": "User was not in any queue"}

@router.get("/stats/{device_id}")
def get_match_stats(device_id: str):
    """
    Get user's matching statistics and limits.
    """
    rate_limiter = get_rate_limit_service()
    
    # Get daily stats
    daily_count = rate_limiter.get_daily_match_count(device_id)
    
    # Check cooldown
    cooldown = rate_limiter.check_session_cooldown(device_id)
    
    # Check ban status
    ban_status = rate_limiter.check_ban_status(device_id)
    
    return {
        "daily_matches": {
            "count": daily_count,
            "limit": 50,
            "remaining": max(0, 50 - daily_count)
        },
        "cooldown": {
            "active": cooldown['on_cooldown'],
            "remaining_seconds": cooldown['remaining_seconds']
        },
        "banned": ban_status['is_banned'],
        "ban_details": ban_status if ban_status['is_banned'] else None
    }