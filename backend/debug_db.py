from sqlalchemy import create_engine
from app.core.config import settings
import sys

try:
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[1]}") # Print host only for privacy
    engine = create_engine(settings.DATABASE_URL)
    conn = engine.connect()
    print("Connection Successful!")
    conn.close()
except Exception as e:
    print(f"Connection Failed: {e}")
