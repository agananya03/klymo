import requests
import uuid
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.sql_models import User
from datetime import datetime

# Setup DB connection for seeding
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

BASE_URL = "http://127.0.0.1:8000/api/v1/matching"

def create_test_user(device_id, gender):
    user = db.query(User).filter(User.device_id == device_id).first()
    if not user:
        user = User(
            device_id=device_id,
            gender=gender,
            nickname=f"Test-{gender}",
            verified_at=datetime.now()
        )
        db.add(user)
        db.commit()
    return user

def join(device_id, preference):
    try:
        res = requests.post(f"{BASE_URL}/join", json={"device_id": device_id, "preference": preference})
        return res.json()
    except Exception as e:
        return {"status": "error", "message": str(e)}

def test_scenarios():
    print("--- 1. SAME GENDER MATCH (Male seeking Male) ---")
    u1 = "m_want_m_1"
    u2 = "m_want_m_2"
    create_test_user(u1, "male")
    create_test_user(u2, "male")
    
    # User 1 Joins
    print(f"User 1 joins (Pref: male)...")
    r1 = join(u1, "male")
    print(f"User 1 Result: {r1['status']}")
    
    # User 2 Joins
    print(f"User 2 joins (Pref: male)...")
    r2 = join(u2, "male")
    print(f"User 2 Result: {r2['status']}")
    
    if r2['status'] == 'matched':
        print("SUCCESS: Same gender match occurred.")
    else:
        print("FAILED: Expected match.")

    print("\n--- 2. OPPOSITE GENDER MATCH (Male <> Female) ---")
    u3 = "m_want_f"
    u4 = "f_want_m"
    create_test_user(u3, "male")
    create_test_user(u4, "female")
    
    print(f"User 3 (Male) joins (Pref: female)...")
    r3 = join(u3, "female")
    print(f"User 3 Result: {r3['status']}")
    
    print(f"User 4 (Female) joins (Pref: male)...")
    r4 = join(u4, "male")
    print(f"User 4 Result: {r4['status']}")
    
    if r4['status'] == 'matched':
        print("SUCCESS: Opposite gender match occurred.")
    else:
        print("FAILED: Expected match.")

    print("\n--- 3. ANY PREFERENCE MATCH (Female <> Any) ---")
    u5 = "any_want_any" # Male
    u6 = "f_want_any"   # Female
    create_test_user(u5, "male")
    create_test_user(u6, "female")
    
    print(f"User 5 (Male) joins (Pref: any)...")
    r5 = join(u5, "any")
    print(f"User 5 Result: {r5['status']}")
    
    print(f"User 6 (Female) joins (Pref: any)...")
    r6 = join(u6, "any")
    print(f"User 6 Result: {r6['status']}")
    
    if r6['status'] == 'matched':
        print("SUCCESS: Any preference match occurred.")
    else:
        print("FAILED: Expected match.")
        
    # Cleanup queues just in case
    requests.post(f"{BASE_URL}/leave", json={"device_id": u1})
    requests.post(f"{BASE_URL}/leave", json={"device_id": u3})
    requests.post(f"{BASE_URL}/leave", json={"device_id": u5})

if __name__ == "__main__":
    try:
        test_scenarios()
    finally:
        db.close()
