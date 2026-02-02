from app.core.database import SessionLocal
from app.models.sql_models import User

def fix():
    db = SessionLocal()
    # Target the user from the RIGHT screenshot (cc79655a)
    target_id = "cc79655a1387573889b181d52b85e5c851eeaa629795af0d1aa661c4cc56685e"
    user = db.query(User).filter(User.device_id == target_id).first()
    if user:
        user.gender = "female"
        db.commit()
        print(f"Updated {target_id} to FEMALE")
    else:
        print("User not found")
    db.close()

if __name__ == "__main__":
    fix()
