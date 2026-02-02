from datetime import datetime
import time
import json
from app.services.matching_service import mapping_service
from app.core.database import SessionLocal
from app.models.sql_models import User
from app.core.redis_client import redis_client

def simulate():
    db = SessionLocal()
    
    # 1. Create Dummy Users
    user_a_id = f"test_male_{int(time.time())}"
    user_b_id = f"test_female_{int(time.time())}"
    
    # Use UTC now
    user_a = User(device_id=user_a_id, gender="male", verified_at=datetime.utcnow())
    user_b = User(device_id=user_b_id, gender="female", verified_at=datetime.utcnow())
    
    db.add(user_a)
    db.add(user_b)
    db.commit()
    
    # 2. Clear Redis for test
    r = redis_client.get_client()
    if r:
        r.flushdb()
    else:
        print("Redis unavailable")
        return
    
    print(f"--- Simulation Start ---")
    print(f"User A (Male) seeking Female. ID: {user_a_id}")
    print(f"User B (Female) seeking Male. ID: {user_b_id}")
    
    # 3. User A joins (Should be queued)
    print("\n>>> User A Joins Queue...")
    # MatchingService.find_match(user_id, gender, preference)
    res_a = mapping_service.find_match(user_a_id, "male", "female")
    print(f"Result A: {res_a}")
    
    # 4. User B joins (Should match A)
    print("\n>>> User B Joins Queue...")
    res_b = mapping_service.find_match(user_b_id, "female", "male")
    print(f"Result B: {res_b}")
    
    if res_b and res_b.get('status') == 'matched':
        print("\nSUCCESS: Match found!")
    else:
        print("\nFAILURE: No match found.")
        
    db.close()

if __name__ == "__main__":
    simulate()
