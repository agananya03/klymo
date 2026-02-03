import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DashboardProps {
    onStartChat: () => void;
    onEditProfile: () => void;
}

export default function Dashboard({ onStartChat, onEditProfile }: DashboardProps) {
    const [userCount, setUserCount] = useState<number | null>(null);

    useEffect(() => {
        setUserCount(Math.floor(Math.random() * 500) + 120);
    }, []);

    return (
        <Card className="w-full max-w-lg p-0 overflow-hidden relative">
            {/* Hero Section */}
            <div className="p-8 pb-12 bg-secondary text-center relative border-b-[3px] border-black">
                {/* Decorative background pattern */}
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
                <div className="grid grid-cols-2 gap-4">
                    <button className="group relative">
                        <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                        <div className="relative p-4 bg-yellow-200 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 transition-transform bg-[url('/noise.png')]">
                            <div className="text-3xl mb-2 grayscale group-hover:grayscale-0 transition-all">🗳️</div>
                            <h4 className="font-black uppercase text-sm">Daily Poll</h4>
                            <p className="text-xs font-bold">VOTE NOW</p>
                        </div>
                    </button>

                    <button className="group relative">
                        <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                        <div className="relative p-4 bg-purple-300 border-[3px] border-black hover:-translate-y-1 hover:-translate-x-1 transition-transform">
                            <div className="text-3xl mb-2 grayscale group-hover:grayscale-0 transition-all">🎭</div>
                            <h4 className="font-black uppercase text-sm">Mood Check</h4>
                            <p className="text-xs font-bold">VIBE CHECK</p>
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
    );
}
