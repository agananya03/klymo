import socketio

sio = socketio.Client()

@sio.event
def connect():
    print("Connected to Socket.IO server!")

@sio.event
def connected(data):
    print(f"Server confirmed connection: {data}")

@sio.event
def room_joined(data):
    print(f"Joined room: {data}")

@sio.event
def partner_joined(data):
    print(f"Partner joined: {data}")

@sio.event
def chat_message(data):
    print(f"Message received: {data}")

@sio.event
def disconnect():
    print("Disconnected from server")

if __name__ == "__main__":
    try:
        print("Connecting to http://localhost:8000...")
        sio.connect('http://localhost:8000')
        print(f"Connected: {sio.connected}")
        
        test_room = "test-room-123"
        print(f"Joining room: {test_room}")
        sio.emit('join_room', {'room_id': test_room})
        
        sio.sleep(2)
        
        print("Sending test message...")
        sio.emit('chat_message', {'room_id': test_room, 'message': 'Hello from test client!'})
        
        sio.sleep(2)
        
        print("Leaving room...")
        sio.emit('leave_room', {'room_id': test_room})
        
        sio.sleep(1)
        sio.disconnect()
        print("Test completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
