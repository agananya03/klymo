from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.core.redis_client import redis_client
import time

router = APIRouter()

@router.get("/test-cache")
async def test_redis_cache(key: str = "test_key", value: str = "test_value"):
    """
    Test Redis caching:
    1. Check if key exists
    2. If not, set it
    3. Return value and source (cache/db)
    """
    
    # Try to get from cache
    cached_value = redis_client.get_cache(key)
    
    if cached_value:
        return {
            "status": "success",
            "source": "redis_cache",
            "key": key,
            "value": cached_value,
            "message": "Value retrieved from Redis cache"
        }
    
    # Simulate DB operation
    time.sleep(1) # Simulate delay
    
    # Set in cache for 60 seconds
    redis_client.set_cache(key, value, ttl=60)
    
    return {
        "status": "success",
        "source": "database_simulation",
        "key": key,
        "value": value,
        "message": "Value set in Redis cache for 60 seconds"
    }

@router.delete("/clear-cache")
async def clear_redis_cache(key: str = "test_key"):
    """
    Clear a specific key from cache
    """
    deleted = redis_client.delete_cache(key)
    if deleted:
        return {"status": "success", "message": f"Key '{key}' deleted from cache"}
    return {"status": "warning", "message": f"Key '{key}' not found in cache"}
