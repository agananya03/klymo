from app.core.redis_client import redis_client
import json

def inspect_queues():
    r = redis_client.get_client()
    if not r:
        print("Redis unavailable")
        return

    queues = ["queue:waiting:male", "queue:waiting:female", "queue:waiting:any"]
    
    print("--- Redis Queues Inspection ---")
    for q in queues:
        count = r.llen(q)
        print(f"\nQueue: {q} (Count: {count})")
        items = r.lrange(q, 0, -1)
        for i, item in enumerate(items):
            data = json.loads(item)
            print(f"  [{i}] ID: {data.get('user_id')} | Gen: {data.get('gender')} | Pref: {data.get('preference')} | Joined: {data.get('joined_at')}")

if __name__ == "__main__":
    inspect_queues()
