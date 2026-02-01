import socketio
import asyncio
import sys

# Usage: python test_socket_client.py <device_id> <gender> <preference>

sio = socketio.AsyncClient()

device_id = sys.argv[1] if len(sys.argv) > 1 else "client_1"
gender = sys.argv[2] if len(sys.argv) > 2 else "male"
preference = sys.argv[3] if len(sys.argv) > 3 else "female"

@sio.event
async def connect():
    print(f"[{device_id}] Connected!")
    print(f"[{device_id}] Joining queue as {gender} seeking {preference}...")
    await sio.emit('join_queue', {'preference': preference})

@sio.event
async def match_found(data):
    print(f"[{device_id}] MATCH FOUND! Data: {data}")
    await sio.disconnect()

@sio.event
async def queue_status(data):
    print(f"[{device_id}] Queue Status: {data}")

@sio.event
async def error(data):
    print(f"[{device_id}] Error: {data}")

@sio.event
async def disconnect():
    print(f"[{device_id}] Disconnected")

async def main():
    # Auth with device_id
    await sio.connect(f'http://localhost:8000?device_id={device_id}', auth={'device_id': device_id}, wait_timeout=10)
    await sio.wait()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
