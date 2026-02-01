import socketio
import time
import uuid
import sys

# Standard synchronous client
sio = socketio.Client()

BASE_URL = "http://127.0.0.1:8000"

@sio.event
def connect():
    print("I'm connected!")

@sio.event
def connect_error(data):
    print(f"The connection failed! {data}")

@sio.event
def disconnect():
    print("I'm disconnected!")

def test_connection():
    # 1. Test Auth Failure (No device_id)
    print("--- 1. Testing Auth Failure ---")
    try:
        sio.connect(BASE_URL, wait_timeout=2)
    except Exception as e:
        print(f"Failed as expected: {e}")
    
    if sio.connected:
        print("ERROR: Should not be connected without device_id")
        sio.disconnect()
    else:
        print("SUCCESS: Connection rejected without auth.")

    # 2. Test Auth Success
    # We need a valid device_id. Using one from previous tests or a random one IF validation logic allows non-existent?
    # Our logic checks DB: `user = db.query(User).filter(User.device_id == device_id).first()`
    # We must use an existing device_id.
    # Let's assume 'test-profile-...' from debug_profile.py exists or 'm_want_m_1' from matching?
    # 'm_want_m_1' was created in debug_matching.py.
    
    valid_device_id = "m_want_m_1" 
    print(f"\n--- 2. Testing Auth Success ({valid_device_id}) ---")
    
    try:
        sio.connect(BASE_URL, auth={'device_id': valid_device_id}, wait_timeout=5)
        if sio.connected:
            print("SUCCESS: Connected with valid device_id")
            sio.disconnect()
        else:
            print("FAILED: Could not connect")
    except Exception as e:
        print(f"FAILED with unexpected error: {e}")

if __name__ == "__main__":
    test_connection()
