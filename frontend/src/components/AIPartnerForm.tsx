'use client';

import { useState, useEffect } from 'react';
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

    useEffect(() => {
        const connectSocket = async () => {
            const socket = getSocket();

            // Ensure we have an ID
            const deviceId = await generateDeviceId();
            console.log(`Device ID: ${deviceId}`);

            if (!socket.connected) {
                console.log("Socket connecting...");
                socket.auth = { device_id: deviceId };
                socket.connect();
            } else {
                console.log("Socket already connected");
                // Force re-auth update for future
                socket.auth = { device_id: deviceId };
            }

            socket.on('connect', () => {
                console.log("Socket 'connect' event received!");
                setIsConnected(true);
            });

            if (socket.connected) {
                console.log("Socket check: Connected = true");
                setIsConnected(true);
            }

            socket.on('error', (err: any) => {
                console.error(`Socket Error: ${err.message || JSON.stringify(err)}`);
                alert(`Connection Error: ${err.message || 'Unknown error'}`);
                setIsLoading(false);
            });
        };
        connectSocket();

        return () => {
            const socket = getSocket();
            socket.off('connect');
            socket.off('error');
            socket.off('match_found'); // Clean up
        };
    }, []);

    const handleStartChat = () => {
        if (!interests.trim()) return;
        setIsLoading(true);
        console.log("Starting chat...");
        const socket = getSocket();

        // Remove previous listeners to avoid duplicates if clicked multiple times (though button disabled)
        socket.off('match_found');

        socket.on('match_found', (data: any) => {
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
        });

        console.log(`Emitting 'join_ai_queue' with interests: ${interests}`);
        socket.emit('join_ai_queue', { interests });

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
                        The AI will roleplay based on these topics.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handleStartChat}
                        variant="primary"
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-black"
                        disabled={!interests.trim() || isLoading || !isConnected}
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
