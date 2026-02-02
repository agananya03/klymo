import time
import uuid
import logging
from sqlalchemy.orm import Session as DBSession
from app.core.redis_client import redis_client
from app.models.sql_models import Session, User

logger = logging.getLogger(__name__)

class MatchingService:
    @staticmethod
    def join_queue(db: DBSession, device_id: str, preference: str):
        """
        Attempts to find a match for the user. If none found, queues them.
        """
        # 1. Get User Details
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user:
            raise ValueError("User not verified/found")
        
        my_gender = user.gender # 'male' or 'female'
        
        # 2. Determine Queues to Search (Targeting people who want ME)
        # People who want ME are in:
        # - queue:waiting:{my_gender} (Specific preference for my gender)
        # - queue:waiting:any     (Open to any gender)
        target_queues = [
            f"queue:waiting:{my_gender}",
            "queue:waiting:any"
        ]
        
        # 3. Execute Atomic Finding
        logger.info(f"User {device_id} ({my_gender}) seeking {preference}. Scanning {target_queues}")
        match_data = redis_client.find_match(target_queues, preference, my_gender)
        
        if match_data:
            # MATCH FOUND!
            partner_id = match_data['device_id']
            logger.info(f"Match found: {device_id} <> {partner_id}")
            
            # 4. Create Session in DB
            new_session = Session(
                user1_device_id=device_id,
                user2_device_id=partner_id,
            )
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            
            return {
                "status": "matched",
                "session_id": str(new_session.session_id),
                "partner": {
                    "nickname": match_data.get('nickname'), 
                    "device_id": partner_id 
                }
            }
        else:
            # NO MATCH -> QUEUE MYSELF
            my_queue_key = f"queue:waiting:{preference}"
            
            user_packet = {
                "device_id": device_id,
                "gender": my_gender,
                "preference": preference,
                "nickname": user.nickname,
                "joined_at": time.time()
            }
            
            redis_client.push_to_queue(my_queue_key, user_packet)
            logger.info(f"User queued in {my_queue_key}")
            
            return {
                "status": "queued",
                "message": "Waiting for a partner..."
            }

    @staticmethod
    def leave_queue(device_id: str):
        queues = ["queue:waiting:male", "queue:waiting:female", "queue:waiting:any"]
        for q in queues:
            if redis_client.remove_from_queue(q, device_id):
                return True
        return False
