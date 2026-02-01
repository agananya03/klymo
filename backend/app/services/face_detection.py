from huggingface_hub import AsyncInferenceClient
from app.core.config import settings
import logging

class FaceDetectionService:
    async def detect_gender(self, image_bytes: bytes):
        print(f"DEBUG: API_KEY={settings.HUGGINGFACE_API_KEY[:4]}... Model={settings.model_id}")
        
        if not settings.HUGGINGFACE_API_KEY or not settings.model_id:
            logging.error("Hugging Face API key or Model ID not configured.")
            return {"error": "Configuration missing"}

        try:
            client = AsyncInferenceClient(token=settings.HUGGINGFACE_API_KEY)
            # image_classification returns a list of objects
            result = await client.image_classification(image_bytes, model=settings.model_id)
            
            # Convert to dict for frontend compatibility
            parsed_result = []
            if isinstance(result, list):
                for item in result:
                    parsed_result.append({
                        "label": getattr(item, 'label', None) or item.get('label'),
                        "score": getattr(item, 'score', None) or item.get('score')
                    })
            else:
                 parsed_result = result # Should not happen usually
            
            return parsed_result

        except Exception as e:
            logging.error(f"Hugging Face API error: {e}")
            return {"error": f"API request failed: {str(e)}"}

face_detection_service = FaceDetectionService()
