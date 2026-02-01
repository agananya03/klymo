import socketio
import logging
from app.core.socket_server import sio
from app.core.database import SessionLocal
from app.models.sql_models import User, Session, Report
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)

@sio.event
async def connect(sid, environ, auth):
    """
    Handle connection. 
    Auth expectation: { 'device_id': '...' }
    """
    device_id = None
    if auth and 'device_id' in auth:
        device_id = auth['device_id']
    else:
        # Fallback or reject
        pass

    if not device_id:
        return False 

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user:
            return False
        
        await sio.save_session(sid, {'device_id': device_id})
        
        # Join a private room for this user so we can target them later (e.g. on match)
        sio.enter_room(sid, f"user_{device_id}")
        
        logger.info(f"Connected: {device_id}")
        return True
    except Exception as e:
        logger.error(f"Connect Logic Error: {e}")
        return False
    finally:
        db.close()

@sio.event
async def disconnect(sid):
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
    
    if device_id:
        logger.info(f"Disconnected: {device_id}")
        # 1. Leave Queue
        MatchingService.leave_queue(device_id)
        
        # 2. Notify Partner if in active session (Optional optimization)
        # Detailed check would be expensive here for every disconnect, 
        # but handled via heartbeat or client logic usually.
        # For strictness:
        # db = SessionLocal()
        # active_session = ...
        # if active_session: emit 'partner_disconnected' to session_id

@sio.event
async def join_queue(sid, data):
    """
    Client requests to match.
    payload: { 'preference': 'male'|'female'|'any' }
    """
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
    
    if not device_id: return

    preference = data.get('preference', 'any')
    
    db = SessionLocal()
    try:
        # Call Synchronous Matching Service
        result = MatchingService.join_queue(db, device_id, preference)
        
        if result['status'] == 'matched':
            session_id = result['session_id']
            partner_data = result['partner']
            partner_id = partner_data['device_id']
            
            # Form Payload
            match_payload_me = {
                'session_id': session_id,
                'partner': partner_data
            }
            match_payload_partner = {
                'session_id': session_id,
                'partner': {'device_id': device_id, 'nickname': result.get('my_nickname', 'Stranger')} # Service needs to return my nickname too?
                # MatchingService currently only returns partner info in 'partner' dict
                # We might need to fetch my nickname or update MatchingService
            }
            
            # Optimization: Update MatchingService to return both users info or fetch here
            # Fetching here for simplicity
            me = db.query(User).filter(User.device_id == device_id).first()
            match_payload_partner['partner']['nickname'] = me.nickname if me else "Stranger"

            # 1. Join Rooms
            sio.enter_room(sid, session_id)
            # We can't easily join the partner's SID to the room directly without their SID.
            # But we can emit to their private room `user_{partner_id}` telling them to join!
            
            # Emit to ME
            await sio.emit('match_found', match_payload_me, room=sid)
            
            # Emit to PARTNER (who is in queue)
            # They need to receive this, then client joins 'session_id' room via `join_session` event OR calls API?
            # Better: Server tells client "You matched". Client Auto-joins.
            await sio.emit('match_found', match_payload_partner, room=f"user_{partner_id}")
            
        else:
            await sio.emit('queue_status', {'status': 'queued'}, room=sid)

    except Exception as e:
        logger.error(f"Join Queue Error: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)
    finally:
        db.close()

@sio.event
async def join_session(sid, data):
    # Same as before
    session_id = data.get('session_id')
    if not session_id: return
    
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
    
    # Validation logic...
    sio.enter_room(sid, session_id)

@sio.event
async def send_message(sid, data):
    session_id = data.get('session_id')
    content = data.get('content')
    if not session_id or not content: return
    
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')

    # RELAY ONLY - NO STORAGE
    response = {
        'sender_id': device_id,
        'content': content,
        'timestamp': 'now'
    }
    await sio.emit('new_message', response, room=session_id)

@sio.event
async def leave_chat(sid, data):
    session_id = data.get('session_id')
    if not session_id: return

    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
        
    sio.leave_room(sid, session_id)
    await sio.emit('partner_left', {'reason': 'left'}, room=session_id)
    
    # DB Update to close session
    db = SessionLocal()
    try:
        sess = db.query(Session).filter(Session.session_id == session_id).first()
        if sess:
            sess.is_active = False
            sess.ended_at = func.now()
            db.commit()
    finally:
        db.close()

@sio.event
async def typing_start(sid, data):
    session_id = data.get('session_id')
    if not session_id: return
    # Relay to room (partner will receive it)
    await sio.emit('partner_typing', {'is_typing': True}, room=session_id, skip_sid=sid)

@sio.event
async def typing_stop(sid, data):
    session_id = data.get('session_id')
    if not session_id: return
    # Relay to room
    await sio.emit('partner_typing', {'is_typing': False}, room=session_id, skip_sid=sid)

@sio.event
async def report_user(sid, data):
    session_id = data.get('session_id')
    reason = data.get('reason')
    reported_device_id = data.get('reported_device_id') # Client should send who they report, or we infer from session
    
    if not session_id or not reason: return
    
    async with sio.session(sid) as user_session:
        reporter_id = user_session.get('device_id')
        
    db = SessionLocal()
    try:
        # Validate session
        # infer reported_id if not sent?
        # Simple version:
        report = Report(
            session_id=session_id,
            reporter_device_id=reporter_id,
            reported_device_id=reported_device_id, # Optional or inferred
            reason=reason
        )
        db.add(report)
        db.commit()
        await sio.emit('report_received', {'status': 'processed'}, room=sid)
    finally:
        db.close()
