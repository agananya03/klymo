import httpx
import logging
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

async def verify_gender_from_bytes(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Sends image bytes to Hugging Face API for gender classification.
    Uses httpx directly to ensure correct headers (Content-Type).
    """
    api_key = settings.HUGGINGFACE_API_KEY
    model_url = settings.HUGGINGFACE_MODEL_URL
    
    # Fallback to default if URL not provided
    if not model_url or not model_url.startswith("http"):
        model_id = settings.model_id
        model_url = f"https://api-inference.huggingface.co/models/{model_id}"
    
    if not api_key:
        logger.warning("No Hugging Face API Key found in settings.")

    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "image/jpeg"
        }
        
        logger.info(f"Calling HF Inference: {model_url}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(model_url, headers=headers, content=image_bytes)
            
            if response.status_code != 200:
                error_msg = response.text
                logger.error(f"HF API Error ({response.status_code}): {error_msg[:200]}...") # Log only start
                
                if "<html" in error_msg.lower() or "<svg" in error_msg.lower():
                    raise ValueError(f"AI Service Unavailable (Status {response.status_code})")
                
                if response.status_code == 503:
                    raise ValueError("AI is warming up. Please try again in 30 seconds.")

                raise ValueError(f"AI Service Error: {error_msg}")
            
            result = response.json()
        
        # Parse result: HF usually returns a list of classification objects
        # e.g. [{"label": "female", "score": 0.99}, {"label": "male", "score": 0.01}]
        parsed_result = []
        if isinstance(result, list):
            for item in result:
                label = item.get('label')
                score = item.get('score')
                if label is not None and score is not None:
                    parsed_result.append({"label": label, "score": score})
        
        if not parsed_result:
            logger.error(f"Could not parse HF result: {result}")
            raise ValueError("AI Service returned unexpected data format")

        return parsed_result

    except Exception as e:
        if isinstance(e, ValueError): raise e
        logger.error(f"Error calling HF API: {e}")
        raise ValueError(f"AI Service Error: {str(e)}")
