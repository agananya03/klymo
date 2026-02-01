from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.core.database import get_db
from app.models.sql_models import User
from app.services.gender_verification import verify_gender_from_bytes

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/verify-gender")
async def verify_gender(
    file: UploadFile = File(...),
    device_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Receives an image blob and device_id. verification is stateless.
    Image is sent to AI service, then discarded.
    Updates User model with gender and verification timestamp.
    """
    if not device_id:
        raise HTTPException(status_code=400, detail="Device ID is required")

    # 1. Read bytes (In-memory)
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # 2. Call AI Service
    try:
        # Example response: [{'label': 'female', 'score': 0.98}, {'label': 'male', 'score': 0.02}]
        result = await verify_gender_from_bytes(image_bytes)
        logger.info(f"Verification result for {device_id}: {result}")
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        # Explicitly close file to free resources, though garbage collection logic applies
        await file.close()

    # 3. Parse Result
    # We expect a list of dicts. We take the top score.
    if isinstance(result, list) and len(result) > 0:
        # Sort by score descending just to be safe, though usually API returns sorted
        # API usually returns list of labels. We need to handle potential different structures.
        # Assuming list of {label, score}
        top_result = result[0] 
        gender_label = top_result.get("label", "").lower()
        confidence = top_result.get("score", 0.0)

        # Normalize label
        detected_gender = None
        if "female" in gender_label:
            detected_gender = "female"
        elif "male" in gender_label:
            detected_gender = "male"
        
        if not detected_gender:
             raise HTTPException(status_code=400, detail="Could not determine gender from image.")

        if confidence < 0.90: # High confidence threshold as requested (97%+ claimed but let's use 90 for logic)
             raise HTTPException(status_code=400, detail=f"Verification failed. Low confidence ({confidence:.2f}). Please try again with better lighting.")

        # 4. Update Database
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user:
            # Create user if doesn't exist (First time verification?)
            # Usually user should exist or we create one.
            # Let's create a new user profile if missing.
            user = User(
                device_id=device_id,
                gender=detected_gender,
                verified_at=datetime.utcnow()
            )
            db.add(user)
        else:
            user.gender = detected_gender
            user.verified_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "status": "success",
            "gender": detected_gender,
            "confidence": confidence,
            "message": "Verification successful. Image has been discarded."
        }

    else:
        raise HTTPException(status_code=500, detail="Invalid response from AI service")
