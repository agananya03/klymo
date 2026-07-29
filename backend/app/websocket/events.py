import socketio
import logging
from sqlalchemy import func
from app.core.socket_server import sio
from app.core.database import SessionLocal
from app.models.sql_models import User, Session, Report
from app.services.matching_service import mapping_service
import time as import_time
from datetime import datetime as import_datetime
from socketio.exceptions import ConnectionRefusedError
import uuid

logger = logging.getLogger(__name__)

@sio.event
async def connect(sid, environ, auth):
    print(f"DEBUG: Connect Event {sid}")
    # ... (auth logic) ...

    # AI Service Import
    from app.services.ai_service import ai_service

    device_id = None
    if auth and 'device_id' in auth:
        device_id = auth['device_id']
    
    if not device_id:
        from urllib.parse import parse_qs
        query_string = environ.get('QUERY_STRING', '')
        params = parse_qs(query_string)
        if 'device_id' in params:
            device_id = params['device_id'][0]

    if not device_id:
        print("DEBUG: Connect Rejected - No Device ID")
        raise ConnectionRefusedError('Identity missing. Please verify first.')

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user:
            print(f"DEBUG: Connect Auto-creating User for {device_id}")
            user = User(device_id=device_id)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        if user.is_banned:
            print(f"DEBUG: Connect Rejected - Banned User {device_id}")
            raise ConnectionRefusedError('User is banned.')
        
        await sio.save_session(sid, {'device_id': device_id})
        await sio.enter_room(sid, f"user_{device_id}")
        
        print(f"DEBUG: Connected & Session Saved: {device_id}")
        return True
    except ConnectionRefusedError:
        raise
    except Exception as e:
        print(f"DEBUG: Connect Error: {e}")
        raise ConnectionRefusedError(f'Internal Server Error: {str(e)}')
    finally:
        db.close()

@sio.event
async def disconnect(sid, *args):
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
        session_id = user_session.get('active_session_id')
    
    if device_id:
        print(f"DEBUG: Disconnect {device_id}")
        mapping_service.leave_queue(device_id)

        # Handle ungraceful disconnect during chat
        if session_id:
            print(f"DEBUG: User {device_id} disconnected from active session {session_id}")
            # Notify partner
            await sio.emit('partner_left', {'reason': 'disconnected'}, room=session_id, skip_sid=sid)
            
            # Close session in DB (only if real session UUID)
            if session_id and not session_id.startswith('ai_session_'):
                db = SessionLocal()
                try:
                    sess = db.query(Session).filter(Session.session_id == session_id).first()
                    if sess and sess.ended_at is None:
                        sess.ended_at = func.now()
                        db.commit()
                except Exception as e:
                    logger.error(f"Error closing session on disconnect: {e}")
                finally:
                    db.close()

