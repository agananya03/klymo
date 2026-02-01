from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.face_detection import face_detection_service
import logging

router = APIRouter()

@router.post("/gender")
async def detect_gender(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_bytes = await file.read()
        result = await face_detection_service.detect_gender(image_bytes)
        
        # Return result directly (even if it has error) so frontend can read it
        return result
    except Exception as e:
        logging.error(f"Error processing image: {e}")
        return {"error": f"Internal server error: {str(e)}"}
