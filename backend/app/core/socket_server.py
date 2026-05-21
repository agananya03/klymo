import socketio
import os
import redis
from app.core.config import settings

# Initialize the Async Socket.IO server
# Use Railway Redis URL if available
redis_url = os.getenv('REDIS_URL')

redis_available = False
if redis_url:
    try:
        r = redis.Redis.from_url(redis_url, socket_timeout=1)
        r.ping()
        redis_available = True
    except Exception:
        pass
else:
    try:
        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            socket_timeout=1
        )
        r.ping()
        redis_available = True
    except Exception:
        pass

mgr = None
if redis_available:
    if redis_url:
        mgr = socketio.AsyncRedisManager(redis_url)
    else:
        mgr = socketio.AsyncRedisManager(
            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
        )
    print("DEBUG: Redis is available, using AsyncRedisManager.")
else:
    print("WARNING: Redis is not available, falling back to in-memory ClientManager.")

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    client_manager=mgr,
    logger=True,  # Enable logging to debug connection issues
    engineio_logger=True
)

# Wrap with ASGI application
socket_app = socketio.ASGIApp(sio, socketio_path='socket.io')