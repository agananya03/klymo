import requests
import uuid
import io
from PIL import Image

def create_dummy_image():
    # Create a simple 100x100 RGB image
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    return img_byte_arr

def test_verification():
    url = "http://localhost:8000/api/v1/verification/verify-gender"
    device_id = f"test-device-{uuid.uuid4()}"
    
    print(f"Testing Verification Endpoint: {url}")
    print(f"Device ID: {device_id}")

    # Create dummy image
    img_bytes = create_dummy_image()

    files = {
        'file': ('test.jpg', img_bytes, 'image/jpeg')
    }
    data = {
        'device_id': device_id
    }

    try:
        response = requests.post(url, files=files, data=data)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", response.json())
        else:
            print("Error Response:", response.text)

    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    try:
        import PIL
        test_verification()
    except ImportError:
        print("Pillow (PIL) not installed. Please install it to run this test: pip install pillow")
