import uuid
import logging
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COOLDOWN_SECONDS = 30  # Cooldown after leaving chat

@dataclass
class WaitingUser:
    sid: str
    device_id: str
    gender: Optional[str] = None
    preferred_gender: Optional[str] = None
    joined_at: datetime = field(default_factory=datetime.utcnow)

@dataclass 
class ChatSession:
    session_id: str
    user1_sid: str
    user1_device_id: str
    user2_sid: str
    user2_device_id: str
    started_at: datetime = field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    ended_by: Optional[str] = None

class MatchingService:
    def __init__(self):
        self.waiting_queue: List[WaitingUser] = []
        self.active_sessions: Dict[str, ChatSession] = {}
        self.user_sessions: Dict[str, str] = {}
        self.cooldowns: Dict[str, datetime] = {}
    
    def is_on_cooldown(self, device_id: str) -> bool:
        if device_id not in self.cooldowns:
            return False
        cooldown_end = self.cooldowns[device_id]
        if datetime.utcnow() < cooldown_end:
            return True
        del self.cooldowns[device_id]
        return False
    
    def get_cooldown_remaining(self, device_id: str) -> int:
        if device_id not in self.cooldowns:
            return 0
        remaining = (self.cooldowns[device_id] - datetime.utcnow()).total_seconds()
        return max(0, int(remaining))
    
    def set_cooldown(self, device_id: str):
        self.cooldowns[device_id] = datetime.utcnow() + timedelta(seconds=COOLDOWN_SECONDS)
        logger.info(f"Cooldown set for {device_id}: {COOLDOWN_SECONDS}s")
    
    def add_to_queue(
        self, 
        sid: str, 
        device_id: str,
        gender: Optional[str] = None, 
        preferred_gender: Optional[str] = None
    ) -> Optional[ChatSession]:
        if self.is_on_cooldown(device_id):
            logger.info(f"User {device_id} is on cooldown")
            return None
        
        for u in self.waiting_queue:
            if u.sid == sid or u.device_id == device_id:
                logger.info(f"User {device_id} already in queue")
                return None
        
        user = WaitingUser(
            sid=sid, 
            device_id=device_id, 
            gender=gender, 
            preferred_gender=preferred_gender
        )
        
        match = self._find_match(user)
        if match:
            session = self._create_session(user, match)
            return session
        
        self.waiting_queue.append(user)
        logger.info(f"User {device_id} added to queue. Queue size: {len(self.waiting_queue)}")
        return None
    
    def remove_from_queue(self, sid: str):
        self.waiting_queue = [u for u in self.waiting_queue if u.sid != sid]
    
    def end_session(self, session_id: str, ended_by_sid: str, apply_cooldown: bool = True) -> Optional[ChatSession]:
        if session_id not in self.active_sessions:
            return None
        
        session = self.active_sessions[session_id]
        session.ended_at = datetime.utcnow()
        session.ended_by = ended_by_sid
        
        if session.user1_sid in self.user_sessions:
            del self.user_sessions[session.user1_sid]
        if session.user2_sid in self.user_sessions:
            del self.user_sessions[session.user2_sid]
        
        del self.active_sessions[session_id]
        
        if apply_cooldown:
            if ended_by_sid == session.user1_sid:
                self.set_cooldown(session.user1_device_id)
            else:
                self.set_cooldown(session.user2_device_id)
        
        logger.info(f"Session {session_id} ended by {ended_by_sid}")
        return session
    
    def get_session_by_sid(self, sid: str) -> Optional[ChatSession]:
        session_id = self.user_sessions.get(sid)
        if session_id:
            return self.active_sessions.get(session_id)
        return None
    
    def get_partner_sid(self, sid: str) -> Optional[str]:
        session = self.get_session_by_sid(sid)
        if session:
            if session.user1_sid == sid:
                return session.user2_sid
            return session.user1_sid
        return None
    
    def _find_match(self, user: WaitingUser) -> Optional[WaitingUser]:
        for waiting in self.waiting_queue:
            if waiting.device_id == user.device_id:
                continue
            if self._is_compatible(user, waiting):
                return waiting
        return None
    
    def _is_compatible(self, user1: WaitingUser, user2: WaitingUser) -> bool:
        if user1.preferred_gender and user2.gender:
            if user1.preferred_gender.lower() != user2.gender.lower():
                return False
        if user2.preferred_gender and user1.gender:
            if user2.preferred_gender.lower() != user1.gender.lower():
                return False
        return True
    
    def _create_session(self, user1: WaitingUser, user2: WaitingUser) -> ChatSession:
        self.waiting_queue = [u for u in self.waiting_queue if u.sid != user2.sid]
        
        session_id = str(uuid.uuid4())
        session = ChatSession(
            session_id=session_id,
            user1_sid=user1.sid,
            user1_device_id=user1.device_id,
            user2_sid=user2.sid,
            user2_device_id=user2.device_id
        )
        
        self.active_sessions[session_id] = session
        self.user_sessions[user1.sid] = session_id
        self.user_sessions[user2.sid] = session_id
        
        logger.info(f"Session created: {session_id} ({user1.device_id} + {user2.device_id})")
        return session
    
    def get_queue_size(self) -> int:
        return len(self.waiting_queue)

matching_service = MatchingService()
