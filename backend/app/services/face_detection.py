import httpx
from app.core.config import settings
import logging

class FaceDetectionService:
    async def detect_gender(self, image_bytes: bytes):
        api_key = settings.HUGGINGFACE_API_KEY
        model_id = settings.model_id
        
        if not api_key or not model_id:
            logging.error("Hugging Face API key or Model ID not configured.")
            return {"error": "Configuration missing"}

        try:
            url = f"https://api-inference.huggingface.co/models/{model_id}"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "image/jpeg"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, content=image_bytes)
                if response.status_code != 200:
                    return {"error": f"API request failed with status {response.status_code}: {response.text}"}
                result = response.json()
            
            # Convert to dict for frontend compatibility
            parsed_result = []
            if isinstance(result, list):
                for item in result:
                    parsed_result.append({
                        "label": item.get('label'),
                        "score": item.get('score')
                    })
            else:
                 parsed_result = result
            
            return parsed_result

        except Exception as e:
            logging.error(f"Hugging Face API error: {e}")
            return {"error": f"API request failed: {str(e)}"}

face_detection_service = FaceDetectionService()
