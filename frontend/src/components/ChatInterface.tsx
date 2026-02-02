'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';

interface ChatInterfaceProps {
    sessionData: {
        session_id: string;
        partner: {
            device_id: string;
            nickname?: string;
            gender?: string;
        };
    };
    onLeave: () => void;
    onNext: () => void;
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    timestamp: string;
    isMe: boolean;
}

export default function ChatInterface({ sessionData, onLeave, onNext }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [myId, setMyId] = useState<string>('');
    const myIdRef = useRef<string>(''); // Ref for sync access in listener
    const [partnerLeft, setPartnerLeft] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isConnected, setIsConnected] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // CRITICAL: Use ref to prevent duplicate listeners
    const listenersRegistered = useRef(false);

    useEffect(() => {
        const socket = getSocket();

        // Focus input on mount
        inputRef.current?.focus();

        const init = async () => {
            const id = await generateDeviceId();
            setMyId(id);
            myIdRef.current = id;

            // Join the room!
            socket.emit('join_session', { session_id: sessionData.session_id });

            // IMPORTANT: Only register listeners once!
            if (listenersRegistered.current) {
                console.log('⚠️ Listeners already registered, skipping');
                return;
            }

            console.log('✅ Registering socket listeners');
            listenersRegistered.current = true;

            // Handler functions
            const handleNewMessage = (data: any) => {
                console.log('📨 Received message:', data);
                setPartnerTyping(false);
                setMessages((prev) => {
                    // Prevent duplicates
                    const exists = prev.some(m =>
                        m.sender_id === data.sender_id &&
                        m.content === data.content &&
                        Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp).getTime()) < 1000
                    );

                    if (exists) {
                        console.log('⚠️ Duplicate message detected, ignoring');
                        return prev;
                    }

                    return [...prev, {
                        id: `${Date.now()}-${Math.random()}`,
                        sender_id: data.sender_id,
                        content: data.content,
                        timestamp: data.timestamp || new Date().toISOString(),
                        isMe: data.sender_id === myIdRef.current
                    }];
                });
            };

            const handlePartnerLeft = () => {
                console.log('👋 Partner left');
                setPartnerLeft(true);
                setPartnerTyping(false);
            };

            const handlePartnerTyping = (data: any) => {
                setPartnerTyping(data.is_typing);
            };

            const handleDisconnect = () => {
                console.log('🔴 Socket disconnected');
                setIsConnected(false);
            };

            const handleConnect = () => {
                console.log('🟢 Socket connected');
                setIsConnected(true);
            };

            // Register listeners
            socket.on('new_message', handleNewMessage);
            socket.on('partner_left', handlePartnerLeft);
            socket.on('partner_typing', handlePartnerTyping);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect', handleConnect);

            // Return cleanup
            return () => {
                console.log('🧹 Cleaning up socket listeners');
                socket.off('new_message', handleNewMessage);
                socket.off('partner_left', handlePartnerLeft);
                socket.off('partner_typing', handlePartnerTyping);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect', handleConnect);
                listenersRegistered.current = false;
            };
        };

        const cleanupPromise = init();

        // Load persisted messages
        const saved = sessionStorage.getItem(`chat_${sessionData.session_id}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed);
                console.log(`📂 Loaded ${parsed.length} messages from storage`);
            } catch (e) {
                console.error("Failed to parse saved chat", e);
            }
        }

        return () => {
            cleanupPromise.then(cleanup => cleanup?.());
        };
    }, [sessionData.session_id]); // Only run when session_id changes

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, partnerTyping]);

    // Persist messages
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(`chat_${sessionData.session_id}`, JSON.stringify(messages));
        }
    }, [messages, sessionData.session_id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);

        const socket = getSocket();
        socket.emit('typing_start', { session_id: sessionData.session_id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', { session_id: sessionData.session_id });
        }, 1500);
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || partnerLeft) return;

        const socket = getSocket();
        console.log('📤 Sending message:', input);
        socket.emit('send_message', {
            session_id: sessionData.session_id,
            content: input.trim()
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', { session_id: sessionData.session_id });

        setInput('');
        inputRef.current?.focus();
    };

    const handleLeave = () => {
        const socket = getSocket();
        socket.emit('leave_chat', { session_id: sessionData.session_id });
        sessionStorage.removeItem(`chat_${sessionData.session_id}`);
        onLeave();
    };

    const handleNext = () => {
        if (!partnerLeft) {
            const socket = getSocket();
            socket.emit('leave_chat', { session_id: sessionData.session_id });
        }
        sessionStorage.removeItem(`chat_${sessionData.session_id}`);
        onNext();
    };

    const handleReport = (reason: string) => {
        const socket = getSocket();
        socket.emit('report_user', {
            session_id: sessionData.session_id,
            reason: reason,
            reported_device_id: sessionData.partner.device_id
        });
        setShowReportModal(false);
        handleLeave();
    };

    return (
        <div className="w-full max-w-2xl h-[90vh] md:h-[700px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {sessionData.partner.nickname?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${partnerLeft ? 'bg-gray-400' : 'bg-green-500'} ${!partnerLeft && 'animate-pulse'}`}></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">
                            {sessionData.partner.nickname || "Anonymous"}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {partnerLeft ? 'Left chat' : partnerTyping ? 'Typing...' : 'Online'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Report User"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition font-bold"
                        title="Next Match"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                    <button
                        onClick={handleLeave}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Leave Chat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                <div className="flex justify-center">
                    <div className="text-center text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                        🔒 End-to-end encrypted • Session started
                    </div>
                </div>

                {messages.length === 0 && !partnerLeft && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
                        <div className="text-6xl">💬</div>
                        <p className="text-gray-500 dark:text-gray-400">Start the conversation!</p>
                        <p className="text-xs text-gray-400">Say hi to break the ice 👋</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-200`}>
                        <div className="max-w-[75%] md:max-w-[60%] group">
                            <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.isMe
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-200 dark:border-gray-700'
                                }`}>
                                <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <p className={`text-xs text-gray-400 mt-1 px-2 opacity-0 group-hover:opacity-100 transition ${msg.isMe ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {partnerTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1">
                        <div className="bg-gray-200 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-sm text-xs text-gray-500 flex gap-1 items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {partnerLeft && (
                    <div className="flex justify-center animate-in fade-in zoom-in duration-300">
                        <div className="text-center py-6 space-y-4 bg-gray-100 dark:bg-gray-800 rounded-xl px-8 max-w-sm">
                            <div className="text-4xl">👋</div>
                            <p className="text-gray-600 dark:text-gray-300 font-medium">Partner left the chat</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ready for your next connection?</p>
                            <button
                                onClick={handleNext}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition transform"
                            >
                                Find Next Match →
                            </button>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                {!isConnected && (
                    <div className="mb-2 text-xs text-center text-red-500 bg-red-50 dark:bg-red-900/20 py-1 rounded">
                        ⚠ Connection lost. Reconnecting...
                    </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={partnerLeft ? "Chat ended" : "Type your message..."}
                        disabled={partnerLeft || !isConnected}
                        maxLength={500}
                        className="flex-1 p-3 px-4 rounded-full bg-gray-100 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || partnerLeft || !isConnected}
                        className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:scale-95 transition shadow-md w-12 h-12 flex items-center justify-center transform active:scale-95 disabled:cursor-not-allowed"
                        title="Send message"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-2">
                    {input.length}/500 • Press Enter to send
                </p>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Report User</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Why are you reporting this user? This helps us maintain a safe community.
                        </p>
                        <div className="space-y-2 mb-6">
                            {[
                                'Inappropriate behavior',
                                'Harassment or bullying',
                                'Spam or scam',
                                'Offensive language',
                                'Other'
                            ].map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => handleReport(reason)}
                                    className="w-full p-3 text-left rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowReportModal(false)}
                            className="w-full p-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}