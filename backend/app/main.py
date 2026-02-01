from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from contextlib import asynccontextmanager
from app.core.redis_client import redis_client
from app.core.socket_manager import socket_manager
import socketio

@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_client.connect()
    yield
    redis_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI Backend"}

from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)

socket_app = socketio.ASGIApp(socket_manager.sio, other_asgi_app=app)
