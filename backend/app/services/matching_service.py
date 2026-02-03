import json
import time
import logging
from typing import Optional, Dict, Tuple, Union
from app.core.redis_client import redis_client

logger = logging.getLogger(__name__)

class MatchingService:
    QUEUE_MALE = "queue:waiting:male"
    QUEUE_FEMALE = "queue:waiting:female"
    QUEUE_ANY = "queue:waiting:any"
    
    COOLDOWN_PREFIX = "cooldown:match:"
    LIMIT_PREFIX = "limit:match:"
    
    COOLDOWN_SECONDS = 300  # Prevent spam re-queuing
    DAILY_LIMIT = 5        # Freemium limit simulation

    def __init__(self):
        self.redis = redis_client.get_client()

    def _get_queue_key(self, preference: str) -> str:
        if preference == "male":
            return self.QUEUE_MALE
        elif preference == "female":
            return self.QUEUE_FEMALE
        else:
            return self.QUEUE_ANY

    def _check_cooldown(self, user_id: str) -> int:
        """Returns remaining cooldown seconds, or 0 if allowed."""
        key = f"{self.COOLDOWN_PREFIX}{user_id}"
        ttl = self.redis.ttl(key)
        return ttl if ttl > 0 else 0

    def _check_daily_limit(self, user_id: str) -> bool:
        """Returns True if user exceeded daily limit."""
        # Simple daily limit key based on date
        today = time.strftime("%Y-%m-%d")
        key = f"{self.LIMIT_PREFIX}{today}:{user_id}"
        count = self.redis.get(key)
        if count and int(count) >= self.DAILY_LIMIT:
            return True
        return False

    def _increment_daily_limit(self, user_id: str):
         today = time.strftime("%Y-%m-%d")
         key = f"{self.LIMIT_PREFIX}{today}:{user_id}"
         self.redis.incr(key)
         self.redis.expire(key, 86400) # 24 hours
         
         # Persist to SQL (Audit Trail)
         from app.core.database import SessionLocal
         from app.models.sql_models import DailyUsage
         
         db = SessionLocal()
         try:
             # Upsert logic (simplistic: try get, if not create, else update)
             usage = db.query(DailyUsage).filter(
                 DailyUsage.device_id == user_id, 
                 DailyUsage.date == today
             ).first()
             
             if not usage:
                 usage = DailyUsage(device_id=user_id, date=today, specific_matches_count=1)
                 db.add(usage)
             else:
                 usage.specific_matches_count += 1
             
             db.commit()
         except Exception as e:
             logger.error(f"Failed to update DailyUsage SQL: {e}")
         finally:
             db.close()

    def _set_cooldown(self, user_id: str):
        key = f"{self.COOLDOWN_PREFIX}{user_id}"
        self.redis.set(key, "1", ex=self.COOLDOWN_SECONDS)

    def find_match(self, user_id: str, gender: str, preference: str) -> Dict[str, Union[str, int]]:
        """
        Main matching algorithms.
        Returns: 
           - {'status': 'matched', 'session_id': '...', 'partner': '...'}
           - {'status': 'queued'}
           - {'status': 'cooldown', 'wait': 15}
           - {'status': 'limit_reached'}
        """
        if not self.redis:
             return {"status": "error", "message": "Redis unavailable"}

        # 1. Cooldown Check
        wait_time = self._check_cooldown(user_id)
        if wait_time > 0:
            return {"status": "cooldown", "wait": wait_time}

        # 2. Daily Limit Check (Only for specific filters)
        if preference != "any" and self._check_daily_limit(user_id):
            return {"status": "limit_reached", "message": "Daily limit for filtered matches reached (5/day). Try 'Any' to keep matching!"}

        # 3. Determine Search Queues (Where do I look?)
        # - If I want Male: Look in Male Queue (contains Males) and Any Queue (contains people of any gender with Any pref)
        # - If I want Female: Look in Female Queue (contains Females) and Any Queue
        # - If I want Any: Look in Male Queue, Female Queue, and Any Queue
        
        search_queues = []
        if preference == "male":
            search_queues = [self.QUEUE_MALE, self.QUEUE_ANY]
        elif preference == "female":
            search_queues = [self.QUEUE_FEMALE, self.QUEUE_ANY]
        else: # preference == "any"
            search_queues = [self.QUEUE_MALE, self.QUEUE_FEMALE, self.QUEUE_ANY]

        # 4. Search for Match (FIFO - Oldest First)
        # We LPOP from the head of the lists.
        
        for queue_name in search_queues:
            # Iterate up to 50 candidates deep to find a match
            # To preserve order, we rotated checked candidates to the tail? 
            # OR we just LPOP and RPUSH back if not match. 
            # Note: This cycles the queue. 
            
            for _ in range(50):
                candidate_json = self.redis.lpop(queue_name)
                if not candidate_json:
                    break # Queue empty
                
                candidate = json.loads(candidate_json)
                c_id = candidate['user_id']
                c_gender = candidate['gender']
                c_pref = candidate['preference']
                
                logger.info(f"Checking candidate: {c_id} ({c_gender}) for {user_id} ({gender})")

                # Prevent matching with self
                if c_id == user_id:
                    self.redis.rpush(queue_name, candidate_json) # Move to tail? Or push back to head?
                    # If we simply push back to head, we infinite loop on self.
                    # Pushing to tail cycles the queue.
                    continue

                # 5. Verify Bidirectional Compatibility
                is_compatible = False
                if preference == "any" or preference == c_gender:
                    if c_pref == "any" or c_pref == gender:
                        is_compatible = True
                
                if is_compatible:
                    # 6. Match Found
                    sorted_ids = sorted([user_id, c_id])
                    session_id = f"session_{sorted_ids[0]}_{sorted_ids[1]}_{int(time.time())}"
                    
                    # Only increment limit if specific preference was used
                    if preference != "any":
                        self._increment_daily_limit(user_id)
                    
                    # For partner, we don't know their preference here easily without checking.
                    # Ideally we should decrement their limit if *they* had a preference.
                    # But the candidate object has 'preference'.
                    if c_pref != "any":
                        self._increment_daily_limit(c_id)

                    self._set_cooldown(user_id)
                    self._set_cooldown(c_id)
                    
                    logger.info(f"Match SUCCESS: {user_id} <-> {c_id}")
                    return {
                        "status": "matched",
                        "session_id": session_id,
                        "partner_id": c_id,
                        "partner_gender": c_gender
                    }
                else:
                    # Not compatible: Return to TAIL to give others a chance?
                    # Or HEAD to keep priority?
                    # Standard FIFO: If not compatible with ME, they might be compatible with next person.
                    # If I put them at TAIL, they lose their spot. 
                    # Ideally I put them back at HEAD? But then I can't look at next person.
                    # Valid Strategy: Rotate Queue. Pop Head, Check, Push Tail.
                    # If I don't match, I leave them at Tail. 
                    # This shuffles the queue order slightly but allows deep search.
                    self.redis.rpush(queue_name, candidate_json)
            
            # End of queue loop
                
        # 7. No Match -> Add User to Waiting Queue
        # Logic:
        # - If my preference is "any", I join QUEUE_ANY.
        # - If my preference is specific, I join My Gender Queue (so those looking for me can find me).
        #   (e.g. Male seeking Female joins QUEUE_MALE. Females seeking Males search QUEUE_MALE).
        
        join_queue = ""
        if preference == "any":
            join_queue = self.QUEUE_ANY
        elif gender == "male":
            join_queue = self.QUEUE_MALE
        elif gender == "female":
            join_queue = self.QUEUE_FEMALE
        else:
            # Fallback for non-binary/other if not explicitly handled by queues
            join_queue = self.QUEUE_ANY 
            
        user_data = {
            "user_id": user_id,
            "gender": gender,
            "preference": preference,
            "joined_at": time.time()
        }
        
        # RPUSH to add to TAIL (Right) of the list (Newest users wait at back)
        self.redis.rpush(join_queue, json.dumps(user_data))
        
        return {"status": "queued", "message": "Waiting for match..."}

    def leave_queue(self, user_id: str):
        """Removes user from all queues."""
        queues = [self.QUEUE_MALE, self.QUEUE_FEMALE, self.QUEUE_ANY]
        for q in queues:
            redis_client.remove_from_queue(q, user_id)

mapping_service = MatchingService()
