from sqlalchemy import create_engine, text
from app.core.config import settings
import time

def test_db():
    print(f"Testing DB Connection to: {settings.DATABASE_URL.split('@')[-1]}") # Hide password
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            print("Successfully connected!")
            start = time.time()
            result = conn.execute(text("SELECT 1"))
            print(f"Query Result: {result.fetchone()}")
            print(f"Query Time: {time.time() - start:.2f}s")
    except Exception as e:
        print(f"DB Connection Failed: {e}")

if __name__ == "__main__":
    test_db()
