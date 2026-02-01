from typing import Any, Dict, Optional
import httpx
from app.core.config import settings
import logging

class HuggingFaceClient:
    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.model_url = settings.HUGGINGFACE_MODEL_URL
        if not self.api_key or not self.model_url:
            logging.warning("Hugging Face API key or Model URL not set.")

    async def query(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a query to the Hugging Face Inference API.
        
        Args:
            payload: The data to send (e.g. {"inputs": "..."}).
            
        Returns:
            The parsed JSON response or an error dictionary.
        """
        if not self.api_key or not self.model_url:
            return {"error": "Configuration missing"}

        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.model_url, 
                    headers=headers, 
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logging.error(f"HF API Error {response.status_code}: {response.text}")
                    return {"error": f"API Error: {response.text}", "status_code": response.status_code}
                
                return response.json()
            except httpx.ReadTimeout:
                logging.error("Hugging Face API timeout")
                return {"error": "Request timed out"}
            except Exception as e:
                logging.error(f"Hugging Face API exception: {str(e)}")
                return {"error": f"Exception: {str(e)}"}

    async def query_image(self, image_data: bytes) -> Any:
        """
        Send raw image bytes to the Hugging Face Inference API.
        """
        if not self.api_key or not self.model_url:
            return {"error": "Configuration missing"}

        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.model_url, 
                    headers=headers, 
                    content=image_data,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logging.error(f"HF API Error {response.status_code}: {response.text}")
                    return {"error": f"API Error: {response.text}", "status_code": response.status_code}
                
                return response.json()
            except httpx.ReadTimeout:
                logging.error("Hugging Face API timeout")
                return {"error": "Request timed out"}
            except Exception as e:
                logging.error(f"Hugging Face API exception: {str(e)}")
                return {"error": f"Exception: {str(e)}"}

huggingface_client = HuggingFaceClient()
