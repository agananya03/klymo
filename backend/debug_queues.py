from app.core.redis_client import redis_client
import json

def inspect_queues():
    redis_client.connect()
    r = redis_client.get_client()
    
    queues = ["queue:waiting:male", "queue:waiting:female", "queue:waiting:any"]
    
    print("\n--- REDIS QUEUE INSPECTION ---")
    
    for q in queues:
        length = r.llen(q)
        print(f"\nQueue: {q} (Length: {length})")
        if length > 0:
            items = r.lrange(q, 0, -1)
            for i, item in enumerate(items):
                try:
                    data = json.loads(item)
                    print(f"  [{i}] ID: {data.get('user_id')} | Gen: {data.get('gender')} | Pref: {data.get('preference')} | Joined: {data.get('joined_at')}")
                except:
                    print(f"  [{i}] RAW: {item}")
                    
    redis_client.close()

if __name__ == "__main__":
    inspect_queues()
