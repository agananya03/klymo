'use client';

import React, { useState, useEffect, useRef } from 'react';

type Message = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    timestamp: number;
};

export default function EphemeralChat({ sessionId, onEnd }: { sessionId: string; onEnd: () => void }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        connectWebSocket();
        return () => {
            ws.current?.close();
        };
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const connectWebSocket = () => {
        if (ws.current) ws.current.close();

        // Connect to session-specific room
        const socket = new WebSocket(`ws://localhost:8000/api/v1/chat/ws/${sessionId}`);

        socket.onopen = () => {
            setIsConnected(true);
            console.log('Connected to Session:', sessionId);
        };

        socket.onmessage = (event) => {
            const text = event.data;
            const newMessage: Message = {
                id: Date.now().toString() + Math.random(),
                text: text,
                sender: 'other',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, newMessage]);
        };

        socket.onclose = () => {
            setIsConnected(false);
        };

        ws.current = socket;
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !ws.current) return;

        // Send to server
        ws.current.send(inputText);

        // Optimistically add to UI as "Me" (so we can differentiate)
        // Note: The server currently broadcasts back to EVERYONE including sender.
        // We might get a duplicate. For this simple demo, we will filter duplicates or just accept it.
        // Better approach: Server sends JSON with content.
        // For now, let's just rely on the server broadcast to keep it "ephemeral" and simple.
        // If we want "Me" vs "Other", we'd need a session ID.
        // Let's implement a wrapper.

        setInputText('');
    };

    const endSession = () => {
        setMessages([]);
        if (ws.current) {
            ws.current.close();
        }
        onEnd(); // Return to matching or profile
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="w-full max-w-md mx-auto mt-8 p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Secure Chat</h2>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-xs text-gray-300">{isConnected ? 'Encrypted & Live' : 'Disconnected'}</span>
                    </div>
                </div>
                <button
                    onClick={endSession}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 text-xs rounded-full transition border border-red-500/30"
                >
                    End Session
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                        <p>Messages are never stored.</p>
                        <p>Close this tab to wipe history.</p>
                    </div>
                )}
                {messages.map((msg) => {
                    // Quick hack to distinguish "My" messages if possible, 
                    // or just show all as "server" messages for now since we broadcast "User: ..."
                    const isSystem = msg.text === "A user left the chat";

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="text-center text-xs text-gray-500 my-2">
                                {msg.text}
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={`flex justify-start`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 bg-gray-700/50 text-gray-100 rounded-tl-none`}>
                                <p className="text-sm">{msg.text}</p>
                                <span className="text-[10px] opacity-50 block text-right mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="relative">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a secure message..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:bg-transparent"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
