from app.core.database import Base, engine
from app.models.sql_models import User, Session, Report, DailyUsage

def create_tables():
    print("Creating tables in database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    create_tables()
