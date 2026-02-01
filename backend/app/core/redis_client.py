from typing import Optional
import redis
from app.core.config import settings
import logging

class RedisClient:
    _instance: Optional['RedisClient'] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._instance.pool = None
            cls._instance.client = None
        return cls._instance

    def connect(self):
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
        except redis.ConnectionError as e:
            logging.warning(f"Failed to connect to Redis: {e}. Caching will be disabled.")
            self.client = None

    def close(self):
        if self.pool:
            self.pool.disconnect()
            logging.info("Redis connection closed")

    def get_client(self) -> Optional[redis.Redis]:
        if not self.client:
            self.connect()
        return self.client

    def get_cache(self, key: str) -> Optional[str]:
        try:
            client = self.get_client()
            if not client:
                return None
            return client.get(key)
        except Exception as e:
            logging.error(f"Error getting cache for key {key}: {e}")
            return None

    def set_cache(self, key: str, value: str, ttl: int = 3600) -> bool:
        try:
            client = self.get_client()
            if not client:
                return False
            return client.set(key, value, ex=ttl)
        except Exception as e:
            logging.error(f"Error setting cache for key {key}: {e}")
            return False

    def delete_cache(self, key: str) -> int:
        try:
            return self.get_client().delete(key)
        except Exception as e:
            logging.error(f"Error deleting cache for key {key}: {e}")
            return 0

    def clear_all_cache(self) -> bool:
        try:
            return self.get_client().flushdb()
        except Exception as e:
            logging.error(f"Error clearing cache: {e}")
            return False

redis_client = RedisClient()
