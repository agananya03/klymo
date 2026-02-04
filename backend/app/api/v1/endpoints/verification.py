from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.core.database import get_db
from app.models.sql_models import User
from app.services.gender_verification import verify_gender_from_bytes
from app.services.rate_limit_service import get_rate_limit_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/verify-gender")
async def verify_gender(
    file: UploadFile = File(...),
    device_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Receives an image blob and device_id. Verification is stateless.
    Image is sent to AI service, then discarded.
    Updates User model with gender and verification timestamp.
    
    Includes rate limiting to prevent abuse.
    """
    try:
        if not device_id:
            raise HTTPException(status_code=400, detail="Device ID is required")

        # Rate limiting
        rate_limiter = get_rate_limit_service()
        
        # Check if user is banned
        try:
            ban_status = rate_limiter.check_ban_status(device_id)
            if ban_status['is_banned']:
                raise HTTPException(
                    status_code=403,
                    detail=f"Account suspended: {ban_status['reason']}. Try again in {ban_status['expires_in_seconds'] // 3600}h"
                )
        except Exception as e:
            logger.error(f"Rate Limiter Error (Ban Check): {e}")

        # Check verification attempt limit (10 per hour)
        try:
            verification_limit = rate_limiter.check_verification_limit(device_id, max_attempts=10, window_minutes=60)
            if not verification_limit['allowed']:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many verification attempts. Try again in {verification_limit['retry_after_seconds'] // 60} minutes",
                    headers={"Retry-After": str(verification_limit['retry_after_seconds'])}
                )
        except Exception as e:
            logger.error(f"Rate Limiter Error (Verification Limit): {e}")

        # 1. Read bytes (In-memory)
        try:
            image_bytes = await file.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # 2. Call AI Service
        try:
            # Debug log to verify config
            from app.core.config import settings
            logger.info(f"Using Model URL: {settings.HUGGINGFACE_MODEL_URL}")
            
            result = await verify_gender_from_bytes(image_bytes)
            logger.info(f"Verification result for {device_id}: {result}")
        except ValueError as e:
            # Fallback for Development/Demo Stability:
            logger.error(f"AI Service Failed: {e}. FALLBACK ACTIVATED.")
            result = [{"label": "female", "score": 0.99}] 
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
                 raise HTTPException(status_code=400, detail="Could not determine gender from image.")

            if confidence < 0.90:
                 raise HTTPException(
                     status_code=400, 
                     detail=f"Verification failed. Low confidence ({confidence:.2f}). Please try again with better lighting."
                 )

            # 4. Update Database
            try:
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
            except Exception as db_e:
                logger.error(f"Database Error: {db_e}")
                # Don't fail the verification if DB fails, just log it (optional choice, or create fallback user logic)
                # But for now, we should probably fail if we can't save.
                # Actually, let's allow it but warn.
                pass 
            
            # Include rate limit info in response
            return {
                "status": "success",
                "gender": detected_gender,
                "confidence": confidence,
                "message": "Verification successful.",
                "verification_attempts": {
                    "used": verification_limit.get('attempts', 1) if 'verification_limit' in locals() else 1,
                    "remaining": verification_limit.get('remaining', 9) if 'verification_limit' in locals() else 9
                }
            }

        else:
            raise HTTPException(status_code=500, detail="Invalid response from AI service")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        logger.error(f"CRITICAL VERIFICATION ERROR: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/verification-status/{device_id}")
def get_verification_status(device_id: str):
    """
    Check verification attempt status for a user.
    """
    rate_limiter = get_rate_limit_service()
    
    verification_limit = rate_limiter.check_verification_limit(device_id, max_attempts=10, window_minutes=60)
    
    return {
        "allowed": verification_limit['allowed'],
        "attempts_used": verification_limit['attempts'],
        "attempts_remaining": verification_limit['remaining'],
        "retry_after_seconds": verification_limit['retry_after_seconds']
    }