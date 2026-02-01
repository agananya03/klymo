'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';

interface MatchingQueueProps {
    onMatchFound: (sessionData: any) => void;
}

const QUEUE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function MatchingQueue({ onMatchFound }: MatchingQueueProps) {
    const [status, setStatus] = useState('Connecting...');
    const [preference, setPreference] = useState<'male' | 'female' | 'any'>('any');
    const [queueTime, setQueueTime] = useState(0);
    const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const queueStartRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const connectAndJoin = async () => {
            const deviceId = await generateDeviceId();
            const socket = getSocket();

            if (!socket.connected) {
                socket.auth = { device_id: deviceId };
                socket.connect();
            }

            socket.on('connect', () => {
                console.log('✅ Socket connected');
                setStatus('Select a preference');
            });

            socket.on('connect_error', (err) => {
                console.error('❌ Connection error:', err);
                setStatus(`Connection error: ${err.message}`);
            });

            socket.on('queue_status', (data) => {
                console.log('📋 Queue status:', data);
                setStatus('Searching for a partner...');
                startQueueTimer();
            });

            socket.on('match_found', (data) => {
                console.log('🎉 Match found!', data);
                setStatus('Match Found!');
                clearQueueTimer();

                socket.emit('join_session', { session_id: data.session_id });

                setTimeout(() => {
                    onMatchFound(data);
                }, 1000);
            });

            socket.on('error', (data) => {
                console.error('❌ Error:', data);
                setStatus(`Error: ${data.message}`);
                clearQueueTimer();
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

        return () => {
            clearQueueTimer();
        };
    }, [onMatchFound]);

    const startQueueTimer = () => {
        queueStartRef.current = Date.now();

        // Update queue time every second
        intervalRef.current = setInterval(() => {
            if (queueStartRef.current) {
                const elapsed = Date.now() - queueStartRef.current;
                setQueueTime(Math.floor(elapsed / 1000));
            }
        }, 1000);

        // Set timeout for max queue time
        queueTimeoutRef.current = setTimeout(() => {
            console.log('⏱️ Queue timeout reached');
            setStatus('No matches found. Try again?');
            clearQueueTimer();

            // Leave queue
            const socket = getSocket();
            socket.emit('leave_queue', {});
        }, QUEUE_TIMEOUT_MS);
    };

    const clearQueueTimer = () => {
        if (queueTimeoutRef.current) {
            clearTimeout(queueTimeoutRef.current);
            queueTimeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        queueStartRef.current = null;
        setQueueTime(0);
    };

    const handleJoin = (pref: 'male' | 'female' | 'any') => {
        setPreference(pref);
        setStatus(`Searching for ${pref === 'any' ? 'anyone' : pref}...`);
        const socket = getSocket();
        console.log('🔍 Joining queue with preference:', pref);
        socket.emit('join_queue', { preference: pref });
    };

    const handleCancel = () => {
        const socket = getSocket();
        socket.emit('leave_queue', {});
        clearQueueTimer();
        setStatus('Select a preference');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-4xl">🔍</span>
                </div>
                <span className="absolute top-0 left-0 w-24 h-24 bg-blue-500 rounded-full animate-ping opacity-25"></span>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{status}</h2>
                <p className="text-gray-500 dark:text-gray-400">Finding someone compatible with you...</p>

                {queueTime > 0 && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-400">
                            Searching for {formatTime(queueTime)}
                        </p>
                        <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-2">
                            <div
                                className="h-1 bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${(queueTime / 300) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {status === 'Select a preference' && (
                <div className="flex flex-wrap gap-4 justify-center">
                    <button
                        onClick={() => handleJoin('female')}
                        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-semibold transition shadow-lg transform hover:scale-105"
                    >
                        🙋‍♀️ Female
                    </button>
                    <button
                        onClick={() => handleJoin('male')}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition shadow-lg transform hover:scale-105"
                    >
                        🙋‍♂️ Male
                    </button>
                    <button
                        onClick={() => handleJoin('any')}
                        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-semibold transition shadow-lg transform hover:scale-105"
                    >
                        🌍 Anyone
                    </button>
                </div>
            )}

            {status.startsWith('Searching') && (
                <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="text-red-500 hover:text-red-700 font-medium text-sm hover:underline"
                    >
                        Cancel Search
                    </button>
                </div>
            )}

            {status.includes('No matches found') && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        We couldn't find a match. Try a different preference or try again later.
                    </p>
                    <button
                        onClick={() => setStatus('Select a preference')}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition shadow-lg"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}