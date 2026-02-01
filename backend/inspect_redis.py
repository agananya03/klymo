from app.core.redis_client import redis_client
import json

def inspect():
    r = redis_client.get_client()
    if not r:
        print("Redis not connected")
        return

    queues = ["queue:waiting:male", "queue:waiting:female", "queue:waiting:any"]
    
    print("--- Redis Queue Inspection ---")
    for q in queues:
        length = r.llen(q)
        print(f"\nQueue: {q} (Length: {length})")
        items = r.lrange(q, 0, -1)
        for i, item in enumerate(items):
            print(f"  [{i}] {item}")

if __name__ == "__main__":
    inspect()
