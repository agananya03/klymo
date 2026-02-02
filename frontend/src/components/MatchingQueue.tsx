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
        <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-700 w-full py-10">
            {/* Radar Animation */}
            <div className="relative">
                <div className="w-32 h-32 bg-indigo-600/20 rounded-full flex items-center justify-center backdrop-blur-md border border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.3)] z-10">
                    <span className="text-5xl animate-bounce">🔭</span>
                </div>

                {/* Ripples */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500 rounded-full animate-[ping_2s_linear_infinite] opacity-20 -z-10"></div>
                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full animate-[ping_2s_linear_infinite] opacity-20 animation-delay-500 -z-10"></div>

                {/* Orbital dots */}
                <div className="absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan] -translate-x-1/2 -translate-y-4"></div>
                </div>
                <div className="absolute inset-0 w-full h-full animate-[spin_6s_linear_infinite_reverse]">
                    <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-pink-400 rounded-full shadow-[0_0_10px_magenta] -translate-x-1/2 translate-y-4"></div>
                </div>
            </div>

            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-wide drop-shadow-lg">{status}</h2>
                <p className="text-indigo-200/60 font-light tracking-widest text-sm uppercase">Global Search Active</p>
            </div>

            {status === 'Select a preference' && (
                <div className="flex flex-wrap justify-center gap-6">
                    <button onClick={() => handleJoin('female')} className="group relative px-8 py-4 bg-gray-900 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 ring-1 ring-pink-500/50 hover:ring-pink-500">
                        <div className="absolute inset-0 bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors"></div>
                        <span className="relative font-bold text-pink-400 group-hover:text-pink-300">Female</span>
                    </button>

                    <button onClick={() => handleJoin('male')} className="group relative px-8 py-4 bg-gray-900 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 ring-1 ring-blue-500/50 hover:ring-blue-500">
                        <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors"></div>
                        <span className="relative font-bold text-blue-400 group-hover:text-blue-300">Male</span>
                    </button>

                    <button onClick={() => handleJoin('any')} className="group relative px-8 py-4 bg-gray-900 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 ring-1 ring-purple-500/50 hover:ring-purple-500">
                        <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors"></div>
                        <span className="relative font-bold text-purple-400 group-hover:text-purple-300">Anyone</span>
                    </button>
                </div>
            )}

            {/* Cancel Button */}
            {status.startsWith('Searching') && (
                <button
                    onClick={() => {
                        window.location.reload();
                    }}
                    className="mt-8 text-gray-400 hover:text-white font-medium text-xs uppercase tracking-widest border-b border-transparent hover:border-white transition-all pb-1"
                >
                    Cancel Search
                </button>
            )}

            <style jsx>{`
                .animation-delay-500 {
                    animation-delay: 0.5s;
                }
            `}</style>
        </div>
    );
}
