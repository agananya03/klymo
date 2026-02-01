'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function SocketTestPage() {
    const [connected, setConnected] = useState(false);
    const [inQueue, setInQueue] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [deviceId] = useState(() => `device_${Math.random().toString(36).substring(7)}`);
    const [gender, setGender] = useState('');
    const [preferredGender, setPreferredGender] = useState('');
    const socketRef = useRef<Socket | null>(null);

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${msg}`]);
    };

    useEffect(() => {
        const socket = io('http://localhost:8000', {
            auth: { device_id: deviceId }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            addLog(`Connected with ID: ${socket.id}`);
        });

        socket.on('disconnect', () => {
            setConnected(false);
            setSessionId(null);
            setInQueue(false);
            addLog('Disconnected');
        });

        socket.on('connected', (data) => {
            addLog(`Authenticated: ${JSON.stringify(data)}`);
        });

        socket.on('queue_joined', (data) => {
            setInQueue(true);
            addLog(`In queue: ${data.message}`);
        });

        socket.on('match_found', (data) => {
            setInQueue(false);
            setSessionId(data.session_id);
            addLog(`🎉 MATCH FOUND! Session: ${data.session_id}`);
            setMessages([]);
        });

        socket.on('new_message', (data) => {
            addLog(`New message received`);
            setMessages(prev => [...prev, `Partner: ${data.message}`]);
        });

        socket.on('message_sent', (data) => {
            setMessages(prev => [...prev, `You: ${data.message}`]);
        });

        socket.on('partner_left', (data) => {
            addLog(`Partner left: ${data.message}`);
            setSessionId(null);
        });

        socket.on('chat_ended', (data) => {
            addLog(`Chat ended: ${data.message} (Cooldown: ${data.cooldown_seconds}s)`);
            setSessionId(null);
        });

        socket.on('cooldown', (data) => {
            addLog(`⏳ Cooldown: ${data.remaining_seconds}s remaining`);
        });

        socket.on('report_submitted', (data) => {
            addLog(`Report submitted: ${data.report_id}`);
        });

        socket.on('typing', (data) => {
            if (data.is_typing) {
                addLog('Partner is typing...');
            }
        });

        socket.on('error', (data) => {
            addLog(`❌ Error: ${data.message}`);
        });

        return () => {
            socket.disconnect();
        };
    }, [deviceId]);

    const joinQueue = () => {
        if (socketRef.current) {
            socketRef.current.emit('join_queue', {
                device_id: deviceId,
                gender: gender || undefined,
                preferred_gender: preferredGender || undefined
            });
        }
    };

    const sendMessage = () => {
        if (socketRef.current && inputMessage) {
            socketRef.current.emit('send_message', { message: inputMessage });
            setInputMessage('');
        }
    };

    const leaveChat = () => {
        if (socketRef.current) {
            socketRef.current.emit('leave_chat', {});
        }
    };

    const nextMatch = () => {
        if (socketRef.current) {
            socketRef.current.emit('next_match', {
                gender: gender || undefined,
                preferred_gender: preferredGender || undefined
            });
        }
    };

    const reportUser = () => {
        if (socketRef.current) {
            socketRef.current.emit('report_user', {
                reason: 'inappropriate_behavior',
                description: 'Test report'
            });
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-2">Socket.IO Chat Test</h1>
            <p className="text-gray-400 mb-6">Device ID: {deviceId}</p>

            <div className="mb-4 flex items-center gap-4">
                <span className={`px-3 py-1 rounded ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
                    {connected ? 'Connected' : 'Disconnected'}
                </span>
                {inQueue && <span className="px-3 py-1 rounded bg-yellow-600">In Queue...</span>}
                {sessionId && <span className="px-3 py-1 rounded bg-purple-600">In Chat</span>}
            </div>

            {!sessionId && (
                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">Join Queue</h2>
                    <div className="flex gap-2 mb-3">
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="px-3 py-2 bg-gray-700 rounded"
                        >
                            <option value="">Your Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                        <select
                            value={preferredGender}
                            onChange={(e) => setPreferredGender(e.target.value)}
                            className="px-3 py-2 bg-gray-700 rounded"
                        >
                            <option value="">Preferred Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                        <button
                            onClick={joinQueue}
                            disabled={inQueue}
                            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {inQueue ? 'Waiting...' : 'Find Match'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        Chat {sessionId ? `(${sessionId.substring(0, 8)}...)` : ''}
                    </h2>
                    <div className="h-64 overflow-y-auto mb-4 bg-gray-900 rounded p-3">
                        {messages.length === 0 ? (
                            <p className="text-gray-500">No messages yet</p>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`mb-2 ${msg.startsWith('You:') ? 'text-blue-400' : 'text-green-400'}`}>
                                    {msg}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            disabled={!sessionId}
                            className="flex-1 px-4 py-2 bg-gray-900 rounded border border-gray-600 disabled:opacity-50"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!sessionId}
                            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                    {sessionId && (
                        <div className="flex gap-2">
                            <button onClick={leaveChat} className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700">
                                Leave Chat
                            </button>
                            <button onClick={nextMatch} className="px-3 py-1 bg-yellow-600 rounded text-sm hover:bg-yellow-700">
                                Next Match
                            </button>
                            <button onClick={reportUser} className="px-3 py-1 bg-orange-600 rounded text-sm hover:bg-orange-700">
                                Report User
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Event Logs</h2>
                    <div className="h-80 overflow-y-auto bg-gray-900 rounded p-3 font-mono text-sm text-green-400">
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