@sio.event
async def join_queue(sid, data):
    print(f"DEBUG: join_queue called for {sid} with data {data}")
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
    
    print(f"DEBUG: Session Device ID: {device_id}")
    if not device_id: 
        print("DEBUG: No device_id in session")
        return

    preference = data.get('preference', 'any')
    interests = data.get('interests', [])
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user or not user.gender:
            print("DEBUG: Gender missing")
            await sio.emit('error', {'message': 'User gender not found. Please verify first.'}, room=sid)
            return

        print(f"DEBUG: Matching for {device_id} ({user.gender}) seeking {preference} with interests {interests}")
        result = mapping_service.find_match(device_id, user.gender, preference, interests)
        print(f"DEBUG: Match Result: {result}")
        
        if result['status'] == 'matched':
            session_id = result['session_id']
            partner_id = result['partner_id']
            partner_gender = result['partner_gender']
            common_interest = result.get('common_interest')
            
            partner = db.query(User).filter(User.device_id == partner_id).first()
            partner_nickname = partner.nickname if (partner and partner.nickname) else "Stranger"
            user_nickname = user.nickname if user.nickname else "Stranger"

            match_payload = {
                'session_id': session_id,
                'partner_id': partner_id,
                'partner_gender': partner_gender,
                'partner_nickname': partner_nickname,
                'common_interest': common_interest
            }
            
            await sio.emit('match_found', match_payload, room=sid)
            
            partner_payload = {
                'session_id': session_id,
                'partner_id': device_id,
                'partner_gender': user.gender,
                'partner_nickname': user_nickname,
                'common_interest': common_interest
            }
            # Put both users in the room!
            await sio.enter_room(sid, session_id)
            
            # Save active session ID for disconnect handling
            async with sio.session(sid) as user_session:
                user_session['active_session_id'] = session_id

            # For the partner, we need their SID. 
            # We don't have partner's SID easily here unless we store it in Redis or look up.
            # But wait, mapping_service returned partner_id (device_id).
            # We emitted to room f"user_{partner_id}".
            # We can't enter_room for another SID easily if we don't know it.
            # BUT, we can make the CLIENT join the room upon 'match_found' event.
            await sio.emit('match_found', partner_payload, room=f"user_{partner_id}")
            
        elif result['status'] == 'queued':
            await sio.emit('match_queued', {'message': result['message']}, room=sid)

        elif result['status'] == 'limit_reached':
            # Send error or special limit event
            await sio.emit('error', {'message': result['message']}, room=sid)
            
        elif result['status'] == 'cooldown':
            await sio.emit('error', {'message': f"Please wait {result['wait']}s before matching again."}, room=sid)

        elif result['status'] == 'error':
            await sio.emit('error', {'message': result['message']}, room=sid)

    except Exception as e:
        print(f"DEBUG: Join Queue Error: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)
    finally:
        db.close()

@sio.event
async def leave_queue(sid, data):
    print(f"DEBUG: leave_queue called for {sid}")
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
    if device_id:
        print(f"DEBUG: Removing {device_id} from queue")
        mapping_service.leave_queue(device_id)

@sio.event
async def join_session(sid, data):
    session_id = data.get('session_id')
    if not session_id: return
    
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
        user_session['active_session_id'] = session_id
        if session_id.startswith('ai_session_'):
            user_session['is_ai_session'] = True
    
    await sio.enter_room(sid, session_id)

@sio.event
async def send_message(sid, data):
    session_id = data.get('session_id')
    content = data.get('content')
    if not session_id or not content: return
    
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
        is_ai_session = user_session.get('is_ai_session', False) or (session_id and session_id.startswith('ai_session_'))
        ai_interests = user_session.get('ai_interests', '')

    # Generate a unique message ID
    message_id = str(uuid.uuid4())

    # RELAY ONLY - NO STORAGE
    response = {
        'id': message_id,
        'sender_id': device_id,
        'content': content,
        'timestamp': import_datetime.utcnow().isoformat() + "Z"
    }
    await sio.emit('new_message', response, room=session_id)

    # AI RESPONSE HANDLING
    if is_ai_session:
        from app.services.ai_service import ai_service
        await sio.emit('partner_typing', {'is_typing': True}, room=session_id, skip_sid=sid)
        
        reply_content = await ai_service.generate_response(content, interests=ai_interests)
        
        await sio.emit('partner_typing', {'is_typing': False}, room=session_id, skip_sid=sid)
        
        ai_msg_id = str(uuid.uuid4())
        ai_msg = {
            'id': ai_msg_id,
            'sender_id': 'AI_PARTNER',
            'content': reply_content,
            'timestamp': import_datetime.utcnow().isoformat() + "Z"
        }
        await sio.emit('new_message', ai_msg, room=session_id)

@sio.event
async def join_ai_queue(sid, data):
    print(f"DEBUG: join_ai_queue {sid} {data}")
    interests = data.get('interests', '') or 'General Chat'
    
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
    
    print(f"DEBUG: Session Device ID: {device_id}")
    
    if not device_id: 
        print(f"DEBUG: join_ai_queue REJECTED - No device_id for sid {sid}")
        await sio.emit('error', {'message': 'Connection invalid (No Device ID). Please refresh.'}, room=sid)
        return

    # Create a virtual session ID for AI
    session_id = f"ai_session_{device_id}_{int(import_time.time())}"
    
    # Store interests in session for context
    async with sio.session(sid) as user_session:
        user_session['active_session_id'] = session_id
        user_session['ai_interests'] = interests
        user_session['is_ai_session'] = True

    await sio.enter_room(sid, session_id)
    
    # Match Found Emission
    match_payload = {
        'session_id': session_id,
        'partner_id': 'AI_PARTNER',
        'partner_gender': 'AI',
        'is_ai': True
    }
    await sio.emit('match_found', match_payload, room=sid)

    # Initial AI Greeting - emit to both sid and session_id room
    from app.services.ai_service import ai_service
    greeting = await ai_service.generate_response("Hello!", interests=interests)
    
    ai_greeting_msg = {
        'id': str(uuid.uuid4()),
        'sender_id': 'AI_PARTNER',
        'content': greeting,
        'timestamp': import_datetime.utcnow().isoformat() + "Z"
    }
    await sio.emit('new_message', ai_greeting_msg, room=session_id)
    await sio.emit('new_message', ai_greeting_msg, room=sid)

@sio.event
async def leave_chat(sid, data):
    session_id = data.get('session_id')
    if not session_id: return

    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
        # Clear active session
        if 'active_session_id' in user_session:
            del user_session['active_session_id']
            # Clear AI flags
            if 'is_ai_session' in user_session:
                del user_session['is_ai_session']
        
    await sio.leave_room(sid, session_id)
    await sio.emit('partner_left', {'reason': 'left'}, room=session_id)
    
    
    # DB Update to close session (only if real session UUID)
    if session_id and not session_id.startswith('ai_session_'):
        db = SessionLocal()
        try:
            sess = db.query(Session).filter(Session.session_id == session_id).first()
            if sess and sess.ended_at is None:
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
async def message_reaction(sid, data):
    session_id = data.get('session_id')
    message_id = data.get('messageId')
    emoji = data.get('emoji')
    user_id = data.get('userId')
    if not session_id or not message_id or not emoji or not user_id:
        return
    # Relay to the room, skip sender to prevent duplicate triggers
    await sio.emit('message_reaction', {
        'messageId': message_id,
        'emoji': emoji,
        'userId': user_id
    }, room=session_id, skip_sid=sid)

@sio.event
async def share_locale(sid, data):
    session_id = data.get('session_id')
    locale = data.get('locale')
    if not session_id or not locale: return
    await sio.emit('partner_locale', {'locale': locale}, room=session_id, skip_sid=sid)

@sio.event
async def submit_rating(sid, data):
    session_id = data.get('session_id')
    rating = data.get('rating')
    if not session_id or not rating: return
    await sio.emit('partner_rated', {'rating': rating}, room=session_id, skip_sid=sid)

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
        
        # Trust Score Logic
        if reported_device_id:
            reported_user = db.query(User).filter(User.device_id == reported_device_id).first()
            if reported_user:
                reported_user.trust_score = max(0, reported_user.trust_score - 10)
                if reported_user.trust_score < 50:
                    # Potential Soft Ban Logic (Future: increase cooldowns)
                    pass
        
        db.commit()
        await sio.emit('report_received', {'status': 'processed'}, room=sid)
    finally:
        db.close()
