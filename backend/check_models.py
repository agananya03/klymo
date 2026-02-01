import httpx
import asyncio

models_to_test = [
    "prithivMLmods/Gender-Classifier-Mini",
    "Luke/gender-classification",
    "google/vit-base-patch16-224"
]

async def check_model(model_id):
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    print(f"Checking {model_id}...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            print(f"{model_id}: {response.status_code}")
            if response.status_code != 410 and response.status_code != 404:
                return str(url)
    except Exception as e:
        print(f"{model_id} failed: {e}")
    return None

async def main():
    for model in models_to_test:
        result = await check_model(model)
        if result:
            print(f"FOUND WORKING MODEL: {result}")
            # print(f"Please update config.py to use this URL.")
            break

if __name__ == "__main__":
    asyncio.run(main())
