'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/utils/socket';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PostChatSummaryProps {
    duration: number; // in seconds
    commonInterest?: string | null;
    messageCount: number;
    sessionId: string;
    partnerNickname: string;
    partnerDeviceId: string;
    onChatAgain: () => void;
    onGoHome: () => void;
}

const MOODS = ['Fun', 'Interesting', 'Weird', 'Deep', 'Boring'];

const ENCOURAGING_MESSAGES = [
    "Every chat is a new adventure. 🌟",
    "You never know who you'll meet next.",
    "Thanks for keeping Klymo real. ❤️"
];

export default function PostChatSummary({
    duration,
    commonInterest,
    messageCount,
    sessionId,
    partnerNickname,
    partnerDeviceId,
    onChatAgain,
    onGoHome
}: PostChatSummaryProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [encouragingMsg, setEncouragingMsg] = useState<string>('');

    useEffect(() => {
        // Pick a random encouraging message on mount
        const randomIdx = Math.floor(Math.random() * ENCOURAGING_MESSAGES.length);
        setEncouragingMsg(ENCOURAGING_MESSAGES[randomIdx]);
    }, []);

    const formatDuration = (sec: number) => {
        if (sec < 60) {
            return `${sec} secs`;
        }
        const mins = Math.floor(sec / 60);
        const remainingSecs = sec % 60;
        return `${mins} mins ${remainingSecs} secs`;
    };

    const toggleMood = (mood: string) => {
        setSelectedMoods(prev =>
            prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
        );
    };

    const handleSubmit = () => {
        if (rating === 0) return;

        // 1. Submit rating to backend socket if available
        const socket = getSocket();
        if (socket && socket.connected) {
            socket.emit('submit_rating', {
                session_id: sessionId,
                rating: rating
            });
        }

        // 2. Store rating in localStorage
        try {
            const ratingsKey = 'klymo_ratings_history';
            const rawHistory = localStorage.getItem(ratingsKey);
            const history = rawHistory ? JSON.parse(rawHistory) : [];
            history.push({
                sessionId,
                partnerDeviceId,
                partnerNickname,
                rating,
                moods: selectedMoods,
                duration,
                messageCount,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(ratingsKey, JSON.stringify(history));
        } catch (e) {
            console.error("Failed to store rating in localStorage", e);
        }

        setIsSubmitted(true);
    };

    return (
        <div className="w-full flex items-center justify-center p-4 min-h-[70vh]">
            <Card
                variant="white"
                className="max-w-md w-full bg-white border-[4px] border-black p-8 text-center shadow-[8px_8px_0px_0px_#000] rounded-2xl animate-fade-in-up"
            >
                <h2 className="text-3xl font-black uppercase tracking-tight mb-6 leading-none">
                    Chat Summary
                </h2>

                {/* Stats Container */}
                <div className="flex flex-col gap-3 mb-8 text-left">
                    <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-gray-50 shadow-[3px_3px_0px_0px_#000] font-bold uppercase text-sm">
                        <span className="text-xl">⏱️</span>
                        <span>You chatted for {formatDuration(duration)}</span>
                    </div>

                    {commonInterest && (
                        <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-accent/10 shadow-[3px_3px_0px_0px_#000] font-bold uppercase text-sm">
                            <span className="text-xl">🏷️</span>
                            <span>You both liked {commonInterest}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-3 border-[3px] border-black bg-gray-50 shadow-[3px_3px_0px_0px_#000] font-bold uppercase text-sm">
                        <span className="text-xl">💬</span>
                        <span>You exchanged {messageCount} messages</span>
                    </div>
                </div>

                {/* Rating & Mood Section */}
                <div className="border-[3px] border-black p-5 rounded-xl bg-yellow-50 shadow-[4px_4px_0px_0px_#000] mb-8 text-center">
                    {isSubmitted ? (
                        <div className="py-6 animate-scale-fade-in">
                            <div className="text-5xl mb-2 text-green-500">✓</div>
                            <h3 className="text-xl font-black uppercase text-black leading-none mb-1">
                                Thanks for rating!
                            </h3>
                            <p className="text-xs font-bold text-gray-600 uppercase">
                                Your feedback helps keep Klymo friendly and fun.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-black uppercase text-black mb-1">
                                Rate this chat
                            </h3>
                            <p className="text-[11px] font-bold text-gray-500 uppercase mb-4">
                                How was your conversation with {partnerNickname}?
                            </p>

                            {/* Stars */}
                            <div className="flex justify-center gap-2 mb-5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="text-4xl transition-transform active:scale-125 hover:scale-110 cursor-pointer focus:outline-none"
                                    >
                                        <span
                                            className={
                                                star <= (hoveredRating || rating)
                                                    ? 'text-yellow-400 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]'
                                                    : 'text-gray-300'
                                            }
                                        >
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Mood Tags */}
                            <div className="mb-6">
                                <h4 className="text-xs font-black uppercase text-gray-600 mb-2.5">
                                    How was it?
                                </h4>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {MOODS.map((mood) => {
                                        const isSelected = selectedMoods.includes(mood);
                                        return (
                                            <button
                                                key={mood}
                                                type="button"
                                                onClick={() => toggleMood(mood)}
                                                className={`px-3 py-1.5 border-[2px] border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all select-none ${
                                                    isSelected
                                                        ? 'bg-accent text-black translate-x-[1px] translate-y-[1px] shadow-[1px_1px_0px_0px_#000]'
                                                        : 'bg-white text-black hover:bg-gray-50'
                                                }`}
                                            >
                                                {mood}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Submit Rating Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={rating === 0}
                                className="w-full py-3 bg-primary disabled:bg-gray-200 disabled:opacity-50 disabled:shadow-none border-[3px] border-black text-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] cursor-pointer select-none transition-all text-sm"
                            >
                                Submit Feedback
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onChatAgain}
                        className="w-full py-3.5 bg-accent border-[3px] border-black text-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:bg-cyan-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] cursor-pointer select-none transition-all text-base"
                    >
                        Chat Again 🔄
                    </button>
                    <button
                        onClick={onGoHome}
                        className="w-full py-3 bg-white border-[3px] border-black hover:bg-gray-100 text-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000] cursor-pointer select-none transition-all text-sm"
                    >
                        Go Home 🏠
                    </button>
                </div>

                {/* Encouraging Quote */}
                {encouragingMsg && (
                    <p className="mt-8 text-xs font-black uppercase tracking-wider text-gray-400 italic">
                        {encouragingMsg}
                    </p>
                )}
            </Card>
        </div>
    );
}
