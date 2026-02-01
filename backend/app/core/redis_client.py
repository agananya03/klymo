from typing import Optional, List, Dict, Any
import redis
import json
import logging
from app.core.config import settings

class RedisClient:
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.pool: Optional[redis.ConnectionPool] = None
        self.match_script = None

    def connect(self):
        if not settings.REDIS_ENABLED:
            logging.info("Redis disabled in settings. Caching will be skipped.")
            self.client = None
            return

        try:
            self.pool = redis.ConnectionPool(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=True,
                max_connections=10,
                socket_timeout=5,
                retry_on_timeout=True
            )
            self.client = redis.Redis(connection_pool=self.pool)
            # Test connection
            self.client.ping()
            logging.info("Successfully connected to Redis")
            
            # Register Lua Script
            self._register_scripts()
            
        except redis.ConnectionError as e:
            logging.warning(f"Failed to connect to Redis: {e}. Caching will be disabled.")
            self.client = None

    def close(self):
        if self.pool:
            self.pool.disconnect()
            logging.info("Redis connection closed")

    def _register_scripts(self):
        if not self.client:
            return
            
        # Lua script for atomic matching
        self.match_script = self.client.register_script("""
            local my_preference = ARGV[1]
            local my_gender = ARGV[2]
            
            for _, queue_key in ipairs(KEYS) do
                local users = redis.call('LRANGE', queue_key, 0, -1)
                for i, user_json in ipairs(users) do
                    local user = cjson.decode(user_json)
                    
                    local gender_match = (my_preference == 'any') or (user['gender'] == my_preference)
                    
                    if gender_match then
                        local pref_match = (user['preference'] == 'any') or (user['preference'] == my_gender)
                        
                        if pref_match then
                            redis.call('LREM', queue_key, 1, user_json)
                            return user_json
                        end
                    end
                end
            end
            return nil
        """)

    def get_cache(self, key: str) -> Optional[str]:
        if not self.client: self.connect()
        if not self.client: return None
        return self.client.get(key)

    def set_cache(self, key: str, value: str, ttl: int = 60):
        if not self.client: self.connect()
        if not self.client: return
        self.client.setex(key, ttl, value)

    def delete_cache(self, key: str) -> bool:
        if not self.client: self.connect()
        if not self.client: return False
        return self.client.delete(key) > 0

    def find_match(self, target_queues: List[str], my_preference: str, my_gender: str) -> Optional[Dict[str, Any]]:
        if not self.client: self.connect()
        if not self.client or not self.match_script: return None
        
        result = self.match_script(keys=target_queues, args=[my_preference, my_gender])
        if result:
            return json.loads(result)
        return None

    def push_to_queue(self, queue_key: str, user_data: Dict[str, Any]):
        if not self.client: self.connect()
        if not self.client: return
        self.client.rpush(queue_key, json.dumps(user_data))

    def remove_from_queue(self, queue_key: str, device_id: str):
        if not self.client: self.connect()
        if not self.client: return False
        
        items = self.client.lrange(queue_key, 0, -1)
        for item in items:
            data = json.loads(item)
            if data['device_id'] == device_id:
                self.client.lrem(queue_key, 1, item)
                return True
        return False

redis_client = RedisClient()
