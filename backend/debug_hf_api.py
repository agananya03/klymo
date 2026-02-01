import asyncio
import os
from dotenv import load_dotenv
import httpx

# Load env directly to be sure
load_dotenv(".env")

API_KEY = os.getenv("HUGGINGFACE_API_KEY")
MODEL_URL = "https://router.huggingface.co/hf-inference/models/rizvandwiki/gender-classification-2"

print(f"API_KEY: {API_KEY[:5]}..." if API_KEY else "API_KEY: None")
print(f"MODEL_URL: {MODEL_URL}")

async def test_api():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    payload = {"inputs": "Test text because some image models accept text too for debugging, or we send a dummy request to check valid URL"}
    
    # Better: Use a small sample image or just check if URL exists (HEAD request or GET)
    # But HF Inference API expects POST.
    
    print("Sending request...")
    async with httpx.AsyncClient() as client:
        try:
            # We send an empty request or simple payload to check connection/auth
            response = await client.post(
                MODEL_URL, 
                headers=headers, 
                json={"inputs": "hello"}, 
                timeout=10.0
            )
            print(f"Status: {response.status_code}")
            print(f"Response text: {response.text[:500]}")
            try:
                print(f"JSON: {response.json()}")
            except:
                pass
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    if not API_KEY or not MODEL_URL:
        print("Missing config!")
    else:
        asyncio.run(test_api())
