import requests
import io

URL = "http://localhost:8000/api/v1/verification/verify-gender"

def test_verification():
    # Create a dummy image (1x1 pixel black)
    # This might fail the gender check, but we want to see if it causes a 500
    dummy_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01u\x01\x90~\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {
        'file': ('test.png', dummy_image, 'image/png')
    }
    data = {
        'device_id': 'debug_device_123'
    }
    
    try:
        print(f"Sending request to {URL}...")
        resp = requests.post(URL, files=files, data=data)
        print(f"Status Code: {resp.status_code}")
        print(f"Response Text: {resp.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_verification()
