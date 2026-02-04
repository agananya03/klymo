from fastapi import APIRouter
from app.core.redis_client import redis_client
import os

router = APIRouter()

@router.get("/")
async def health_check():
    # Check if REDIS_URL exists (mask it for security)
    redis_url = os.getenv('REDIS_URL', "")
    masked_url = redis_url[:15] + "..." if redis_url else "NOT_SET"
    
    redis_status = "ok"
    # Try to connect if not connected
    if not redis_client.client:
        redis_client.connect()
        
    if not redis_client.client:
        redis_status = "disconnected"
        
    error = getattr(redis_client, 'last_error', None)
    
    return {
        "status": "online",
        "redis_url_present": bool(redis_url),
        "redis_url_preview": masked_url,
        "redis_connection": redis_status,
        "redis_error": error
    }
