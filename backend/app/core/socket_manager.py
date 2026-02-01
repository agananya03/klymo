import socketio
import uuid
import logging
from typing import Dict, Set, Optional
from dataclasses import dataclass, field
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ConnectedUser:
    sid: str
    device_id: Optional[str] = None
    connected_at: datetime = field(default_factory=datetime.utcnow)

class SocketManager:
    def __init__(self):
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins='*',
            logger=True,
            engineio_logger=True
        )
        self.connected_users: Dict[str, ConnectedUser] = {}
        self.device_to_sid: Dict[str, str] = {}
        self._matching_service = None
        self._report_manager = None
        self._register_handlers()
    
    def _get_matching_service(self):
        if self._matching_service is None:
            from app.core.matching import matching_service
            self._matching_service = matching_service
        return self._matching_service
    
    def _get_report_manager(self):
        if self._report_manager is None:
            from app.core.reports import report_manager
            self._report_manager = report_manager
        return self._report_manager
    
    def _register_handlers(self):
        
        @self.sio.event
        async def connect(sid, environ, auth=None):
            """Initialize connection, optionally authenticate with device_id"""
            device_id = None
            if auth and isinstance(auth, dict):
                device_id = auth.get('device_id')
            
            user = ConnectedUser(sid=sid, device_id=device_id)
            self.connected_users[sid] = user
            
            if device_id:
                self.device_to_sid[device_id] = sid
            
            logger.info(f"Client connected: {sid} (device: {device_id})")
            await self.sio.emit('connected', {
                'sid': sid,
                'device_id': device_id,
                'authenticated': device_id is not None
            }, to=sid)
        
        @self.sio.event
        async def disconnect(sid):
            """Clean up session, remove from all queues"""
            logger.info(f"Client disconnected: {sid}")
            await self._handle_disconnect(sid)
        
        @self.sio.event
        async def join_queue(sid, data):
            """Add to matching queue with preferences"""
            device_id = data.get('device_id')
            gender = data.get('gender')
            preferred_gender = data.get('preferred_gender')
            
            if not device_id:
                user = self.connected_users.get(sid)
                if user and user.device_id:
                    device_id = user.device_id
                else:
                    await self.sio.emit('error', {'message': 'device_id required'}, to=sid)
                    return
            
            self.connected_users[sid].device_id = device_id
            self.device_to_sid[device_id] = sid
            
            matching = self._get_matching_service()
            
            if matching.is_on_cooldown(device_id):
                remaining = matching.get_cooldown_remaining(device_id)
                await self.sio.emit('cooldown', {
                    'message': 'You are on cooldown',
                    'remaining_seconds': remaining
                }, to=sid)
                return
            
            session = matching.add_to_queue(
                sid=sid,
                device_id=device_id,
                gender=gender,
                preferred_gender=preferred_gender
            )
            
            if session:
                await self._notify_match_found(session)
            else:
                await self.sio.emit('queue_joined', {
                    'message': 'Waiting for a match...',
                    'queue_size': matching.get_queue_size()
                }, to=sid)
                logger.info(f"User {device_id} joined queue")
        
        @self.sio.event
        async def send_message(sid, data):
            """Relay message to partner in session"""
            message = data.get('message')
            
            if not message:
                await self.sio.emit('error', {'message': 'message required'}, to=sid)
                return
            
            matching = self._get_matching_service()
            session = matching.get_session_by_sid(sid)
            
            if not session:
                await self.sio.emit('error', {'message': 'Not in a chat session'}, to=sid)
                return
            
            partner_sid = matching.get_partner_sid(sid)
            
            msg_data = {
                'session_id': session.session_id,
                'message': message,
                'sender_id': sid,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            if partner_sid:
                await self.sio.emit('new_message', msg_data, to=partner_sid)
            
            await self.sio.emit('message_sent', msg_data, to=sid)
            logger.info(f"Message relayed in session {session.session_id}")
        
        @self.sio.event
        async def leave_chat(sid, data=None):
            """Exit session, notify partner, start cooldown"""
            matching = self._get_matching_service()
            session = matching.get_session_by_sid(sid)
            
            if not session:
                await self.sio.emit('error', {'message': 'Not in a chat session'}, to=sid)
                return
            
            partner_sid = matching.get_partner_sid(sid)
            session_id = session.session_id
            
            matching.end_session(session_id, ended_by_sid=sid, apply_cooldown=True)
            
            if partner_sid:
                await self.sio.emit('partner_left', {
                    'session_id': session_id,
                    'message': 'Your partner has left the chat'
                }, to=partner_sid)
            
            user = self.connected_users.get(sid)
            device_id = user.device_id if user else None
            remaining = matching.get_cooldown_remaining(device_id) if device_id else 0
            
            await self.sio.emit('chat_ended', {
                'session_id': session_id,
                'message': 'You left the chat',
                'cooldown_seconds': remaining
            }, to=sid)
            
            logger.info(f"User {sid} left chat {session_id}")
        
        @self.sio.event
        async def next_match(sid, data=None):
            """Leave current chat and immediately re-queue"""
            matching = self._get_matching_service()
            session = matching.get_session_by_sid(sid)
            
            user = self.connected_users.get(sid)
            if not user or not user.device_id:
                await self.sio.emit('error', {'message': 'Not authenticated'}, to=sid)
                return
            
            if session:
                partner_sid = matching.get_partner_sid(sid)
                matching.end_session(session.session_id, ended_by_sid=sid, apply_cooldown=False)
                
                if partner_sid:
                    await self.sio.emit('partner_left', {
                        'session_id': session.session_id,
                        'message': 'Your partner is looking for a new match'
                    }, to=partner_sid)
            
            gender = data.get('gender') if data else None
            preferred_gender = data.get('preferred_gender') if data else None
            
            new_session = matching.add_to_queue(
                sid=sid,
                device_id=user.device_id,
                gender=gender,
                preferred_gender=preferred_gender
            )
            
            if new_session:
                await self._notify_match_found(new_session)
            else:
                await self.sio.emit('queue_joined', {
                    'message': 'Looking for a new match...',
                    'queue_size': matching.get_queue_size()
                }, to=sid)
        
        @self.sio.event
        async def report_user(sid, data):
            """Store report with session context"""
            reason = data.get('reason')
            description = data.get('description', '')
            
            if not reason:
                await self.sio.emit('error', {'message': 'reason required'}, to=sid)
                return
            
            matching = self._get_matching_service()
            session = matching.get_session_by_sid(sid)
            
            user = self.connected_users.get(sid)
            if not user or not user.device_id:
                await self.sio.emit('error', {'message': 'Not authenticated'}, to=sid)
                return
            
            session_id = session.session_id if session else "no_session"
            partner_device_id = None
            
            if session:
                if session.user1_sid == sid:
                    partner_device_id = session.user2_device_id
                else:
                    partner_device_id = session.user1_device_id
            
            if not partner_device_id:
                await self.sio.emit('error', {'message': 'No partner to report'}, to=sid)
                return
            
            report_mgr = self._get_report_manager()
            report_id = str(uuid.uuid4())
            
            report = report_mgr.create_report(
                report_id=report_id,
                session_id=session_id,
                reporter_device_id=user.device_id,
                reported_device_id=partner_device_id,
                reason=reason,
                description=description
            )
            
            await self.sio.emit('report_submitted', {
                'report_id': report.report_id,
                'message': 'Report submitted successfully'
            }, to=sid)
            
            logger.info(f"Report {report_id}: {user.device_id} reported {partner_device_id}")
        
        @self.sio.event
        async def typing(sid, data):
            """Typing indicator"""
            is_typing = data.get('is_typing', False)
            
            matching = self._get_matching_service()
            partner_sid = matching.get_partner_sid(sid)
            
            if partner_sid:
                session = matching.get_session_by_sid(sid)
                await self.sio.emit('typing', {
                    'is_typing': is_typing,
                    'session_id': session.session_id if session else None
                }, to=partner_sid)
    
    async def _notify_match_found(self, session):
        """Notify both users that a match was found"""
        await self.sio.emit('match_found', {
            'session_id': session.session_id,
            'message': 'Match found! You can start chatting.'
        }, to=session.user1_sid)
        
        await self.sio.emit('match_found', {
            'session_id': session.session_id,
            'message': 'Match found! You can start chatting.'
        }, to=session.user2_sid)
        
        logger.info(f"Match found: {session.session_id}")
    
    async def _handle_disconnect(self, sid: str):
        """Handle client disconnect - clean up everything"""
        matching = self._get_matching_service()
        
        matching.remove_from_queue(sid)
        
        session = matching.get_session_by_sid(sid)
        if session:
            partner_sid = matching.get_partner_sid(sid)
            matching.end_session(session.session_id, ended_by_sid=sid, apply_cooldown=False)
            
            if partner_sid:
                await self.sio.emit('partner_left', {
                    'session_id': session.session_id,
                    'message': 'Your partner disconnected'
                }, to=partner_sid)
        
        user = self.connected_users.get(sid)
        if user and user.device_id and user.device_id in self.device_to_sid:
            del self.device_to_sid[user.device_id]
        
        if sid in self.connected_users:
            del self.connected_users[sid]
    
    def get_app(self):
        return self.sio

socket_manager = SocketManager()
