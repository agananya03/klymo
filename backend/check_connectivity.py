import httpx
import asyncio
import sys

async def check_site(url):
    print(f"Checking access to {url}...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            print(f"SUCCESS: {url} returned {response.status_code}")
    except Exception as e:
        print(f"FAILURE: Could not reach {url}")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")

async def main():
    await check_site("https://www.google.com")
    await check_site("https://api-inference.huggingface.co/models/rizvandwiki/gender-classification-2")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
