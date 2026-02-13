import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DashboardProps {
    onStartChat: () => void;
    onEditProfile: () => void;
    onAI: () => void;
}

export default function Dashboard({ onStartChat, onEditProfile, onAI }: DashboardProps) {
    const [userCount, setUserCount] = useState<number | null>(null);
    const [activeFeature, setActiveFeature] = useState<'poll' | 'mood' | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [hasMood, setHasMood] = useState(false);

    useEffect(() => {
        setUserCount(Math.floor(Math.random() * 500) + 120);
        // Check local storage for today's activity
        const today = new Date().toDateString();
        if (localStorage.getItem(`klymo_poll_${today}`)) setHasVoted(true);
        if (localStorage.getItem(`klymo_mood_${today}`)) setHasMood(true);
    }, []);

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
                    <Card variant="white" className="text-center p-8">
                        <p className="font-bold uppercase mb-4 text-xl">
                            Ready to meet a stranger?
                        </p>
                        <Button
                            onClick={onStartChat}
                            variant="accent"
                            size="lg"
                            className="w-full text-xl py-6 animate-pulse hover:animate-none"
                        >
                            START MATCHING 🚀
                        </Button>
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

                    <div className="mt-8 text-center">
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
