from typing import List, Union
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI Check"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[Union[AnyHttpUrl, str]] = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5173",
    "https://cloud-forest-production.up.railway.app",
    "https://cloud-forest-chat-production.up.railway.app",  # Your frontend
    "*"  # Temporary - for debugging (remove later)
]

    # Redis - Enable by default (Railway will provide REDIS_URL)
    REDIS_ENABLED: bool = True
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    REDIS_PASSWORD: Union[str, None] = None
    
    # Hugging Face
    HUGGINGFACE_API_KEY: Union[str, None] = None
    HUGGINGFACE_MODEL_URL: Union[str, None] = None

    # Google Gemini
    GEMINI_API_KEY: Union[str, None] = None

    @property
    def model_id(self) -> str:
        # Using a reliable gender classification model
        return "rizvandwiki/gender-classification"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()