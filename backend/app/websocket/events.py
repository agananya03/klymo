import socketio
import logging
from datetime import datetime
from app.core.socket_server import sio
from app.core.database import SessionLocal
from app.models.sql_models import User, Session, Report
from app.services.matching_service import mapping_service
from sqlalchemy import func

logger = logging.getLogger(__name__)

@sio.event
async def connect(sid, environ, auth):
    print(f"DEBUG: Connect Event {sid}")
    device_id = None
    
    # 1. Try to get device_id from auth (standard way)
    if auth and 'device_id' in auth:
        device_id = auth['device_id']
    
    # 2. Fallback to query string (for debugging or older clients)
    if not device_id:
        from urllib.parse import parse_qs
        query_string = environ.get('QUERY_STRING', '')
        params = parse_qs(query_string)
        if 'device_id' in params:
            device_id = params['device_id'][0]

    if not device_id:
        logger.warning(f"Connection rejected: No device_id provided (sid: {sid})")
        return False 

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.device_id == device_id).first()
        if not user:
            logger.warning(f"Connection rejected: User {device_id} not found")
            return False
        
        await sio.save_session(sid, {'device_id': device_id})
        
        # Join ONLY user room (not session room yet)
        await sio.enter_room(sid, f"user_{device_id}")
        
        logger.info(f"✅ Connected: {device_id} (sid: {sid})")
        return True
    except Exception as e:
        logger.error(f"Connect error: {e}")
        return False
    finally:
        db.close()

@sio.event
async def disconnect(sid):
    try:
        async with sio.session(sid) as user_session:
            device_id = user_session.get('device_id')
        
        if device_id:
            logger.info(f"👋 Disconnected: {device_id}")
            mapping_service.leave_queue(device_id)
    except Exception as e:
        logger.error(f"Disconnect error: {e}")

@sio.event
async def join_queue(sid, data):
    """
    Client requests to match.
    payload: { 'preference': 'male'|'female'|'any' }
    """
    try:
        async with sio.session(sid) as user_session:
            device_id = user_session.get('device_id')
        
        if not device_id:
            logger.error("join_queue: No device_id in session")
            return

        preference = data.get('preference', 'any')
        
        db = SessionLocal()
        try:
            result = mapping_service.join_queue(db, device_id, preference)
            
            if result['status'] == 'matched':
                session_id = result['session_id']
                partner_data = result['partner']
                partner_id = partner_data['device_id']
                
                logger.info(f"🎉 Match फाउंड! {device_id} <-> {partner_id} (session: {session_id})")
                
                # Payloads for both users
                match_payload_me = {
                    'session_id': session_id,
                    'partner': partner_data
                }
                
                # Fetch my details for partner
                me = db.query(User).filter(User.device_id == device_id).first()
                match_payload_partner = {
                    'session_id': session_id,
                    'partner': {
                        'device_id': device_id,
                        'nickname': me.nickname if me.nickname else 'Stranger',
                        'gender': me.gender
                    }
                }
                
                # Emit to individual user rooms
                await sio.emit('match_found', match_payload_me, room=f"user_{device_id}")
                await sio.emit('match_found', match_payload_partner, room=f"user_{partner_id}")
                
            elif result['status'] == 'queued':
                await sio.emit('queue_status', {'status': 'queued'}, room=sid)
                logger.info(f"⏳ Queued: {device_id} (seeking {preference})")
            
            elif result['status'] == 'cooldown':
                await sio.emit('error', {'message': f"Please wait {result['wait']}s before matching again."}, room=sid)
            
            elif result['status'] == 'limit_reached':
                await sio.emit('error', {'message': result['message']}, room=sid)

            else:
                await sio.emit('error', {'message': result.get('message', 'Unknown error')}, room=sid)

        except Exception as e:
            logger.error(f"join_queue error: {e}", exc_info=True)
            await sio.emit('error', {'message': str(e)}, room=sid)
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"join_queue handler error: {e}", exc_info=True)

@sio.event
async def join_session(sid, data):
    """
    Client joins the socket room for a specific session.
    """
    session_id = data.get('session_id')
    if not session_id:
        return
    
    async with sio.session(sid) as user_session:
        device_id = user_session.get('device_id')
    
    if not device_id:
        return

    # Optional: Verify user belongs to session in DB before allowing room entry
    await sio.enter_room(sid, session_id)
    logger.info(f"User {device_id} joined session room {session_id}")

