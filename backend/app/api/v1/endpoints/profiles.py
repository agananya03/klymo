from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, constr
from typing import Optional

from app.core.database import get_db
from app.models.sql_models import User

router = APIRouter()

# Schema for input validation
class ProfileUpdate(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50, description="Display name for chat context")
    bio: Optional[str] = Field(None, max_length=200, description="Short bio for chat context")
    device_id: str = Field(..., description="Device ID to identify the user")

class ProfileResponse(BaseModel):
    device_id: str
    nickname: Optional[str]
    bio: Optional[str]

@router.get("/{device_id}", response_model=ProfileResponse)
def get_profile(device_id: str, db: Session = Depends(get_db)):
    """
    Retrieve user profile by Device ID.
    User must have been verified/created first.
    """
    user = db.query(User).filter(User.device_id == device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "device_id": user.device_id,
        "nickname": user.nickname,
        "bio": user.bio
    }

@router.put("", response_model=ProfileResponse)
def update_profile(profile_data: ProfileUpdate, db: Session = Depends(get_db)):
    """
    Update nickname and bio. 
    """
    user = db.query(User).filter(User.device_id == profile_data.device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User verification record not found. Please verify Identity first.")
    
    if profile_data.nickname is not None:
        user.nickname = profile_data.nickname
    
    if profile_data.bio is not None:
        user.bio = profile_data.bio
    
    db.commit()
    db.refresh(user)
    
    return {
        "device_id": user.device_id,
        "nickname": user.nickname,
        "bio": user.bio
    }

@router.delete("/{device_id}", response_model=dict)
def delete_profile(device_id: str, db: Session = Depends(get_db)):
    """
    Clear profile data (Privacy request). 
    Does not delete the user record or verification status, just clears context fields.
    """
    user = db.query(User).filter(User.device_id == device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.nickname = None
    user.bio = None
    
    db.commit()
    
    return {"status": "success", "message": "Profile data cleared"}
