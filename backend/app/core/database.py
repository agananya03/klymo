from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
import os

# Default to sqlite for local dev if no POSTGRES URL is provided, 
# BUT the user specifically asked for Postgres schema so we should ideally use that.
# For now, we'll try to use the env var, fallback to a dummy postgres url or error.
# Accessing settings.DATABASE_URL. 

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
