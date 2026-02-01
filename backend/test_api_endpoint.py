import httpx
import asyncio
import os

# Path to the image we've been using
IMAGE_PATH = r"C:/Users/tanay/.gemini/antigravity/brain/fa33ab80-b34f-43be-bcbd-33de5730abbe/uploaded_media_1769953787716.png"
URL = "http://127.0.0.1:8000/api/v1/verification/verify-gender"

async def test_endpoint():
    if not os.path.exists(IMAGE_PATH):
        print(f"Image not found at {IMAGE_PATH}")
        return

    print(f"Sending request to {URL}...")
    
    async with httpx.AsyncClient() as client:
        try:
            # Prepare multipart form data
            files = {'file': ('test.png', open(IMAGE_PATH, 'rb'), 'image/png')}
            data = {'device_id': 'test_device_123'}
            
            response = await client.post(URL, data=data, files=files, timeout=30.0)
            
            print(f"Status Code: {response.status_code}")
            print("Raw Response Text:")
            print("--------------------------------------------------")
            print(response.text)
            print("--------------------------------------------------")
            
        except httpx.RequestError as exc:
            print(f"An error occurred while requesting {exc.request.url!r}.")
            print(f"Exception: {exc}")
        except Exception as e:
            print(f"Unexpected error: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoint())
