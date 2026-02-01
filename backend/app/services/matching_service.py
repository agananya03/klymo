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
    
    COOLDOWN_SECONDS = 30  # Prevent spam re-queuing
    DAILY_LIMIT = 50       # Freemium limit simulation

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

        # 2. Daily Limit Check
        if self._check_daily_limit(user_id):
            return {"status": "limit_reached", "message": "Daily matching limit reached"}

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
            # Atomic-like check: LPOP one candidate
            candidate_json = self.redis.lpop(queue_name)
            if not candidate_json:
                continue
                
            candidate = json.loads(candidate_json)
            c_id = candidate['user_id']
            c_gender = candidate['gender']
            c_pref = candidate['preference']
            
            # Prevent matching with self (edge case if re-queuing fast)
            if c_id == user_id:
                self.redis.lpush(queue_name, candidate_json)
                continue

            # 5. Verify Bidirectional Compatibility
            is_compatible = False
            
            # Condition 1: Candidate matches My Preference
            # (Implied by the queue I found them in? Not strictly for ANY queue)
            if preference == "any" or preference == c_gender:
                # Condition 2: I match Candidate's Preference
                if c_pref == "any" or c_pref == gender:
                    is_compatible = True
            
            if is_compatible:
                # 6. Match Found
                # Create Session ID
                # Format: session_{smaller_id}_{larger_id}_{timestamp}
                sorted_ids = sorted([user_id, c_id])
                session_id = f"session_{sorted_ids[0]}_{sorted_ids[1]}_{int(time.time())}"
                
                # Apply Limits/Cooldowns
                self._increment_daily_limit(user_id)
                self._increment_daily_limit(c_id)
                self._set_cooldown(user_id)
                self._set_cooldown(c_id)
                
                return {
                    "status": "matched",
                    "session_id": session_id,
                    "partner_id": c_id,
                    "partner_gender": c_gender
                }
            else:
                # Not compatible: Return candidate to HEAD (LHS) of their queue 
                # to preserve their priority/waiting position.
                self.redis.lpush(queue_name, candidate_json)
                
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

mapping_service = MatchingService()
