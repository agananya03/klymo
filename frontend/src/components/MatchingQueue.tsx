'use client';

import { useState, useEffect } from 'react';
import { getSocket, disconnectSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';

interface MatchingQueueProps {
    onMatchFound: (sessionData: any) => void;
}

export default function MatchingQueue({ onMatchFound }: MatchingQueueProps) {
    const [status, setStatus] = useState('Connecting...');
    const [preference, setPreference] = useState<'male' | 'female' | 'any'>('any'); // Default or user choice?
    // Ideally user chooses preference BEFORE this screen or ON this screen.
    // Let's add a simple selector if not passed in.

    useEffect(() => {
        const connectAndJoin = async () => {
            const deviceId = await generateDeviceId();
            const socket = getSocket();

            if (!socket.connected) {
                socket.auth = { device_id: deviceId };
                socket.connect();
            }

            socket.on('connect', () => {
                setStatus('Connected. Joining queue...');
                // Auto-join with default preference for now, or wait for user click?
                // Let's make it auto-join for smoother UX if preference is fixed, 
                // but better to let user pick "Who do you want to chat with?"
                setStatus('Select a preference');
            });

            socket.on('connect_error', (err) => {
                setStatus(`Connection error: ${err.message}`);
            });

            socket.on('queue_status', (data) => {
                setStatus('Searching for a partner...');
            });

            socket.on('match_found', (data) => {
                setStatus('Match Found!');
                setTimeout(() => {
                    onMatchFound(data);
                }, 1000);
            });

            socket.on('error', (data) => {
                setStatus(`Error: ${data.message}`);
            });

            return () => {
                socket.off('connect');
                socket.off('connect_error');
                socket.off('queue_status');
                socket.off('match_found');
                socket.off('error');
            };
        };

        connectAndJoin();

        // Cleanup on unmount handled by parent or leave logic? 
        // If we unmount matching queue without match, we should probably disconnect or leave queue.
        return () => {
            // Optional: disconnectSocket(); 
            // Better to keep socket open but emit 'leave_queue' if supported?
            // For now, disconnect is safe to avoid ghosting.
            // But we reuse socket for chat... so don't disconnect if matching found!
            // Handled by logic flow.
        };
    }, [onMatchFound]);

    const handleJoin = (pref: 'male' | 'female' | 'any') => {
        setPreference(pref);
        setStatus(`Searching for ${pref}...`);
        const socket = getSocket();
        socket.emit('join_queue', { preference: pref });
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-4xl">🔍</span>
                </div>
                {/* Ripple effect */}
                <span className="absolute top-0 left-0 w-24 h-24 bg-blue-500 rounded-full animate-ping opacity-25"></span>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{status}</h2>
                <p className="text-gray-500 dark:text-gray-400">Finding someone compatible with you...</p>
            </div>

            {status === 'Select a preference' && (
                <div className="flex gap-4">
                    <button onClick={() => handleJoin('female')} className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-semibold transition shadow-lg">
                        Female
                    </button>
                    <button onClick={() => handleJoin('male')} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition shadow-lg">
                        Male
                    </button>
                    <button onClick={() => handleJoin('any')} className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-full font-semibold transition shadow-lg">
                        Anyone
                    </button>
                </div>
            )}

            {/* Cancel Button */}
            {status.startsWith('Searching') && (
                <button
                    onClick={() => {
                        window.location.reload(); // Simplest cancel for MVP
                    }}
                    className="text-red-500 hover:text-red-700 font-medium text-sm"
                >
                    Cancel
                </button>
            )}
        </div>
    );
}
