from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Literal

from app.core.database import get_db
from app.services.matching_service import MatchingService

router = APIRouter()

class JoinRequest(BaseModel):
    device_id: str
    preference: Literal['male', 'female', 'any'] = 'any'

class MatchResponse(BaseModel):
    status: Literal['matched', 'queued']
    session_id: str = None
    partner: dict = None
    message: str = None

@router.post("/join", response_model=MatchResponse)
def join_match(request: JoinRequest, db: Session = Depends(get_db)):
    """
    Join the matching queue or get an instant match.
    """
    try:
        result = MatchingService.join_queue(db, request.device_id, request.preference)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")

@router.post("/leave")
def leave_match(device_id: str = Body(..., embed=True)):
    """
    Leave any matching queue.
    """
    found = MatchingService.leave_queue(device_id)
    if found:
        return {"status": "success", "message": "Removed from queue"}
    return {"status": "info", "message": "User was not in any queue"}
