'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface MatchingQueueProps {
    onMatchFound: (sessionData: any) => void;
    onCancel: () => void;
    interests: string[];
    onStartAIChat?: () => void;
}

const QUEUE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function MatchingQueue({ onMatchFound, onCancel, interests, onStartAIChat }: MatchingQueueProps) {
    const [status, setStatus] = useState('Connecting...');
    const [preference, setPreference] = useState<'male' | 'female' | 'any'>('any');
    const [queueTime, setQueueTime] = useState(0);
    const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const queueStartRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleSwitchToAI = () => {
        const socket = getSocket();
        socket.emit('leave_queue', {});
        clearQueueTimer();
        if (onStartAIChat) {
            onStartAIChat();
        }
    };

    useEffect(() => {
        // Request Notification Permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const socket = getSocket();
        let isMounted = true;

        const handleConnect = () => {
            if (isMounted) setStatus('Select a preference');
        };

        const handleConnectError = (err: any) => {
            if (!isMounted) return;
            console.error('Socket connect_error:', err);
            
            // Extract the message from various possible locations in Socket.IO v4 error object
            let msg = '';
            if (typeof err === 'string') {
                msg = err;
            } else if (err) {
                msg = err.data || err.message || (typeof err.description === 'string' ? err.description : '') || '';
            }

            if (msg.includes('User not found') || msg.includes('Identity missing')) {
                localStorage.removeItem('klymo_is_verified');
                setStatus('Identity missing. Redirecting to verification...');
                setTimeout(() => {
                    if (isMounted) {
                        window.location.reload();
                    }
                }, 2000);
            } else {
                setStatus(`Connection error: ${msg || 'Connection rejected or offline'}`);
            }
        };

        const handleQueueStatus = (data: any) => {
            if (isMounted) {
                setStatus('Searching');
                startQueueTimer();
            }
        };

        const handleMatchFound = (data: any) => {
            if (!isMounted) return;
            console.log('Match found:', data);

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification("Klymo Chat", { body: "Match Found! Connecting you now..." });
            }

            setStatus('Match Found!');
            setTimeout(() => {
                if (isMounted) {
                    // Adapt Backend Data Structure to Frontend Component Expectations
                    const formattedSession = {
                        session_id: data.session_id,
                        partner: {
                            device_id: data.partner_id,
                            gender: data.partner_gender,
                            nickname: data.partner_nickname || 'Stranger'
                        }
                    };
                    onMatchFound(formattedSession);
                }
            }, 1500);
        };

        const handleError = (data: any) => {
            if (!isMounted) return;
            const msg = data?.message || '';
            if (msg.includes('User not found') || msg.includes('Identity missing')) {
                localStorage.removeItem('klymo_is_verified');
                setStatus('Identity missing. Redirecting to verification...');
                setTimeout(() => {
                    if (isMounted) {
                        window.location.reload();
                    }
                }, 2000);
            } else {
                setStatus(`Error: ${data.message}`);
                clearQueueTimer();
            }
        };

        // Attach listeners immediately
        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);
        socket.on('queue_status', handleQueueStatus);
        socket.on('match_found', handleMatchFound);
        socket.on('error', handleError);

        if (socket.connected) {
            setStatus('Select a preference');
        }

        // Fetch device ID and connect socket
        generateDeviceId().then((deviceId) => {
            if (!isMounted) return;
            if (!socket.connected) {
                socket.auth = { device_id: deviceId };
                socket.connect();
            } else {
                socket.auth = { device_id: deviceId };
            }
        }).catch((err) => {
            console.error('Error generating/retrieving device ID:', err);
            if (isMounted) {
                setStatus('Error initializing identity');
            }
        });

        return () => {
            isMounted = false;
            clearQueueTimer();
            socket.off('connect', handleConnect);
            socket.off('connect_error', handleConnectError);
            socket.off('queue_status', handleQueueStatus);
            socket.off('match_found', handleMatchFound);
            socket.off('error', handleError);
        };
    }, [onMatchFound]);

    const startQueueTimer = () => {
        queueStartRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            if (queueStartRef.current) {
                const elapsed = Date.now() - queueStartRef.current;
                setQueueTime(Math.floor(elapsed / 1000));
            }
        }, 1000);

        queueTimeoutRef.current = setTimeout(() => {
            setStatus('No matches found.');
            clearQueueTimer();
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
        setStatus(`Searching...`);
        const socket = getSocket();
        socket.emit('join_queue', { preference: pref, interests: interests });
    };

    const handleCancel = () => {
        const socket = getSocket();
        socket.emit('leave_queue', {});
        clearQueueTimer();
        onCancel();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="flex flex-col items-center text-center p-8 space-y-6 w-full max-w-md mx-auto relative overflow-hidden bg-white">

            {/* Geometric Decorative Elements */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary border-l-4 border-b-4 border-black" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-secondary border-t-4 border-r-4 border-black" />

            {status === 'Select a preference' && (
                <>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Who do you want to meet?</h2>
                    <div className="flex flex-col w-full gap-4 relative z-10">
                        <Button onClick={() => handleJoin('female')} variant="primary" size="lg" className="w-full">
                            Female
                        </Button>
                        <Button onClick={() => handleJoin('male')} variant="secondary" size="lg" className="w-full">
                            Male
                        </Button>
                        <Button onClick={() => handleJoin('any')} variant="accent" size="lg" className="w-full">
                            Anyone
                        </Button>
                        <Button onClick={onCancel} variant="outline" className="w-full border-black text-black hover:bg-gray-50 mt-2">
                            CANCEL
                        </Button>
                    </div>
                </>
            )}

            {(status.startsWith('Searching') || status === 'Connecting...') && (
                <>
                    <div className="w-32 h-32 bg-black flex items-center justify-center animate-spin-slow border-4 border-black shadow-[4px_4px_0px_0px_#8B3DFF]">
                        <div className="w-16 h-16 bg-primary border-4 border-black" />
                    </div>

                    <div className="space-y-4 z-10 w-full flex flex-col items-center">
                        <h2 className="text-4xl font-black uppercase bg-primary px-4 py-1 border-[3px] border-black inline-block">
                            {formatTime(queueTime)}
                        </h2>
                        <p className="text-xl font-bold uppercase">Finding Match...</p>

                        {onStartAIChat && (
                            <Button onClick={handleSwitchToAI} variant="accent" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                                CHAT WITH AI INSTEAD 🤖
                            </Button>
                        )}

                        <Button onClick={handleCancel} variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-50">
                            CANCEL
                        </Button>
                    </div>
                </>
            )}

            {status === 'Match Found!' && (
                <div className="animate-bounce">
                    <h2 className="text-5xl font-black uppercase text-secondary bg-black px-6 py-4 border-[4px] border-secondary transform rotate-2">
                        MATCHED!
                    </h2>
                </div>
            )}

            {status.includes('No matches') && (
                <>
                    <h2 className="text-3xl font-black uppercase bg-red-500 text-white px-4 border-[3px] border-black">
                        No Luck
                    </h2>
                    <p className="font-bold">No other users online right now.</p>
                    <div className="flex flex-col w-full gap-3 relative z-10">
                        {onStartAIChat && (
                            <Button onClick={handleSwitchToAI} variant="accent" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                                CHAT WITH AI INSTEAD 🤖
                            </Button>
                        )}
                        <Button onClick={() => setStatus('Select a preference')} variant="primary" className="w-full">
                            TRY AGAIN
                        </Button>
                        <Button onClick={onCancel} variant="outline" className="w-full border-black text-black hover:bg-gray-50">
                            BACK TO DASHBOARD
                        </Button>
                    </div>
                </>
            )}
            {status.includes('wait') ? (
                <>
                    <h2 className="text-3xl font-black uppercase bg-yellow-400 text-black px-4 border-[3px] border-black">
                        Take a Break
                    </h2>
                    <p className="font-bold">{status.replace('Error: ', '')}</p>
                    <div className="flex flex-col w-full gap-3 relative z-10">
                        <Button onClick={() => window.location.reload()} variant="primary" className="w-full">
                            CHECK AGAIN
                        </Button>
                        <Button onClick={onCancel} variant="outline" className="w-full border-black text-black hover:bg-gray-50">
                            BACK TO DASHBOARD
                        </Button>
                    </div>
                </>
            ) : (status.startsWith('Error') || status.startsWith('Connection error')) ? (
                <>
                    <h2 className="text-3xl font-black uppercase bg-red-500 text-white px-4 border-[3px] border-black">
                        Connection Failed
                    </h2>
                    <p className="font-bold">{status}</p>
                    <div className="flex flex-col w-full gap-3 relative z-10">
                        <Button onClick={() => window.location.reload()} variant="primary" className="w-full">
                            RETRY
                        </Button>
                        <Button onClick={onCancel} variant="outline" className="w-full border-black text-black hover:bg-gray-50">
                            BACK TO DASHBOARD
                        </Button>
                    </div>
                </>
            ) : null}
        </Card>
    );
}