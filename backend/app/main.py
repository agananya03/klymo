from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from contextlib import asynccontextmanager
from app.core.redis_client import redis_client
from app.core.socket_server import sio
import socketio
import app.websocket.events # Register Socket.IO Events

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists
    try:
        from app.core.database import engine, Base
        from app.models import sql_models
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error creating database tables: {e}")

    redis_client.connect()
    yield
    redis_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error", 
            "error": str(exc),
            "trace": traceback.format_exc().splitlines()[-1]
        },
    )

# CORS Middleware
origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]
print(f"DEBUG: Allowed Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://cloud-forest-chat-production.up.railway.app",
        "https://klymochat.vercel.app",
        "http://localhost:3000",  # Keep for local testing
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI Backend"}

from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Wrap FastAPI with Socket.IO ASGI App
# This allows Socket.IO to handle /socket.io/ requests and pass the rest to FastAPI
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
