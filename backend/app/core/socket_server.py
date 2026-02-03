import socketio
import os
from app.core.config import settings

# Initialize the Async Socket.IO server
# Use Railway Redis URL if available
redis_url = os.getenv('REDIS_URL')

if redis_url:
    # Railway Redis
    mgr = socketio.AsyncRedisManager(redis_url)
else:
    # Local Redis
    mgr = socketio.AsyncRedisManager(
        f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    )

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        'https://cloud-forest-chat-production.up.railway.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    client_manager=mgr,
    logger=True,  # Enable logging to debug connection issues
    engineio_logger=True
)

# Wrap with ASGI application
socket_app = socketio.ASGIApp(sio, socketio_path='socket.io')