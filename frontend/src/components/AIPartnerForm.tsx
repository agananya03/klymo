'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';

interface AIPartnerFormProps {
    onBack: () => void;
    onMatchFound: (sessionData: any) => void;
}

export default function AIPartnerForm({ onBack, onMatchFound }: AIPartnerFormProps) {
    const [interests, setInterests] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const matchFoundListenerRef = useRef<any>(null);

    useEffect(() => {
        const socket = getSocket();
        let isMounted = true;

        const handleConnect = () => {
            if (isMounted) {
                console.log("Socket 'connect' event received!");
                setIsConnected(true);
            }
        };

        const handleError = (err: any) => {
            if (!isMounted) return;
            console.error('Socket error event:', err);
            let msg = '';
            if (typeof err === 'string') {
                msg = err;
            } else if (err) {
                msg = err.message || err.data || '';
            }
            if (msg.includes('User not found') || msg.includes('Identity missing') || msg.includes('gender not found')) {
                localStorage.removeItem('klymo_is_verified');
                alert('Identity missing or invalid. Redirecting to verification...');
                window.location.reload();
            } else {
                alert(`Error: ${msg || 'An error occurred'}`);
            }
            setIsLoading(false);
        };

        const handleConnectError = (err: any) => {
            if (!isMounted) return;
            console.error('Socket connect_error event:', err);
            let msg = '';
            if (typeof err === 'string') {
                msg = err;
            } else if (err) {
                msg = err.data || err.message || (typeof err.description === 'string' ? err.description : '') || '';
            }
            if (msg.includes('User not found') || msg.includes('Identity missing')) {
                localStorage.removeItem('klymo_is_verified');
                alert('Identity missing. Redirecting to verification...');
                window.location.reload();
            } else {
                alert(`Connection Error: ${msg || 'Connection rejected or offline'}`);
            }
            setIsLoading(false);
        };

        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);
        socket.on('error', handleError);

        if (socket.connected) {
            console.log("Socket check: Connected = true");
            setIsConnected(true);
        }

        generateDeviceId().then((deviceId) => {
            if (!isMounted) return;
            console.log(`Device ID: ${deviceId}`);
            if (!socket.connected) {
                console.log("Socket connecting...");
                socket.auth = { device_id: deviceId };
                socket.connect();
            } else {
                console.log("Socket already connected");
                socket.auth = { device_id: deviceId };
            }
        }).catch((err) => {
            console.error('Error generating device ID:', err);
        });

        return () => {
            isMounted = false;
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
            socket.off('error', handleError);
            if (matchFoundListenerRef.current) {
                socket.off('match_found', matchFoundListenerRef.current);
            }
        };
    }, []);

    const handleStartChat = () => {
        setIsLoading(true);
        const activeInterests = interests.trim() || 'General Chat';
        console.log("Starting chat with interests:", activeInterests);
        const socket = getSocket();

        // Remove previous listener specifically
        if (matchFoundListenerRef.current) {
            socket.off('match_found', matchFoundListenerRef.current);
        }

        const handleMatchFound = (data: any) => {
            console.log(`'match_found' received! Session: ${data.session_id}`);

            // Adapt Backend Data Structure
            const formattedSession = {
                session_id: data.session_id,
                partner: {
                    device_id: data.partner_id,
                    gender: data.partner_gender,
                    nickname: 'AI Partner'
                }
            };

            if (onMatchFound) {
                console.log("Calling onMatchFound parent callback");
                onMatchFound(formattedSession);
            } else {
                console.error("ERROR: onMatchFound callback missing!");
            }
        };

        matchFoundListenerRef.current = handleMatchFound;
        socket.on('match_found', handleMatchFound);

        console.log(`Emitting 'join_ai_queue' with interests: ${activeInterests}`);
        socket.emit('join_ai_queue', { interests: activeInterests });

        // Dashboard will handle the 'match_found' event and switch to ChatInterface
    };

    return (
        <Card className="w-full max-w-md mx-auto p-8 animate-in zoom-in-50 duration-300">
            <h2 className="text-3xl font-black uppercase mb-6 text-center leading-none">
                BUILD YOUR <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">AI PARTNER</span>
            </h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold uppercase mb-2">What are you into?</label>
                    <textarea
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="Anime, Tech, Philosophy, Cats..."
                        className="w-full p-4 border-[3px] border-black font-bold focus:outline-none focus:shadow-hard min-h-[120px] resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2 font-bold uppercase">
                        The AI will roleplay based on these topics (or general chat if empty).
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handleStartChat}
                        variant="primary"
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-black"
                        disabled={isLoading || !isConnected}
                    >
                        {isLoading ? 'CONNECTING...' : (!isConnected ? 'WAITING FOR CONNECTION...' : 'START AI CHAT')}
                    </Button>

                    <Button
                        onClick={onBack}
                        variant="outline"
                        className="w-full"
                        disabled={isLoading}
                    >
                        BACK TO DASHBOARD
                    </Button>
                </div>

                {/* Debug Log Removed */}
            </div>
        </Card>
    );
}
