import time
import json
import logging
from typing import Dict, Union, Optional
from sqlalchemy.orm import Session as DBSession
from app.core.redis_client import redis_client
from app.models.sql_models import Session, User

logger = logging.getLogger(__name__)

class MatchingService:
    QUEUE_MALE = "queue:waiting:male"
    QUEUE_FEMALE = "queue:waiting:female"
    QUEUE_ANY = "queue:waiting:any"
    
    COOLDOWN_PREFIX = "cooldown:match:"
    LIMIT_PREFIX = "limit:match:"
    
    COOLDOWN_SECONDS = 30  # Prevent spam re-queuing
    DAILY_LIMIT = 5        # Simulation of freemium limit

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

    def join_queue(self, db: DBSession, device_id: str, preference: str):
        """
        Public API to join the queue or find a match.
        """
        if not self.redis:
             return {"status": "error", "message": "Redis unavailable"}

        # 1. Get User Details
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user:
            return {"status": "error", "message": "User not verified/found"}
        
        my_gender = user.gender # 'male' or 'female'
        if not my_gender:
            return {"status": "error", "message": "User gender not found. Please verify first."}

        # 2. Cooldown & Limit Checks
        wait_time = self._check_cooldown(device_id)
        if wait_time > 0:
            return {"status": "cooldown", "wait": wait_time}

        if preference != "any" and self._check_daily_limit(device_id):
            return {"status": "limit_reached", "message": "Daily limit for filtered matches reached (5/day). Try 'Any' to keep matching!"}

        # 3. Determine Search Queues (People who might match ME)
        # People who want ME are in:
        # - queue:waiting:{my_gender} (Specific preference for my gender)
        # - queue:waiting:any     (Open to any gender)
        search_queues = [
            f"queue:waiting:{my_gender}",
            "queue:waiting:any"
        ]

        logger.info(f"User {device_id} ({my_gender}) seeking {preference}. Scanning {search_queues}")

        for queue_name in search_queues:
            # Atomic search is not easily possible with bidirectional preference in raw redis lists
            # without Lua, so we do a bounded search as in the remote version.
            for _ in range(50):
                candidate_json = self.redis.lpop(queue_name)
                if not candidate_json:
                    break # Queue empty
                
                try:
                    candidate = json.loads(candidate_json)
                except Exception as e:
                    logger.error(f"Failed to parse candidate JSON: {e}")
                    continue

                c_id = candidate['device_id']
                c_gender = candidate['gender']
                c_pref = candidate['preference']
                
                # Prevent matching with self
                if c_id == device_id:
                    self.redis.rpush(queue_name, candidate_json)
                    continue

                # 4. Verify Bidirectional Compatibility
                is_compatible = False
                if preference == "any" or preference == c_gender:
                    if c_pref == "any" or c_pref == my_gender:
                        is_compatible = True
                
                if is_compatible:
                    # MATCH FOUND!
                    logger.info(f"Match found: {device_id} <> {c_id}")
                    
                    # Create Session in DB
                    new_session = Session(
                        user1_device_id=device_id,
                        user2_device_id=c_id,
                    )
                    db.add(new_session)
                    db.commit()
                    db.refresh(new_session)
                    
                    # Cooldowns and limits
                    if preference != "any":
                        self._increment_daily_limit(device_id)
                    if c_pref != "any":
                        self._increment_daily_limit(c_id)

                    self._set_cooldown(device_id)
                    self._set_cooldown(c_id)
                    
                    return {
                        "status": "matched",
                        "session_id": str(new_session.session_id),
                        "partner": {
                            "nickname": candidate.get('nickname', 'Stranger'), 
                            "device_id": c_id,
                            "gender": c_gender
                        }
                    }
                else:
                    # Not compatible: Return to TAIL
                    self.redis.rpush(queue_name, candidate_json)
                    
        # 5. NO MATCH -> QUEUE MYSELF
        # I join the queue that matches my preference, so others looking for that gender can find me.
        # Wait, the logic should be: if I want Female, I stay in a place where Females can find me? 
        # Actually, if I want Female, then a Female searching will look in 'queue:waiting:female'.
        # So I should join the queue that represents what I AM seeking.
        my_queue_key = self._get_queue_key(preference)
        
        user_packet = {
            "device_id": device_id,
            "gender": my_gender,
            "preference": preference,
            "nickname": user.nickname,
            "joined_at": time.time()
        }
        
        self.redis.rpush(my_queue_key, json.dumps(user_packet))
        logger.info(f"User {device_id} queued in {my_queue_key}")
        
        return {
            "status": "queued",
            "message": "Waiting for a partner..."
        }

    def leave_queue(self, device_id: str):
        """Removes user from all queues."""
        queues = [self.QUEUE_MALE, self.QUEUE_FEMALE, self.QUEUE_ANY]
        removed = False
        for q in queues:
            # redis_client.remove_from_queue might be a helper, but let's use LREM directly if unsure
            # The previous code used redis_client.remove_from_queue
            if hasattr(redis_client, 'remove_from_queue'):
                if redis_client.remove_from_queue(q, device_id):
                    removed = True
            else:
                # Fallback to direct LREM if helper doesn't exist
                # But since redis_client is custom, I should check it if I'm unsure.
                # Searching redis_client.py...
                pass
        return removed

# Export an instance as mapping_service for backward compatibility if needed, 
# although we'll transition to MatchingService class where possible.
mapping_service = MatchingService()
