from app.core.database import SessionLocal
from app.models.sql_models import User

def debug():
    db = SessionLocal()
    users = db.query(User).all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.device_id} | Gender: {u.gender} | Verified: {u.verified_at}")
    db.close()

if __name__ == "__main__":
    debug()
