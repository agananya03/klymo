'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';

interface ChatInterfaceProps {
    sessionData: {
        session_id: string;
        partner_id: string;
        partner_nickname?: string;
        partner_gender?: string;
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
    const [showReportModal, setShowReportModal] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [partnerTyping, setPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const socket = getSocket();

        // Join the room!
        socket.emit('join_session', { session_id: sessionData.session_id });

        // Define handlers
        const handleNewMessage = (data: any) => {
            setPartnerTyping(false);
            setMessages((prev) => [...prev, {
                id: Date.now().toString() + Math.random().toString(), // Unique ID
                sender_id: data.sender_id,
                content: data.content,
                timestamp: data.timestamp,
                isMe: data.sender_id === myIdRef.current // Use Ref
            }]);
        };

        const handlePartnerLeft = () => {
            setPartnerLeft(true);
            setPartnerTyping(false);
        };

        const handlePartnerTyping = (data: any) => {
            setPartnerTyping(data.is_typing);
        };

        // Register listeners synchronously
        socket.on('new_message', handleNewMessage);
        socket.on('partner_left', handlePartnerLeft);
        socket.on('partner_typing', handlePartnerTyping);

        // Async ID fetch
        const fetchIds = async () => {
            const id = await generateDeviceId();
            setMyId(id);
            myIdRef.current = id;
        };
        fetchIds();

        // Load persisted messages
        const saved = sessionStorage.getItem(`chat_${sessionData.session_id}`);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved chat", e);
            }
        }

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('partner_left', handlePartnerLeft);
            socket.off('partner_typing', handlePartnerTyping);
        };
    }, []);

    // Scroll to bottom & Persist
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        // Persist to session storage
        if (messages.length > 0) {
            sessionStorage.setItem(`chat_${sessionData.session_id}`, JSON.stringify(messages));
        }
    }, [messages, partnerTyping, sessionData.session_id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);

        const socket = getSocket();

        // Emit typing start
        socket.emit('typing_start', { session_id: sessionData.session_id });

        // Debounce stop
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', { session_id: sessionData.session_id });
        }, 1500);
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const socket = getSocket();
        socket.emit('send_message', {
            session_id: sessionData.session_id,
            content: input.trim()
        });

        // Stop typing immediately on send
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', { session_id: sessionData.session_id });

        setInput('');
    };

    const handleLeave = () => {
        const socket = getSocket();
        socket.emit('leave_chat', { session_id: sessionData.session_id });
        sessionStorage.removeItem(`chat_${sessionData.session_id}`);
        onLeave();
    };

    // Also clear on "Next Match" (handled by parent onNext usually, but good to clean here OR parent)
    // We'll wrap onNext to clear storage
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
            reported_device_id: sessionData.partner_id
        });
        setShowReportModal(false);
        alert("Report submitted."); // Optional feedback
        handleLeave();
    };

    return (
        <div className="w-full max-w-2xl h-[90vh] md:h-[700px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${partnerLeft ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></span>
                        {sessionData.partner_nickname || "Stranger"}
                    </h3>
                    <p className="text-xs text-gray-400">Encrypted • Ephemeral</p>
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
                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-bold flex items-center gap-1"
                        title="Next Match"
                    >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-950/50">
                {/* System Message */}
                <div className="text-center text-xs text-gray-400 my-4">
                    Session Started. Say hi! 👋
                </div>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${msg.isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {partnerTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1">
                        <div className="bg-gray-200 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none text-xs text-gray-500 flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {partnerLeft && (
                    <div className="text-center py-4 space-y-2">
                        <p className="text-gray-500 text-sm">Partner left the chat.</p>
                        <button onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-blue-700 transition">
                            Find Next Match ➔
                        </button>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder={partnerLeft ? "Session ended." : "Type a message..."}
                    disabled={partnerLeft}
                    className="flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || partnerLeft}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:scale-95 transition shadow-md w-12 h-12 flex items-center justify-center transform active:scale-95"
                >
                    ➤
                </button>
            </form>

            {/* Report Modal */}
            {
                showReportModal && (
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
                )
            }
        </div >
    );
}
