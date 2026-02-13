'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';
import { analyzeToxicity } from '@/utils/toxicity';
import { getRandomStarter } from '@/utils/conversation-starters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

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
    const myIdRef = useRef<string>('');
    const [partnerLeft, setPartnerLeft] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isConnected, setIsConnected] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const listenersRegistered = useRef(false);

    useEffect(() => {
        const socket = getSocket();
        inputRef.current?.focus();

        const init = async () => {
            const id = await generateDeviceId();
            setMyId(id);
            myIdRef.current = id;

            socket.emit('join_session', { session_id: sessionData.session_id });

            if (listenersRegistered.current) return;
            listenersRegistered.current = true;

            const handleNewMessage = (data: any) => {
                setPartnerTyping(false);
                setMessages((prev) => {
                    const exists = prev.some(m =>
                        m.sender_id === data.sender_id &&
                        m.content === data.content &&
                        Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp).getTime()) < 1000
                    );

                    if (exists) return prev;

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
                setPartnerLeft(true);
                setPartnerTyping(false);
            };

            const handlePartnerTyping = (data: any) => {
                setPartnerTyping(data.is_typing);
            };

            const handleDisconnect = () => setIsConnected(false);
            const handleConnect = () => setIsConnected(true);

            socket.on('new_message', handleNewMessage);
            socket.on('partner_left', handlePartnerLeft);
            socket.on('partner_typing', handlePartnerTyping);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect', handleConnect);

            return () => {
                socket.off('new_message', handleNewMessage);
                socket.off('partner_left', handlePartnerLeft);
                socket.off('partner_typing', handlePartnerTyping);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect', handleConnect);
                listenersRegistered.current = false;
            };
        };

        const cleanupPromise = init();

        const saved = sessionStorage.getItem(`chat_${sessionData.session_id}`);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved chat", e);
            }
        }

        return () => {
            cleanupPromise.then(cleanup => cleanup?.());
        };
    }, [sessionData.session_id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, partnerTyping]);

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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || partnerLeft) return;

        // AI-Powered Toxicity Check
        const analysis = await analyzeToxicity(input);
        if (analysis.isToxic) {
            alert(`⚠️ Message blocked: ${analysis.reason}. Please be kind!`);
            return;
        }

        const socket = getSocket();
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
        <Card className="w-full max-w-2xl h-[90vh] md:h-[700px] flex flex-col p-0 overflow-hidden relative">
            {/* Header */}
            <div className="p-4 bg-primary border-b-[3px] border-black flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl border-[3px] border-white shadow-sm">
                            {sessionData.partner.nickname?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-black ${partnerLeft ? 'bg-gray-400' : 'bg-green-500'}`}></span>
                    </div>
                    <div>
                        <h3 className="font-black uppercase text-xl text-black leading-none">
                            {sessionData.partner.nickname || "Stranger"}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                            {partnerLeft ? 'LEFT CHAT' : partnerTyping ? 'TYPING...' : 'ONLINE'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowReportModal(true)} variant="outline" size="sm" className="px-2 border-2">⚠️</Button>
                    {sessionData.partner.device_id !== 'AI_PARTNER' && sessionData.partner.nickname !== 'AI Partner' && (
                        <Button onClick={handleNext} variant="secondary" size="sm" className="font-bold border-2">NEXT ➔</Button>
                    )}
                    <Button onClick={handleLeave} variant="outline" size="sm" className="px-2 border-red-500 text-red-500 border-2">✕</Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <div className="flex justify-center mb-6">
                    <div className="text-xs font-bold uppercase bg-black text-white px-3 py-1 -skew-x-12">
                        ENCRYPTED CHAT
                    </div>
                </div>

                {messages.length === 0 && !partnerLeft && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <div className="text-8xl grayscale">💬</div>
                        <p className="font-bold uppercase text-2xl">SAY SOMETHING</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[80%] p-4 border-[3px] border-black shadow-[4px_4px_0px_0px_#000] ${msg.isMe
                            ? 'bg-accent text-black rounded-none mr-2'
                            : 'bg-white text-black rounded-none ml-2'
                            }`}>
                            <p className="font-medium text-lg leading-tight">{msg.content}</p>
                            <p className="text-[10px] font-bold uppercase mt-2 opacity-50 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {partnerTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 border-[3px] border-black p-3 flex gap-1 items-center shadow-[4px_4px_0px_0px_#000]">
                            <span className="w-2 h-2 bg-black animate-bounce"></span>
                            <span className="w-2 h-2 bg-black animate-bounce [animation-delay:0.1s]"></span>
                            <span className="w-2 h-2 bg-black animate-bounce [animation-delay:0.2s]"></span>
                        </div>
                    </div>
                )}

                {partnerLeft && (
                    <div className="flex justify-center p-8">
                        <Card className="text-center bg-gray-100 border-dashed">
                            <h3 className="text-2xl font-black uppercase mb-2">Partner Disconnected</h3>
                            <Button onClick={handleNext} variant="primary" size="lg" className="w-full">
                                Find Next Match
                            </Button>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t-[3px] border-black z-20">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={partnerLeft ? "CHAT ENDED" : "TYPE SOMETHING..."}
                        disabled={partnerLeft || !isConnected}
                        maxLength={500}
                        className="flex-1 p-4 border-[3px] border-black font-bold uppercase placeholder:text-gray-400 focus:outline-none focus:bg-yellow-50 focus:shadow-hard transition-all"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="px-3 bg-yellow-400 text-black border-2 border-black shadow-hard rounded-none"
                        onClick={() => setInput(getRandomStarter())}
                        title="Get a Conversation Starter"
                    >
                        ❄️
                    </Button>
                    <Button
                        type="submit"
                        disabled={!input.trim() || partnerLeft || !isConnected}
                        variant="primary"
                        className="px-6 disabled:opacity-50 disabled:shadow-none"
                    >
                        SEND
                    </Button>
                </form>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card variant="white" className="w-full max-w-sm">
                        <h3 className="text-2xl font-black uppercase mb-4 bg-red-500 text-white p-2 border-[3px] border-black -mx-6 -mt-6 text-center">Report User</h3>
                        <div className="space-y-2 mb-6">
                            {[
                                'Inappropriate behavior',
                                'Harassment',
                                'Spam',
                                'Other'
                            ].map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => handleReport(reason)}
                                    className="w-full p-3 text-left font-bold uppercase border-[3px] border-black hover:bg-red-100 hover:shadow-hard transition-all"
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={() => setShowReportModal(false)}
                            variant="outline"
                            className="w-full"
                        >
                            CANCEL
                        </Button>
                    </Card>
                </div>
            )}
        </Card>
    );
}