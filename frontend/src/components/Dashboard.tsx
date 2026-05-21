import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INTERESTS } from '@/utils/interests';
import DeviceIdDisplay from '@/components/DeviceIdDisplay';
import { getDailyChallenge, getDailyGradient, getCountdownToNextDayUTC } from '@/utils/daily-challenges';

interface DashboardProps {
    onStartChat: (interests: string[], icebreaker?: string | null) => void;
    onEditProfile: () => void;
    onAI: () => void;
}

export default function Dashboard({ onStartChat, onEditProfile, onAI }: DashboardProps) {
    const [userCount, setUserCount] = useState<number | null>(null);
    const [activeFeature, setActiveFeature] = useState<'poll' | 'mood' | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [hasMood, setHasMood] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [shake, setShake] = useState(false);

    // Daily Challenge States
    const [challenge, setChallenge] = useState(() => getDailyChallenge());
    const [gradient, setGradient] = useState(() => getDailyGradient());
    const [countdown, setCountdown] = useState(() => getCountdownToNextDayUTC());
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        setUserCount(Math.floor(Math.random() * 500) + 120);
        // Check local storage for today's activity
        const today = new Date().toDateString();
        if (localStorage.getItem(`klymo_poll_${today}`)) setHasVoted(true);
        if (localStorage.getItem(`klymo_mood_${today}`)) setHasMood(true);

        // Check local storage for dismissed challenge
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const dismissedDate = localStorage.getItem('klymo_dismissed_challenge');
        if (dismissedDate === todayStr) {
            setIsDismissed(true);
        }

        // Live countdown interval
        const timer = setInterval(() => {
            const currentChallenge = getDailyChallenge();
            const currentGradient = getDailyGradient();
            
            // Check if the challenge changed (day transition)
            setChallenge((prev) => {
                if (prev.id !== currentChallenge.id) {
                    // Reset dismiss/minimize state if day changed
                    const newTodayStr = new Date().toISOString().split('T')[0];
                    const newDismissedDate = localStorage.getItem('klymo_dismissed_challenge');
                    if (newDismissedDate !== newTodayStr) {
                        setIsDismissed(false);
                    }
                    setIsMinimized(false);
                    setGradient(currentGradient);
                    return currentChallenge;
                }
                return prev;
            });

            setCountdown(getCountdownToNextDayUTC());
        }, 1000);

        // Load persisted interests
        const savedInterests = localStorage.getItem('klymo_selected_interests');
        if (savedInterests) {
            try {
                setSelectedInterests(JSON.parse(savedInterests));
            } catch (e) {
                console.error("Failed to parse saved interests", e);
            }
        }

        return () => {
            clearInterval(timer);
        };
    }, []);

    const toggleInterest = (tagLabel: string) => {
        if (selectedInterests.includes(tagLabel)) {
            const updated = selectedInterests.filter(t => t !== tagLabel);
            setSelectedInterests(updated);
            localStorage.setItem('klymo_selected_interests', JSON.stringify(updated));
        } else {
            if (selectedInterests.length >= 5) {
                // Trigger shake animation
                setShake(true);
                setTimeout(() => setShake(false), 500);
                return;
            }
            const updated = [...selectedInterests, tagLabel];
            setSelectedInterests(updated);
            localStorage.setItem('klymo_selected_interests', JSON.stringify(updated));
        }
    };

    const handleVote = (option: string) => {
        const today = new Date().toDateString();
        localStorage.setItem(`klymo_poll_${today}`, option);
        setHasVoted(true);
        setTimeout(() => setActiveFeature(null), 1500); // Close after delay
    };

    const handleMood = (mood: string) => {
        const today = new Date().toDateString();
        localStorage.setItem(`klymo_mood_${today}`, mood);
        setHasMood(true);
        setTimeout(() => setActiveFeature(null), 1500);
    };

    return (
        <>
            <Card className="w-full max-w-full p-0 overflow-hidden relative">
                {/* Hero Section */}
                <div className="p-8 pb-12 bg-secondary text-center relative border-b-[3px] border-black">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20"
                        style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
                    </div>

                    <div className="relative z-10 transform rotate-1">
                        <span className="inline-block bg-white border-[3px] border-black px-4 py-1 text-sm font-black uppercase mb-4 shadow-[4px_4px_0px_0px_#000]">
                            Anonymous Chat v2.0
                        </span>
                        <h2 className="text-4xl font-black text-white uppercase leading-none drop-shadow-[4px_4px_0px_#000] stroke-black">
                            Welcome to Klymo
                        </h2>
                        <p className="text-white font-bold text-lg mt-2 bg-black inline-block px-2">
                            NO LOGINS. NO TRACE. JUST VIBES.
                        </p>
                    </div>
                </div>

                {/* Action Center */}
                <div className="px-6 -mt-8 relative z-20">
                    {!isDismissed && (
                        isMinimized ? (
                            <div className={`p-3 border-[3px] border-black bg-gradient-to-r ${gradient} shadow-[4px_4px_0px_0px_#000] flex justify-between items-center text-black font-black uppercase text-xs md:text-sm animate-in slide-in-from-top-1 mb-4`}>
                                <div className="flex items-center gap-2 overflow-hidden mr-2 text-left">
                                    <span className="flex-shrink-0">📅</span>
                                    <span className="truncate">Challenge: {challenge.emoji} {challenge.topic}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsMinimized(false)}
                                        className="px-2 py-1 border-2 border-black bg-white hover:bg-gray-100 font-bold uppercase text-[10px] shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                                    >
                                        Expand ⤢
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const todayStr = new Date().toISOString().split('T')[0];
                                            localStorage.setItem('klymo_dismissed_challenge', todayStr);
                                            setIsDismissed(true);
                                        }}
                                        className="px-2 py-1 border-2 border-black bg-white hover:bg-gray-100 font-bold text-[10px] shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-6 border-[3px] border-black bg-gradient-to-r ${gradient} shadow-[4px_4px_0px_0px_#000] text-black text-left relative animate-in zoom-in-95 duration-200 mb-4`}>
                                {/* Header controls inside the card */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-black text-white px-2.5 py-1 text-[10px] md:text-xs font-black uppercase tracking-wider -skew-x-12 inline-block">
                                        📅 Today's Challenge
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsMinimized(true)}
                                            className="w-6 h-6 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 font-bold text-xs shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                                            title="Minimize"
                                        >
                                            —
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const todayStr = new Date().toISOString().split('T')[0];
                                                localStorage.setItem('klymo_dismissed_challenge', todayStr);
                                                setIsDismissed(true);
                                            }}
                                            className="w-6 h-6 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 font-bold text-xs shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                                            title="Dismiss"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 my-4">
                                    <span className="text-4xl md:text-5xl select-none" role="img" aria-label="challenge-emoji">
                                        {challenge.emoji}
                                    </span>
                                    <div>
                                        <h3 className="font-black text-lg md:text-xl uppercase leading-tight tracking-tight text-black">
                                            {challenge.topic}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t-2 border-black/20">
                                    <div className="text-xs uppercase font-bold text-black/80 flex items-center gap-1.5">
                                        <span className="animate-pulse">⏳</span>
                                        <span>Next challenge in <code className="font-black font-mono tracking-wider">{countdown}</code></span>
                                    </div>
                                    
                                    <Button
                                        onClick={() => onStartChat(selectedInterests, challenge.topic)}
                                        variant="accent"
                                        size="sm"
                                        className="bg-black text-white hover:bg-white hover:text-black border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:shadow-none translate-y-0 active:translate-y-[2px] transition-all py-2.5 px-4"
                                    >
                                        Start Challenge Chat 🚀
                                    </Button>
                                </div>
                            </div>
                        )
                    )}

                    <Card variant="white" className="text-center p-8">
                        <p className="font-bold uppercase mb-4 text-xl">
                            Ready to meet a stranger?
                        </p>

                        {/* Interest Picker Section */}
                        <div className={`mb-6 p-4 border-[3px] border-black bg-gray-50 text-left relative transition-all ${shake ? 'animate-shake' : ''}`}>
                            <h4 className="font-black text-sm uppercase mb-3 flex items-center justify-between">
                                <span>🎯 Select Interests (1-5 tags)</span>
                                <span className="text-xs font-bold text-gray-500">{selectedInterests.length}/5 selected</span>
                            </h4>
                            
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                                {INTERESTS.map((interest) => {
                                    const isSelected = selectedInterests.includes(interest.label);
                                    return (
                                        <button
                                            key={interest.label}
                                            type="button"
                                            onClick={() => toggleInterest(interest.label)}
                                            className={`px-3 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all transform hover:scale-105 active:scale-95 duration-100 ${
                                                isSelected 
                                                    ? 'bg-accent text-black shadow-[2px_2px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {interest.emoji} {interest.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            onClick={() => onStartChat(selectedInterests)}
                            variant="accent"
                            size="lg"
                            className="w-full text-xl py-6 animate-pulse hover:animate-none"
                        >
                            START MATCHING 🚀
                        </Button>

                        {/* Skip Link */}
                        <div className="mt-3 text-center">
                            <button
                                type="button"
                                onClick={() => onStartChat([])}
                                className="text-xs font-black uppercase text-gray-500 hover:text-black underline cursor-pointer"
                            >
                                Skip or Start without interests
                            </button>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2">
                            <span className="w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                            <p className="text-xs font-bold uppercase">
                                {userCount} users online
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Fun Activities Grid */}
                <div className="p-6">
                    <h3 className="font-black text-lg uppercase mb-4 border-b-[3px] border-black inline-block">
                        Daily Activities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setActiveFeature('poll')}
                            disabled={hasVoted}
                            className={`group relative w-full ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                            <div className="relative p-4 bg-yellow-200 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 transition-transform bg-[url('/noise.png')] h-full flex flex-col justify-center items-center">
                                <div className="text-4xl mb-2 grayscale group-hover:grayscale-0 transition-all">
                                    {hasVoted ? '✅' : '🗳️'}
                                </div>
                                <h4 className="font-black uppercase text-xl">Daily Poll</h4>
                                <p className="text-sm font-bold mt-1">{hasVoted ? 'VOTED' : 'VOTE NOW'}</p>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveFeature('mood')}
                            disabled={hasMood}
                            className={`group relative w-full ${hasMood ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                            <div className="relative p-4 bg-purple-300 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 transition-transform h-full flex flex-col justify-center items-center">
                                <div className="text-4xl mb-2 grayscale group-hover:grayscale-0 transition-all">
                                    {hasMood ? '✅' : '🎭'}
                                </div>
                                <h4 className="font-black uppercase text-xl">Mood Check</h4>
                                <p className="text-sm font-bold mt-1">{hasMood ? 'VIBE CHECKED' : 'CHECK IN'}</p>
                            </div>
                        </button>
                    </div>

                    {/* AI Chat Button */}
                    <div className="mt-4">
                        <button
                            onClick={onAI}
                            className="group relative w-full"
                        >
                            <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                            <div className="relative p-4 bg-gradient-to-r from-teal-400 to-cyan-300 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 transition-transform h-full flex items-center justify-between">
                                <div className="text-left">
                                    <h4 className="font-black uppercase text-xl text-black">🤖 Chat with AI</h4>
                                    <p className="text-sm font-bold mt-1 text-black">CREATE YOUR PERFECT PARTNER</p>
                                </div>
                                <div className="text-3xl animate-bounce">✨</div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 flex flex-col items-center justify-center gap-4">
                        <DeviceIdDisplay />
                        <Button
                            onClick={onEditProfile}
                            variant="outline"
                            size="sm"
                            className="bg-gray-100"
                        >
                            EDIT PROFILE SETTINGS
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Feature Modals */}
            {activeFeature && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card variant="white" className="w-full max-w-sm relative animate-in zoom-in duration-200">
                        <button
                            onClick={() => setActiveFeature(null)}
                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 font-bold"
                        >
                            ✕
                        </button>

                        {activeFeature === 'poll' && (
                            <div className="text-center p-4">
                                <h3 className="font-black text-2xl uppercase mb-6">Which is better?</h3>
                                {hasVoted ? (
                                    <div className="py-8 text-green-600 font-bold text-xl uppercase animate-bounce">
                                        Thanks for voting!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <button onClick={() => handleVote('coffee')} className="w-full p-4 border-[3px] border-black bg-blue-200 hover:bg-blue-300 font-bold text-xl uppercase shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                                            ☕ Coffee
                                        </button>
                                        <button onClick={() => handleVote('tea')} className="w-full p-4 border-[3px] border-black bg-green-200 hover:bg-green-300 font-bold text-xl uppercase shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                                            🍵 Tea
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeFeature === 'mood' && (
                            <div className="text-center p-4">
                                <h3 className="font-black text-2xl uppercase mb-6">Current Vibe?</h3>
                                {hasMood ? (
                                    <div className="py-8 text-purple-600 font-bold text-xl uppercase animate-bounce">
                                        Vibe Captured!
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        {['🔥', '💀', '🤡', '🥰', '🤬', '😴'].map(mood => (
                                            <button
                                                key={mood}
                                                onClick={() => handleMood(mood)}
                                                className="aspect-square flex items-center justify-center text-4xl border-[3px] border-black hover:bg-yellow-200 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer"
                                            >
                                                {mood}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </>
    );
}
