import logging
from typing import Dict, Any, List
from huggingface_hub import InferenceClient
from app.core.config import settings

logger = logging.getLogger(__name__)

async def verify_gender_from_bytes(image_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Sends image bytes to Hugging Face API for gender classification using InferenceClient.
    Returns the list of labels and scores.
    """
    api_key = settings.HUGGINGFACE_API_KEY
    model_id = settings.model_id
    
    if not api_key:
        logger.warning("No Hugging Face API Key found in settings.")

    try:
        client = InferenceClient(token=api_key)
        
        # image_classification returns a list of ImageClassificationOutput objects or dicts
        # We need to ensure we run this in a way that doesn't block if it's sync, 
        # but InferenceClient has async support via AsyncInferenceClient or we run it in thread pool if needed.
        # However, standard InferenceClient is sync. 
        # For FastAPI, it's better to use AsyncInferenceClient or run in executor.
        # Let's use the synchronous client in a thread for simplicity unless AsyncInferenceClient is available and easy.
        # Actually, huggingface_hub has AsyncInferenceClient. Let's try to import it, but to be safe/compatible 
        # with the installed version (0.35.3), it definitely supports it.
        
        from huggingface_hub import AsyncInferenceClient
        async_client = AsyncInferenceClient(token=api_key)
        
        logger.info(f"Calling HF Inference with model: {model_id}")
        result = await async_client.image_classification(image_bytes, model=model_id)
        
        # Result is likely a list of objects with 'label' and 'score' attributes.
        # We need to convert it to a list of dicts for the rest of the app to consume easily.
        parsed_result = []
        if isinstance(result, list):
            for item in result:
                # Check if item is an object or dict
                label = getattr(item, 'label', None) or item.get('label')
                score = getattr(item, 'score', None) or item.get('score')
                parsed_result.append({"label": label, "score": score})
        else:
             logger.error(f"Unexpected result format: {result}")
             raise ValueError("AI Service returned unexpected data format")

        return parsed_result

    except Exception as e:
        logger.error(f"Error calling HF API: {e}")
        raise ValueError(f"AI Service Error: {str(e)}")
