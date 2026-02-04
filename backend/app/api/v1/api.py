from fastapi import APIRouter

from app.api.v1.endpoints import hello, example_redis, verification, profiles, detect, chat, analytics

api_router = APIRouter()
api_router.include_router(hello.router, prefix="/hello", tags=["hello"])
api_router.include_router(example_redis.router, prefix="/redis", tags=["redis"])
api_router.include_router(verification.router, prefix="/verification", tags=["verification"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(detect.router, prefix="/detect", tags=["detect"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

from app.api.v1.endpoints import health
api_router.include_router(health.router, prefix="/health", tags=["health"])
