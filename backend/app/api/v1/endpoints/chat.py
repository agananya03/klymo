from typing import List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Body
from pydantic import BaseModel
from app.services.matching_service import mapping_service

router = APIRouter()

class MatchRequest(BaseModel):
    user_id: str
    gender: str
    preference: str

class ConnectionManager:
    def __init__(self):
        # Key: session_id, Value: List of WebSockets in that session
        self.active_sessions: dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = []
        self.active_sessions[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_sessions:
            if websocket in self.active_sessions[session_id]:
                self.active_sessions[session_id].remove(websocket)
            if not self.active_sessions[session_id]:
                del self.active_sessions[session_id]

    async def broadcast(self, message: str, session_id: str):
        if session_id in self.active_sessions:
            for connection in self.active_sessions[session_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.post("/match")
async def find_match(request: MatchRequest):
    """
    Attempt to find a chat partner.
    Returns session_id if matched, or queued status.
    """
    result = mapping_service.find_match(
        user_id=request.user_id,
        gender=request.gender,
        preference=request.preference
    )
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))
        
    return result

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast only to the specific session
            await manager.broadcast(f"User: {data}", session_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        # Optional: Notify partner of disconnect
        await manager.broadcast("User disconnected", session_id)
