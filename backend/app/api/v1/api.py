from fastapi import APIRouter

from app.api.v1.endpoints import hello, example_redis, gender_verification, verification, profiles

api_router = APIRouter()
api_router.include_router(hello.router, prefix="/hello", tags=["hello"])
api_router.include_router(example_redis.router, prefix="/redis", tags=["redis"])
api_router.include_router(gender_verification.router, prefix="/gender", tags=["gender"])
api_router.include_router(verification.router, prefix="/verification", tags=["verification"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
