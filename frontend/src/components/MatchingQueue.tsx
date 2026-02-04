'use client';

import { useState, useEffect, useRef } from 'react';
import { getSocket } from '@/utils/socket';
import { generateDeviceId } from '@/utils/device-id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
        // Request Notification Permission on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const connectAndJoin = async () => {
            const deviceId = await generateDeviceId();
            const socket = getSocket();

            if (socket.connected) {
                setStatus('Select a preference');
            } else {
                socket.auth = { device_id: deviceId };
                socket.connect();
            }

            socket.on('connect', () => {
                setStatus('Select a preference');
            });

            socket.on('connect_error', (err) => {
                setStatus(`Connection error: ${err.message}`);
            });

            socket.on('queue_status', (data) => {
                setStatus('Searching');
                startQueueTimer();
            });

            socket.on('match_found', (data: any) => {
                console.log('Match found:', data);

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification("Klymo Chat", { body: "Match Found! Connecting you now..." });
                }

                setStatus('matched');
                setTimeout(() => {
                    // Adapt Backend Data Structure to Frontend Component Expectations
                    const formattedSession = {
                        session_id: data.session_id,
                        partner: {
                            device_id: data.partner_id,
                            gender: data.partner_gender,
                            nickname: 'Stranger' // Default nickname since backend doesn't store it yet
                        }
                    };
                    onMatchFound(formattedSession);
                }, 1500);
            });

            socket.on('error', (data) => {
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
                    </div>
                </>
            )}

            {(status.startsWith('Searching') || status === 'Connecting...') && (
                <>
                    <div className="w-32 h-32 bg-black flex items-center justify-center animate-spin-slow border-4 border-black shadow-[4px_4px_0px_0px_#8B3DFF]">
                        <div className="w-16 h-16 bg-primary border-4 border-black" />
                    </div>

                    <div className="space-y-4 z-10">
                        <h2 className="text-4xl font-black uppercase bg-primary px-4 py-1 border-[3px] border-black inline-block">
                            {formatTime(queueTime)}
                        </h2>
                        <p className="text-xl font-bold uppercase">Finding Match...</p>

                        <Button onClick={handleCancel} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
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
                    <p className="font-bold">Try again later.</p>
                    <Button onClick={() => setStatus('Select a preference')} variant="primary">
                        TRY AGAIN
                    </Button>
                </>
            )}
            {status.includes('wait') ? (
                <>
                    <h2 className="text-3xl font-black uppercase bg-yellow-400 text-black px-4 border-[3px] border-black">
                        Take a Break
                    </h2>
                    <p className="font-bold">{status.replace('Error: ', '')}</p>
                    <Button onClick={() => window.location.reload()} variant="primary">
                        CHECK AGAIN
                    </Button>
                </>
            ) : (status.startsWith('Error') || status.startsWith('Connection error')) ? (
                <>
                    <h2 className="text-3xl font-black uppercase bg-red-500 text-white px-4 border-[3px] border-black">
                        Connection Failed
                    </h2>
                    <p className="font-bold">{status}</p>
                    <Button onClick={() => window.location.reload()} variant="primary">
                        RETRY
                    </Button>
                </>
            ) : null}
        </Card>
    );
}