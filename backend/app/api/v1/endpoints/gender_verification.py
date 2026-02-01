from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import logging
from app.core.huggingface_client import huggingface_client

router = APIRouter()

class GenderVerificationRequest(BaseModel):
    image: str  # Base64 encoded image string

@router.post("/verify-gender")
async def verify_gender(request: GenderVerificationRequest):
    """
    Verify gender from a base64 encoded image.
    Decodes the image, sends it to Hugging Face, and returns the classification.
    """
    image_data = None
    try:
        # 1. Decode base64 to binary
        # Remove header if present (e.g., "data:image/jpeg;base64,")
        if "," in request.image:
            header, encoded = request.image.split(",", 1)
        else:
            encoded = request.image
        
        image_data = base64.b64decode(encoded)
        
        logging.info("Sending image to Hugging Face for gender verification")
        
        # 2. Send to Hugging Face
        response = await huggingface_client.query_image(image_data)
        
        logging.info(f"Hugging Face raw response: {response}")

        # 3. Clear memory immediately
        del image_data
        image_data = None
        
        # 4. Handle API errors
        if isinstance(response, dict) and "error" in response:
            logging.error(f"Hugging Face API returned error: {response['error']}")
            raise HTTPException(status_code=500, detail=response["error"])
            
        if not isinstance(response, list):
             # Ensure we got a list of classifications
            logging.error(f"Unexpected response format: {response}")
            raise HTTPException(status_code=500, detail="Invalid response from model")

        # 5. Parse response
        # Expected response: [{'label': 'Female', 'score': 0.9}, {'label': 'Male', 'score': 0.1}]
        # Sort by score descending just in case
        sorted_predictions = sorted(response, key=lambda x: x.get('score', 0), reverse=True)
        top_prediction = sorted_predictions[0]
        
        label = top_prediction.get('label', '').capitalize()
        
        if label not in ['Male', 'Female']:
            # Fallback or strict check depending on model
            # Some models use 'man', 'woman', 'm', 'f'
            if 'man' in label.lower() or 'male' in label.lower() and 'fe' not in label.lower():
                label = "Male"
            elif 'woman' in label.lower() or 'female' in label.lower():
                label = "Female"
            else:
                 return {"gender": "Unknown", "details": label}

        return {"gender": label}

    except Exception as e:
        logging.error(f"Gender verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
    finally:
        # Explicit cleanup in finally block as double safety
        if image_data:
            del image_data
