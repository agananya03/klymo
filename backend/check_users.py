from app.core.database import SessionLocal
from app.models.sql_models import User

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total Users: {len(users)}\n")
        print(f"{'Device ID':<40} | {'Gender':<10} | {'Banned':<6} | {'Verified At'}")
        print("-" * 80)
        for user in users:
            print(f"{user.device_id:<40} | {user.gender:<10} | {str(user.is_banned):<6} | {user.verified_at}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
