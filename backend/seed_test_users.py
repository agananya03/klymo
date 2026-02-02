from app.core.database import SessionLocal
from app.models.sql_models import User
import time

def seed():
    db = SessionLocal()
    # Upsert logic (check if exists first to avoid PK error)
    
    users = [
        {"device_id": "client_A", "gender": "male"},
        {"device_id": "client_B", "gender": "female"},
    ]
    
    for u in users:
        existing = db.query(User).filter(User.device_id == u['device_id']).first()
        if existing:
            existing.gender = u['gender']
        else:
            db.add(User(device_id=u['device_id'], gender=u['gender'], created_at=time.time(), verified_at=time.time()))
    
    db.commit()
    print("Test users seeded successfully")
    db.close()

if __name__ == "__main__":
    seed()
