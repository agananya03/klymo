from datetime import datetime
import time
import json
from app.services.matching_service import mapping_service
from app.core.database import SessionLocal
from app.models.sql_models import User
from app.core.redis_client import redis_client

def simulate():
    db = SessionLocal()
    
    # Create Dummy Users
    user_a_id = f"test_m_a_{int(time.time())}"
    user_b_id = f"test_f_b_{int(time.time())}"
    user_c_id = f"test_m_c_{int(time.time())}"
    user_d_id = f"test_f_d_{int(time.time())}"
    
    user_a = User(device_id=user_a_id, gender="male", verified_at=datetime.utcnow())
    user_b = User(device_id=user_b_id, gender="female", verified_at=datetime.utcnow())
    user_c = User(device_id=user_c_id, gender="male", verified_at=datetime.utcnow())
    user_d = User(device_id=user_d_id, gender="female", verified_at=datetime.utcnow())
    
    db.add_all([user_a, user_b, user_c, user_d])
    db.commit()
    
    # Clear Redis for test
    r = redis_client.get_client()
    if r:
        r.flushdb()
    else:
        print("Redis unavailable")
        return
    
    print("\n==========================================")
    print("SCENARIO 1: Matching with shared interests")
    print("==========================================")
    print(f"User A (Male, ['Gaming', 'Music']) joins queue...")
    res_a = mapping_service.find_match(user_a_id, "male", "female", ["Gaming", "Music"])
    print(f"Result A: {res_a}")
    
    print(f"User B (Female, ['Music', 'Tech']) joins queue (should match A on 'Music')...")
    res_b = mapping_service.find_match(user_b_id, "female", "male", ["Music", "Tech"])
    print(f"Result B: {res_b}")
    
    if res_b.get("status") == "matched" and res_b.get("common_interest") == "Music":
        print("SUCCESS: Instant match on common interest 'Music'!")
    else:
        print("FAILURE: Did not match instantly on common interest.")

    # Clear Redis for Scenario 2
    r.flushdb()
    
    print("\n==========================================")
    print("SCENARIO 2: No match with different interests (within 10s)")
    print("==========================================")
    print(f"User C (Male, ['Gaming']) joins queue...")
    res_c = mapping_service.find_match(user_c_id, "male", "female", ["Gaming"])
    print(f"Result C: {res_c}")
    
    print(f"User D (Female, ['Tech']) joins queue immediately (should NOT match C)...")
    res_d = mapping_service.find_match(user_d_id, "female", "male", ["Tech"])
    print(f"Result D: {res_d}")
    
    if res_d.get("status") == "queued":
        print("SUCCESS: Did not match immediately due to mismatched interests!")
    else:
        print("FAILURE: Matched immediately despite different interests and <10s elapsed.")

    print("\n==========================================")
    print("SCENARIO 3: Fallback match after 10 seconds")
    print("==========================================")
    print("Sleeping for 11 seconds to trigger fallback...")
    time.sleep(11)
    
    # We clear queue for D so D can search again (C is still in queue)
    mapping_service.leave_queue(user_d_id)
    
    print(f"User D (Female, ['Tech']) searches again (User C has waited >10s)...")
    res_d_fallback = mapping_service.find_match(user_d_id, "female", "male", ["Tech"])
    print(f"Result D (Fallback): {res_d_fallback}")
    
    if res_d_fallback.get("status") == "matched":
        print("SUCCESS: Matched via random fallback after 10s wait time!")
        if "common_interest" in res_d_fallback:
            print(f"FAILURE: Got common_interest '{res_d_fallback['common_interest']}' but interests are mismatched.")
        else:
            print("SUCCESS: No common interest set, as expected.")
    else:
        print("FAILURE: Failed to match even after wait timeout elapsed.")
        
    db.close()

if __name__ == "__main__":
    simulate()