@sio.event
async def send_message(sid, data):
    """
    Send a message in a chat session.
    Emits to BOTH users individually to avoid duplication and ensure delivery.
    """
    session_id = data.get('session_id')
    content = data.get('content')
    
    if not session_id or not content:
        return
    
    try:
        async with sio.session(sid) as user_session:
            device_id = user_session.get('device_id')

        if not device_id:
            return

        db = SessionLocal()
        try:
            sess = db.query(Session).filter(Session.session_id == session_id).first()
            if not sess:
                logger.error(f"Session {session_id} not found")
                return
            
            # Verify sender is part of session
            if device_id not in [sess.user1_device_id, sess.user2_device_id]:
                logger.warning(f"Unauthorized message attempt by {device_id}")
                return
            
            response = {
                'sender_id': device_id,
                'content': content,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Emit to session room OR individually
            # Emitting individually ensures we can track delivery if needed, 
            # but room is simpler for basic relay. 
            # HEAD preferred individual emits to avoid duplication issues in some clients.
            await sio.emit('new_message', response, room=f"user_{sess.user1_device_id}")
            await sio.emit('new_message', response, room=f"user_{sess.user2_device_id}")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"send_message error: {e}")

@sio.event
async def typing_start(sid, data):
    session_id = data.get('session_id')
    if not session_id:
        return
    
    try:
        async with sio.session(sid) as user_session:
            device_id = user_session.get('device_id')
        
        if not device_id:
            return
        
        db = SessionLocal()
        try:
            sess = db.query(Session).filter(Session.session_id == session_id).first()
            if not sess:
                return
            
            # Send to partner only
            partner_id = sess.user2_device_id if device_id == sess.user1_device_id else sess.user1_device_id
            await sio.emit('partner_typing', {'is_typing': True}, room=f"user_{partner_id}")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"typing_start error: {e}")

@sio.event
async def typing_stop(sid, data):
    session_id = data.get('session_id')
    if not session_id:
        return
    
    try:
        async with sio.session(sid) as user_session:
            device_id = user_session.get('device_id')
        
        if not device_id:
            return
        
        db = SessionLocal()
        try:
            sess = db.query(Session).filter(Session.session_id == session_id).first()
            if not sess:
                return
            
            # Send to partner only
            partner_id = sess.user2_device_id if device_id == sess.user1_device_id else sess.user1_device_id
            await sio.emit('partner_typing', {'is_typing': False}, room=f"user_{partner_id}")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"typing_stop error: {e}")

@sio.event
async def leave_chat(sid, data):
    session_id = data.get('session_id')
    if not session_id:
        return

    try:
        async with sio.session(sid) as user_session:
            device_id = user_session.get('device_id')
        
        if not device_id:
            return
        
        db = SessionLocal()
        try:
            sess = db.query(Session).filter(Session.session_id == session_id).first()
            if sess:
                # Notify both users
                await sio.emit('partner_left', {'reason': 'left'}, room=f"user_{sess.user1_device_id}")
                await sio.emit('partner_left', {'reason': 'left'}, room=f"user_{sess.user2_device_id}")
                
                # Update session
                sess.is_active = False
                sess.ended_at = func.now()
                db.commit()
                
                logger.info(f"Session {session_id} ended by {device_id}")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"leave_chat error: {e}")

@sio.event
async def report_user(sid, data):
    session_id = data.get('session_id')
    reason = data.get('reason')
    reported_device_id = data.get('reported_device_id')
    
    if not session_id or not reason:
        return
    
    try:
        async with sio.session(sid) as user_session:
            reporter_id = user_session.get('device_id')
        
        if not reporter_id:
            return
            
        db = SessionLocal()
        try:
            report = Report(
                session_id=session_id,
                reporter_device_id=reporter_id,
                reported_device_id=reported_device_id,
                reason=reason
            )
            db.add(report)
            db.commit()
            
            await sio.emit('report_received', {'status': 'processed'}, room=sid)
            logger.info(f"📋 Report: {reporter_id} → {reported_device_id} ({reason})")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"report_user error: {e}")
