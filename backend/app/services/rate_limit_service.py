from typing import Optional, Dict, Any
import redis
import logging
from datetime import datetime, timedelta
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimitService:
    """
    Handles rate limiting and cooldowns using Redis.
    
    Features:
    - Session cooldowns (prevent rapid re-matching)
    - Daily match limits per user
    - Report spam prevention
    - Verification attempt limits
    """
    
    def __init__(self, redis_client: Optional[redis.Redis]):
        self.redis = redis_client
        if not self.redis:
            logger.warning("RateLimitService initialized without Redis. All limits will be bypassed.")
        
    # ==================== COOLDOWN SYSTEM ====================
    
    def set_session_cooldown(self, device_id: str, cooldown_seconds: int = 10) -> bool:
        if not self.redis:
            return True
        try:
            key = f"cooldown:session:{device_id}"
            self.redis.setex(key, cooldown_seconds, "1")
            return True
        except Exception as e:
            logger.error(f"Failed to set session cooldown: {e}")
            return False
    
    def check_session_cooldown(self, device_id: str) -> Dict[str, Any]:
        if not self.redis:
            return {'on_cooldown': False, 'remaining_seconds': 0, 'message': "Ready to match"}
        try:
            key = f"cooldown:session:{device_id}"
            ttl = self.redis.ttl(key)
            if ttl > 0:
                return {
                    'on_cooldown': True,
                    'remaining_seconds': ttl,
                    'message': f"Please wait {ttl} seconds before matching again"
                }
            return {'on_cooldown': False, 'remaining_seconds': 0, 'message': "Ready to match"}
        except Exception as e:
            logger.error(f"Failed to check session cooldown: {e}")
            return {'on_cooldown': False, 'remaining_seconds': 0, 'message': "Error checking cooldown"}
    
    # ==================== DAILY LIMITS ====================
    
    def increment_daily_matches(self, device_id: str, max_matches: int = 50) -> Dict[str, Any]:
        if not self.redis:
            return {'allowed': True, 'count': 0, 'remaining': max_matches, 'limit': max_matches, 'resets_at': None}
        try:
            today = datetime.utcnow().date().isoformat()
            key = f"daily:matches:{today}:{device_id}"
            count = self.redis.incr(key)
            if count == 1:
                now = datetime.utcnow()
                tomorrow = datetime.combine(now.date() + timedelta(days=1), datetime.min.time())
                seconds_until_midnight = int((tomorrow - now).total_seconds())
                self.redis.expire(key, seconds_until_midnight)
            
            tomorrow_midnight = datetime.combine(datetime.utcnow().date() + timedelta(days=1), datetime.min.time())
            return {
                'allowed': count <= max_matches,
                'count': count,
                'remaining': max(0, max_matches - count),
                'limit': max_matches,
                'resets_at': tomorrow_midnight.isoformat() + 'Z'
            }
        except Exception as e:
            logger.error(f"Failed to check daily limit: {e}")
            return {'allowed': True, 'count': 0, 'remaining': max_matches, 'limit': max_matches, 'resets_at': None}
    
    def get_daily_match_count(self, device_id: str) -> int:
        if not self.redis: return 0
        try:
            today = datetime.utcnow().date().isoformat()
            key = f"daily:matches:{today}:{device_id}"
            count = self.redis.get(key)
            return int(count) if count else 0
        except Exception as e:
            logger.error(f"Failed to get daily match count: {e}")
            return 0
    
    # ==================== REPORT SPAM PREVENTION ====================
    
    def check_report_limit(self, device_id: str, max_reports: int = 5, window_minutes: int = 60) -> Dict[str, Any]:
        if not self.redis:
            return {'allowed': True, 'count': 0, 'remaining': max_reports, 'retry_after_seconds': 0}
        try:
            key = f"reports:limit:{device_id}"
            count = self.redis.incr(key)
            if count == 1:
                self.redis.expire(key, window_minutes * 60)
            allowed = count <= max_reports
            ttl = self.redis.ttl(key) if not allowed else 0
            return {
                'allowed': allowed,
                'count': count,
                'remaining': max(0, max_reports - count),
                'retry_after_seconds': ttl if ttl > 0 else 0
            }
        except Exception as e:
            logger.error(f"Failed to check report limit: {e}")
            return {'allowed': True, 'count': 0, 'remaining': max_reports, 'retry_after_seconds': 0}
    
    # ==================== VERIFICATION ATTEMPT LIMITS ====================
    
    def check_verification_limit(self, device_id: str, max_attempts: int = 10, window_minutes: int = 60) -> Dict[str, Any]:
        if not self.redis:
            return {'allowed': True, 'attempts': 0, 'remaining': max_attempts, 'retry_after_seconds': 0}
        try:
            key = f"verification:attempts:{device_id}"
            attempts = self.redis.incr(key)
            if attempts == 1:
                self.redis.expire(key, window_minutes * 60)
            allowed = attempts <= max_attempts
            ttl = self.redis.ttl(key) if not allowed else 0
            return {
                'allowed': allowed,
                'attempts': attempts,
                'remaining': max(0, max_attempts - attempts),
                'retry_after_seconds': ttl if ttl > 0 else 0
            }
        except Exception as e:
            logger.error(f"Failed to check verification limit: {e}")
            return {'allowed': True, 'attempts': 0, 'remaining': max_attempts, 'retry_after_seconds': 0}
    
    # ==================== BAN SYSTEM ====================
    
    def ban_user(self, device_id: str, duration_hours: int = 24, reason: str = "Violation of terms") -> bool:
        if not self.redis: return True
        try:
            key = f"ban:{device_id}"
            ban_data = {'reason': reason, 'banned_at': datetime.utcnow().isoformat(), 'duration_hours': duration_hours}
            import json
            self.redis.setex(key, duration_hours * 3600, json.dumps(ban_data))
            return True
        except Exception as e:
            logger.error(f"Failed to ban user: {e}")
            return False
    
    def check_ban_status(self, device_id: str) -> Dict[str, Any]:
        if not self.redis:
            return {'is_banned': False, 'reason': None, 'banned_at': None, 'expires_in_seconds': 0}
        try:
            key = f"ban:{device_id}"
            ban_data = self.redis.get(key)
            if ban_data:
                import json
                data = json.loads(ban_data)
                ttl = self.redis.ttl(key)
                return {
                    'is_banned': True,
                    'reason': data.get('reason', 'Unknown'),
                    'banned_at': data.get('banned_at'),
                    'expires_in_seconds': ttl
                }
            return {'is_banned': False, 'reason': None, 'banned_at': None, 'expires_in_seconds': 0}
        except Exception as e:
            logger.error(f"Failed to check ban status: {e}")
            return {'is_banned': False, 'reason': None, 'banned_at': None, 'expires_in_seconds': 0}

# Singleton instance
_rate_limit_service: Optional[RateLimitService] = None

def get_rate_limit_service() -> RateLimitService:
    """Get or create RateLimitService singleton."""
    global _rate_limit_service
    if _rate_limit_service is None:
        from app.core.redis_client import redis_client
        # Always create an instance, even if client is None
        _rate_limit_service = RateLimitService(redis_client.client)
    return _rate_limit_service
