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
        common_interest?: string;
    };
    onLeave: () => void;
    onChatCompleted: (partnerLocale: string | null) => void;
    onMessageSent: () => void;
    onReceivedFiveStarRating: () => void;
    initialIcebreaker?: string | null;
    onChatEnded: (data: {
        duration: number;
        commonInterest?: string | null;
        messageCount: number;
        sessionId: string;
        partnerNickname: string;
        partnerDeviceId: string;
        action: 'leave' | 'next';
    }) => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface ReactionsState {
    [messageId: string]: {
        [emoji: string]: string[];
    };
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    timestamp: string;
    isMe: boolean;
}

export default function ChatInterface({ sessionData, onLeave, onChatCompleted, onMessageSent, onReceivedFiveStarRating, initialIcebreaker = null, onChatEnded }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState(initialIcebreaker || '');
    const [myId, setMyId] = useState<string>('');
    const myIdRef = useRef<string>('');
    const [partnerLeft, setPartnerLeft] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [showInterestBadge, setShowInterestBadge] = useState(true);
    const [showChallengeBanner, setShowChallengeBanner] = useState(true);

    const [reactions, setReactions] = useState<ReactionsState>({});
    const [activePickerMessageId, setActivePickerMessageId] = useState<string | null>(null);
    const [isTouch, setIsTouch] = useState(false);

    // Badges / Stats related states
    const [partnerLocale, setPartnerLocale] = useState<string | null>(null);
    const partnerLocaleRef = useRef<string | null>(null);
    // Removed old rating states (handled in PostChatSummary)

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isTypingRef = useRef(false);
    const typingStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const typingStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartXRef = useRef<number>(0);
    const touchStartYRef = useRef<number>(0);

    const listenersRegistered = useRef(false);

    const toggleReactionInState = (messageId: string, emoji: string, userId: string) => {
        setReactions((prev) => {
            const msgReactions = prev[messageId] || {};
            const userList = msgReactions[emoji] || [];

            let newUsers: string[];
            if (userList.includes(userId)) {
                newUsers = userList.filter(id => id !== userId);
            } else {
                newUsers = [...userList, userId];
            }

            const newMsgReactions = { ...msgReactions };
            if (newUsers.length > 0) {
                newMsgReactions[emoji] = newUsers;
            } else {
                delete newMsgReactions[emoji];
            }

            const newReactions = { ...prev };
            if (Object.keys(newMsgReactions).length > 0) {
                newReactions[messageId] = newMsgReactions;
            } else {
                delete newReactions[messageId];
            }

            return newReactions;
        });
    };

    const handleReact = (messageId: string, emoji: string) => {
        if (!myIdRef.current) return;
        // 1. Toggle locally (optimistic)
        toggleReactionInState(messageId, emoji, myIdRef.current);

        // 2. Emit event to socket
        const socket = getSocket();
        socket.emit('message_reaction', {
            session_id: sessionData.session_id,
            messageId,
            emoji,
            userId: myIdRef.current
        });

        // Close picker
        setActivePickerMessageId(null);
    };

    const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (msgId: string) => {
        if (isTouch) return;
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }
        setActivePickerMessageId(msgId);
    };

    const handleMouseLeave = () => {
        if (isTouch) return;
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
        }
        leaveTimeoutRef.current = setTimeout(() => {
            setActivePickerMessageId(null);
        }, 300);
    };

    const handleTouchStart = (msgId: string, e: React.TouchEvent) => {
        setIsTouch(true);
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;

        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
        }

        touchTimerRef.current = setTimeout(() => {
            setActivePickerMessageId(msgId);
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartXRef.current;
        const dy = touch.clientY - touchStartYRef.current;

        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
                touchTimerRef.current = null;
            }
        }
    };

    const handleTouchEnd = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
    };

    useEffect(() => {
        const socket = getSocket();
        inputRef.current?.focus();

        const init = async () => {
            const id = await generateDeviceId();
            setMyId(id);
            myIdRef.current = id;

            socket.emit('join_session', { session_id: sessionData.session_id });

            // Share local browser locale
            const userLocale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
            socket.emit('share_locale', { session_id: sessionData.session_id, locale: userLocale });

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
                        id: data.id || `${Date.now()}-${Math.random()}`,
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

            const handleMessageReaction = (data: any) => {
                const { messageId, emoji, userId } = data;
                toggleReactionInState(messageId, emoji, userId);
            };

            const handlePartnerLocale = (data: any) => {
                if (data && data.locale) {
                    setPartnerLocale(data.locale);
                    partnerLocaleRef.current = data.locale;
                }
            };

            const handleDisconnect = () => setIsConnected(false);
            const handleConnect = () => setIsConnected(true);

            socket.on('new_message', handleNewMessage);
            socket.on('partner_left', handlePartnerLeft);
            socket.on('partner_typing', handlePartnerTyping);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect', handleConnect);
            socket.on('message_reaction', handleMessageReaction);
            socket.on('partner_locale', handlePartnerLocale);

            return () => {
                socket.off('new_message', handleNewMessage);
                socket.off('partner_left', handlePartnerLeft);
                socket.off('partner_typing', handlePartnerTyping);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect', handleConnect);
                socket.off('message_reaction', handleMessageReaction);
                socket.off('partner_locale', handlePartnerLocale);
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

        const savedReactions = sessionStorage.getItem(`reactions_${sessionData.session_id}`);
        if (savedReactions) {
            try {
                setReactions(JSON.parse(savedReactions));
            } catch (e) {
                console.error("Failed to parse saved reactions", e);
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
        return () => {
            if (typingStartTimeoutRef.current) clearTimeout(typingStartTimeoutRef.current);
            if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
            if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
            if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(`chat_${sessionData.session_id}`, JSON.stringify(messages));
        }
    }, [messages, sessionData.session_id]);

    useEffect(() => {
        if (reactions && Object.keys(reactions).length > 0) {
            sessionStorage.setItem(`reactions_${sessionData.session_id}`, JSON.stringify(reactions));
        } else {
            sessionStorage.removeItem(`reactions_${sessionData.session_id}`);
        }
    }, [reactions, sessionData.session_id]);

    useEffect(() => {
        if (!activePickerMessageId) return;

        const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.reaction-picker') && !target.closest('.message-bubble')) {
                setActivePickerMessageId(null);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, [activePickerMessageId]);

    useEffect(() => {
        const sessionStartKey = `chat_start_time_${sessionData.session_id}`;
        const sessionCompletedKey = `chat_completed_${sessionData.session_id}`;

        let startTime = sessionStorage.getItem(sessionStartKey);
        if (!startTime) {
            startTime = Date.now().toString();
            sessionStorage.setItem(sessionStartKey, startTime);
        }
        const startMs = parseInt(startTime, 10);

        const elapsed = Date.now() - startMs;
        const remaining = 120000 - elapsed;

        let completionTimeout: NodeJS.Timeout | null = null;

        if (remaining > 0) {
            completionTimeout = setTimeout(() => {
                const alreadyCompleted = sessionStorage.getItem(sessionCompletedKey);
                if (!alreadyCompleted) {
                    sessionStorage.setItem(sessionCompletedKey, 'true');
                    onChatCompleted(partnerLocaleRef.current);
                }
            }, remaining);
        } else {
            const alreadyCompleted = sessionStorage.getItem(sessionCompletedKey);
            if (!alreadyCompleted) {
                sessionStorage.setItem(sessionCompletedKey, 'true');
                onChatCompleted(partnerLocaleRef.current);
            }
        }

        return () => {
            if (completionTimeout) {
                clearTimeout(completionTimeout);
            }
        };
    }, [sessionData.session_id, onChatCompleted]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        const socket = getSocket();

        // Clear any pending stop timeout since user is typing
        if (typingStopTimeoutRef.current) {
            clearTimeout(typingStopTimeoutRef.current);
            typingStopTimeoutRef.current = null;
        }

        // If we are not currently flagged as typing
        if (!isTypingRef.current) {
            // Debounce the typing_start emit by 300ms to avoid flooding
            if (!typingStartTimeoutRef.current) {
                typingStartTimeoutRef.current = setTimeout(() => {
                    socket.emit('typing_start', { session_id: sessionData.session_id });
                    isTypingRef.current = true;
                    typingStartTimeoutRef.current = null;
                }, 300);
            }
        }

        // Stop emitting the typing event 2 seconds after the user stops typing (debounce)
        typingStopTimeoutRef.current = setTimeout(() => {
            if (isTypingRef.current) {
                socket.emit('typing_stop', { session_id: sessionData.session_id });
                isTypingRef.current = false;
            }
            if (typingStartTimeoutRef.current) {
                clearTimeout(typingStartTimeoutRef.current);
                typingStartTimeoutRef.current = null;
            }
        }, 2000);
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
        
        onMessageSent();

        if (typingStartTimeoutRef.current) {
            clearTimeout(typingStartTimeoutRef.current);
            typingStartTimeoutRef.current = null;
        }
        if (typingStopTimeoutRef.current) {
            clearTimeout(typingStopTimeoutRef.current);
            typingStopTimeoutRef.current = null;
        }
        if (isTypingRef.current) {
            socket.emit('typing_stop', { session_id: sessionData.session_id });
            isTypingRef.current = false;
        }

        setInput('');
        inputRef.current?.focus();
    };



    const checkCompletionOnExit = () => {
        const sessionStartKey = `chat_start_time_${sessionData.session_id}`;
        const sessionCompletedKey = `chat_completed_${sessionData.session_id}`;
        const startTime = sessionStorage.getItem(sessionStartKey);
        if (startTime) {
            const startMs = parseInt(startTime, 10);
            if (Date.now() - startMs >= 120000) {
                const alreadyCompleted = sessionStorage.getItem(sessionCompletedKey);
                if (!alreadyCompleted) {
                    sessionStorage.setItem(sessionCompletedKey, 'true');
                    onChatCompleted(partnerLocaleRef.current);
                }
            }
        }
    };

    const executeExit = (action: 'leave' | 'next') => {
        if (!partnerLeft || action === 'leave') {
            const socket = getSocket();
            socket.emit('leave_chat', { session_id: sessionData.session_id });
        }
        sessionStorage.removeItem(`chat_${sessionData.session_id}`);
        sessionStorage.removeItem(`reactions_${sessionData.session_id}`);
        if (action === 'leave') {
            onLeave();
        }
    };

    const triggerExit = (action: 'leave' | 'next') => {
        checkCompletionOnExit();

        const sessionStartKey = `chat_start_time_${sessionData.session_id}`;
        const startTime = sessionStorage.getItem(sessionStartKey);
        const startMs = startTime ? parseInt(startTime, 10) : Date.now();
        const durationSec = Math.floor((Date.now() - startMs) / 1000);

        // Notify partner we left
        if (!partnerLeft || action === 'leave') {
            const socket = getSocket();
            socket.emit('leave_chat', { session_id: sessionData.session_id });
        }

        // AI Partner 5-star simulation on exit
        const isAI = sessionData.partner.device_id === 'AI_PARTNER' || sessionData.partner.nickname === 'AI Partner';
        if (isAI) {
            const userSentMessages = messages.some(m => m.isMe);
            if (userSentMessages && Math.random() < 0.8) {
                onReceivedFiveStarRating();
            }
        }

        sessionStorage.removeItem(`chat_${sessionData.session_id}`);
        sessionStorage.removeItem(`reactions_${sessionData.session_id}`);
        sessionStorage.removeItem(sessionStartKey);
        sessionStorage.removeItem(`chat_completed_${sessionData.session_id}`);

        onChatEnded({
            duration: durationSec,
            commonInterest: sessionData.common_interest || null,
            messageCount: messages.length,
            sessionId: sessionData.session_id,
            partnerNickname: sessionData.partner.nickname || "Stranger",
            partnerDeviceId: sessionData.partner.device_id,
            action: action
        });
    };

    const handleReport = (reason: string) => {
        const socket = getSocket();
        socket.emit('report_user', {
            session_id: sessionData.session_id,
            reason: reason,
            reported_device_id: sessionData.partner.device_id
        });
        setShowReportModal(false);
        executeExit('leave');
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
                        <Button onClick={() => triggerExit('next')} variant="secondary" size="sm" className="font-bold border-2">NEXT ➔</Button>
                    )}
                    <Button onClick={() => triggerExit('leave')} variant="outline" size="sm" className="px-2 border-red-500 text-red-500 border-2">✕</Button>
                </div>
            </div>

            {/* Common Interest Banner */}
            {sessionData.common_interest && showInterestBadge && (
                <div className="bg-gray-50 border-b-[3px] border-black p-2 flex justify-center items-center z-10 animate-in slide-in-from-top-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black bg-gray-100 text-xs font-bold text-gray-700 shadow-[2px_2px_0px_0px_#000]">
                        <span>🤝 You both like {sessionData.common_interest}</span>
                        <button
                            type="button"
                            onClick={() => setShowInterestBadge(false)}
                            className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 font-bold text-[10px] cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Challenge Banner */}
            {initialIcebreaker && showChallengeBanner && (
                <div className="bg-yellow-100 border-b-[3px] border-black p-2.5 flex justify-between items-center z-10 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-black text-xs md:text-sm tracking-wider uppercase">
                            📅 CHALLENGE CHAT:
                        </span>
                        <span className="font-bold text-black text-xs md:text-sm">
                            {initialIcebreaker}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowChallengeBanner(false)}
                        className="ml-2 w-5 h-5 flex items-center justify-center rounded-full border-2 border-black bg-white hover:bg-gray-100 font-bold text-xs shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}


            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-4 bg-white relative">
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
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}
                    >
                        <div
                            onMouseEnter={() => handleMouseEnter(msg.id)}
                            onMouseLeave={handleMouseLeave}
                            onTouchStart={(e) => handleTouchStart(msg.id, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className={`max-w-[80%] p-4 border-[3px] border-black shadow-[4px_4px_0px_0px_#000] relative message-bubble ${msg.isMe
                                ? 'bg-accent text-black rounded-none mr-2'
                                : 'bg-white text-black rounded-none ml-2'
                            }`}
                        >
                            {/* Reaction picker */}
                            {activePickerMessageId === msg.id && (
                                <div
                                    onMouseEnter={() => handleMouseEnter(msg.id)}
                                    onMouseLeave={handleMouseLeave}
                                    className={`absolute bottom-full mb-2 flex items-center gap-0.5 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] p-1.5 z-30 reaction-picker animate-scale-up before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-4 before:content-[''] ${
                                        msg.isMe ? 'right-0' : 'left-0'
                                    }`}
                                >
                                    {EMOJIS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReact(msg.id, emoji);
                                            }}
                                            className="hover:bg-gray-100 p-1 text-xl transition-transform active:scale-125 cursor-pointer"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Quick Reaction Toggle Button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePickerMessageId(prev => prev === msg.id ? null : msg.id);
                                }}
                                className={`absolute -top-3 ${msg.isMe ? '-left-3' : '-right-3'} w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:scale-110 transition-all shadow-[1px_1px_0px_0px_#000] z-20 cursor-pointer`}
                                title="React to message"
                            >
                                😊
                            </button>

                            <p className="font-medium text-lg leading-tight">{msg.content}</p>
                            <p className="text-[10px] font-bold uppercase mt-2 opacity-50 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {/* Reactions displaying below message bubble */}
                        {reactions[msg.id] && Object.keys(reactions[msg.id]).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 mb-2 ${msg.isMe ? 'justify-end mr-2' : 'justify-start ml-2'}`}>
                                {Object.entries(reactions[msg.id]).map(([emoji, userIds]) => {
                                    const hasReacted = userIds.includes(myId);
                                    return (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReact(msg.id, emoji);
                                            }}
                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-black text-xs font-black transition-all cursor-pointer ${
                                                hasReacted
                                                    ? 'bg-primary text-black shadow-[1px_1px_0px_0px_#000] translate-y-[1px]'
                                                    : 'bg-white text-black shadow-[2px_2px_0px_0px_#000]'
                                            }`}
                                        >
                                            <span>{emoji} {userIds.length}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}



                {partnerLeft && (
                    <div className="flex justify-center p-8">
                        <Card className="text-center bg-gray-100 border-dashed">
                            <h3 className="text-2xl font-black uppercase mb-2">Partner Disconnected</h3>
                            <Button onClick={() => triggerExit('next')} variant="primary" size="lg" className="w-full">
                                Find Next Match
                            </Button>
                        </Card>
                    </div>
                )}

                <div ref={messagesEndRef} />

                {/* Typing Indicator */}
                <div className={`absolute bottom-1 left-4 flex items-center gap-1 text-xs font-black uppercase text-gray-500 tracking-wider transition-opacity duration-300 pointer-events-none ${partnerTyping ? 'opacity-100' : 'opacity-0'}`}>
                    <span>Stranger is typing</span>
                    <span className="flex items-center gap-0.5 ml-0.5">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-dot-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                    </span>
                </div>
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

            {/* Rating Modal Overlay removed - Handled in separate Summary Step */}
        </Card>
    );
}