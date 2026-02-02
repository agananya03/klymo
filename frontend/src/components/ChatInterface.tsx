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
        <div className="w-full max-w-2xl h-[85vh] md:h-[700px] flex flex-col bg-white/5 backdrop-blur-3xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center z-10">
                <div>
                    <h3 className="font-bold text-white flex items-center gap-2 tracking-wide">
                        <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] ${partnerLeft ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></span>
                        {sessionData.partner_nickname || "Stranger"}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-200/60 font-medium">Encrypted • Ephemeral</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                        title="Report User"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-2 px-4 text-white bg-blue-600/80 hover:bg-blue-600 rounded-xl transition font-bold flex items-center gap-2 text-sm shadow-lg hover:shadow-blue-500/20"
                        title="Next Match"
                    >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                    <button
                        onClick={handleLeave}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
                        title="Leave Chat"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* System Message */}
                <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase tracking-widest text-gray-400 border border-white/5">
                        Session Started
                    </span>
                </div>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-md backdrop-blur-sm ${msg.isMe
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-none border border-blue-500/30'
                            : 'bg-white/10 text-gray-100 rounded-bl-none border border-white/5'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {partnerTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-bl-none flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {partnerLeft && (
                    <div className="text-center py-6 space-y-3 animate-in fade-in zoom-in-95">
                        <p className="text-gray-400 text-sm">Partner left the chat.</p>
                        <button onClick={handleNext} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all">
                            Find Next Match ➔
                        </button>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/5 flex gap-3 items-center">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder={partnerLeft ? "Session ended." : "Type a message..."}
                    disabled={partnerLeft}
                    className="flex-1 p-4 rounded-full bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || partnerLeft}
                    className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95 flex items-center justify-center"
                >
                    <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>

            {/* Report Modal */}
            {
                showReportModal && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                        <div className="bg-[#1a1638] border border-white/10 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                            <h3 className="text-xl font-bold mb-4 text-white">Report User</h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Why are you reporting this user? We take safety seriously.
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
                                        className="w-full p-3 text-left rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition border border-transparent hover:border-white/10"
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="w-full p-3 bg-white/5 text-gray-400 rounded-xl font-medium hover:bg-white/10 hover:text-white transition"
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
