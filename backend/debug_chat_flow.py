import socketio
import time
import threading
from app.core.database import SessionLocal
from app.models.sql_models import User
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

user_a_id = "chat_user_a"
user_b_id = "chat_user_b"

def ensure_users_exist():
    db = SessionLocal()
    for uid, gender in [(user_a_id, 'male'), (user_b_id, 'female')]:
        u = db.query(User).filter(User.device_id == uid).first()
        if not u:
            u = User(device_id=uid, gender=gender, nickname=f"User-{uid}", verified_at=datetime.now())
            db.add(u)
            db.commit()
    db.close()

def run_client_a():
    sio = socketio.Client()
    
    @sio.event
    def connect():
        print("[A] Connected")
        
    @sio.event
    def match_found(data):
        print(f"[A] Match Found! Partner: {data['partner']['nickname']}")
        # Send message after match
        session_id = data['session_id']
        time.sleep(1)
        sio.emit('send_message', {'session_id': session_id, 'content': 'Hello from A'})
        
        # Leve after 3 seconds
        time.sleep(3)
        print("[A] Leaving Chat")
        sio.emit('leave_chat', {'session_id': session_id})
        sio.disconnect()

    try:
        sio.connect(BASE_URL, auth={'device_id': user_a_id})
        print("[A] Joining Queue (seeking Female)")
        sio.emit('join_queue', {'preference': 'female'})
        sio.wait() # Wait until disconnect
    except Exception as e:
        print(f"[A] Error: {e}")

def run_client_b():
    sio = socketio.Client()
    
    @sio.event
    def connect():
        print("[B] Connected")

    @sio.event
    def match_found(data):
        print(f"[B] Match Found! Partner: {data['partner']['nickname']}")

    @sio.event
    def new_message(data):
        print(f"[B] Received Message: '{data['content']}' from {data['sender_id']}")

    @sio.event
    def partner_left(data):
        print(f"[B] Partner Left: {data}")
        sio.disconnect()

    try:
        # Give A a head start
        time.sleep(0.5)
        sio.connect(BASE_URL, auth={'device_id': user_b_id})
        print("[B] Joining Queue (seeking Male)")
        sio.emit('join_queue', {'preference': 'male'})
        sio.wait()
    except Exception as e:
        print(f"[B] Error: {e}")

if __name__ == "__main__":
    ensure_users_exist()
    
    t_a = threading.Thread(target=run_client_a)
    t_b = threading.Thread(target=run_client_b)
    
    t_a.start()
    t_b.start()
    
    t_a.join()
    t_b.join()
    print("--- Simulation Complete ---")
