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
    try:
        if not device_id:
            raise HTTPException(status_code=400, detail="Device ID is required")

        # 1. Read bytes (In-memory)
        try:
            image_bytes = await file.read()
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

        # 2. Call AI Service
        try:
            # Example response: [{'label': 'female', 'score': 0.98}, {'label': 'male', 'score': 0.02}]
            logger.info("Calling verify_gender_from_bytes...")
            result = await verify_gender_from_bytes(image_bytes)
            logger.info(f"Verification result for {device_id}: {result}")
        except ValueError as e:
            logger.error(f"Service ValueError: {e}")
            raise HTTPException(status_code=502, detail=f"AI Service Error: {str(e)}")
        finally:
            await file.close()

        # 3. Parse Result
        if isinstance(result, list) and len(result) > 0:
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
                 raise HTTPException(status_code=400, detail=f"Could not determine gender from label: {gender_label}")

            if confidence < 0.40: 
                 raise HTTPException(status_code=400, detail=f"Verification failed. Low confidence ({confidence:.2f}). Please try again with better lighting.")

            # 4. Update Database
            user = db.query(User).filter(User.device_id == device_id).first()
            if not user:
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
            logger.error(f"Invalid result format: {result}")
            raise HTTPException(status_code=500, detail=f"Invalid response from AI service: {result}")

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"UNHANDLED EXCEPTION in verify_gender: {error_trace}")
        return {
            "status": "error",
            "message": "Internal Server Error (Captured)",
            "detail": str(e),
            "trace": error_trace.splitlines()[-1] # Be careful not to expose too much, but for dev we need it
        }
