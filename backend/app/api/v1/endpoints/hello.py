from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_hello():
    return {"message": "Hello from API v1"}
