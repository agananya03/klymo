from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from contextlib import asynccontextmanager
from app.core.redis_client import redis_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    redis_client.connect()
    yield
    # Shutdown
    redis_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI Backend"}

# Import and include router here when ready
from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)
