import socketio
from app.core.config import settings

# Initialize the Async Socket.IO server
# CORS allowed origins are pulled from settings
mgr = socketio.AsyncRedisManager(
    f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
)

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*', # handled by allow_origins in kwargs if needed, or explicit list
    # For dev, '*' is easiest, but could use settings.BACKEND_CORS_ORIGINS
    client_manager=mgr
)

# Wrap with ASGI application
socket_app = socketio.ASGIApp(sio, socketio_path='socket.io')
