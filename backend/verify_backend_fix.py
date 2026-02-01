import asyncio
import os
import sys

# Add backend directory to path so we can import app modules
sys.path.append(os.path.abspath(r"c:\Users\tanay\Klymo\klymo\backend"))

from app.services.gender_verification import verify_gender_from_bytes
from app.core.config import settings

async def test_verification():
    print(f"Testing with Model URL: {settings.clean_model_url}")
    
    image_path = r"C:/Users/tanay/.gemini/antigravity/brain/fa33ab80-b34f-43be-bcbd-33de5730abbe/uploaded_media_1769953787716.png"
    
    if not os.path.exists(image_path):
        print(f"Error: Test image not found at {image_path}")
        return

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    print("Sending request...")
    try:
        result = await verify_gender_from_bytes(image_bytes)
        print("Result:", result)
        
        if isinstance(result, list) and len(result) > 0 and "label" in result[0]:
            print("SUCCESS: Received valid classification response.")
        else:
            print("FAILURE: Received unexpected response format.")

    except Exception as e:
        print(f"FAILURE: Exception occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test_verification())
