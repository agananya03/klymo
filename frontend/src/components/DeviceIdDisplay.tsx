'use client';

import { useEffect, useState } from 'react';
import { generateDeviceId } from '@/utils/device-id';
import { Card } from '@/components/ui/Card';
import { BADGES, loadBadges, loadStats, KlymoStats } from '@/utils/badges';

export default function DeviceIdDisplay() {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [streakCount, setStreakCount] = useState<number>(0);
    const [showId, setShowId] = useState(false);
    const [showBadges, setShowBadges] = useState(false);
    const [stats, setStats] = useState<KlymoStats | null>(null);
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [selectedBadge, setSelectedBadge] = useState<typeof BADGES[0] | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchId() {
            try {
                const id = await generateDeviceId();
                if (mounted) {
                    setDeviceId(id);
                }
            } catch (error) {
                console.error('Failed to generate device ID', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchId();

        // Retrieve streak count from localStorage
        const rawStreak = localStorage.getItem('klymo_streak');
        if (rawStreak) {
            try {
                const parsed = JSON.parse(rawStreak);
                if (mounted) {
                    setStreakCount(parsed.count || 0);
                }
            } catch (e) {
                console.error('Failed to parse streak count', e);
            }
        }

        // Retrieve stats and badges
        const loadedStats = loadStats();
        const loadedBadges = loadBadges();
        if (mounted) {
            setStats(loadedStats);
            setEarnedBadges(loadedBadges);
        }

        return () => {
            mounted = false;
        };
    }, []);

    const toggleBadges = () => {
        if (!showBadges) {
            setStats(loadStats());
            setEarnedBadges(loadBadges());
        }
        setShowBadges(!showBadges);
    };

    return (
        <Card variant="white" className="max-w-md w-full mt-4 p-4 border-[3px] border-black shadow-hard bg-gray-100">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h3 className="text-xs font-black uppercase tracking-wide bg-black text-white inline-block px-2 py-1 transform -rotate-2">
                    Device Identity
                </h3>
                <span className="text-xs font-black uppercase tracking-wide bg-yellow-300 text-black inline-block px-2.5 py-1 border-[2.5px] border-black shadow-[2px_2px_0px_0px_#000] transform rotate-1 select-none animate-in fade-in duration-300">
                    🔥 {streakCount} this week
                </span>
            </div>
            {loading ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-300 border-[3px] border-black"></div>
            ) : (
                <div className="flex flex-col gap-2">
                    {showId ? (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <code className="bg-white px-3 py-2 border-[3px] border-black font-mono text-sm break-all font-bold text-left min-h-[42px] flex items-center">
                                {deviceId || 'Error generating ID'}
                            </code>
                            <div className="flex items-center justify-between gap-4 mt-1">
                                <p className="text-[10px] uppercase font-bold text-gray-500 text-left">
                                    Persisted in IndexedDB. Hashed from browser entropy.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowId(false)}
                                    className="px-3 py-1.5 border-[3px] border-black bg-white hover:bg-gray-100 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer select-none"
                                >
                                    Hide ID
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowId(true)}
                            className="w-full py-2 border-[3px] border-black bg-white hover:bg-gray-100 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer select-none"
                        >
                            Show Device ID Key
                        </button>
                    )}

                    {/* Badges Collapsible Accordion */}
                    <button
                        type="button"
                        onClick={toggleBadges}
                        className="w-full mt-2 py-2 border-[3px] border-black bg-accent text-black hover:bg-cyan-400 font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer select-none"
                    >
                        {showBadges ? 'Hide My Badges 🏆' : 'View My Badges 🏆'}
                    </button>

                    {showBadges && (
                        <div className="mt-3 p-3 border-[3px] border-black bg-white shadow-[2px_2px_0px_0px_#000] animate-in slide-in-from-top-2 duration-300">
                            <h4 className="text-xs font-black uppercase mb-3 border-b-2 border-black pb-1">
                                Badges & Achievements
                            </h4>
                            
                            {/* Grid: 4 cols desktop, 2 cols mobile */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {BADGES.map((badge) => {
                                    const isEarned = earnedBadges.includes(badge.id);
                                    return (
                                        <div
                                            key={badge.id}
                                            onMouseEnter={() => setSelectedBadge(badge)}
                                            onMouseLeave={() => setSelectedBadge(null)}
                                            onClick={() => {
                                                setSelectedBadge(prev => prev?.id === badge.id ? null : badge);
                                            }}
                                            className={`relative aspect-square flex flex-col items-center justify-center border-[3px] p-1 transition-all cursor-pointer select-none ${
                                                isEarned
                                                    ? 'border-accent bg-cyan-50 shadow-[1px_1px_0px_0px_#000]'
                                                    : 'border-dashed border-gray-400 bg-gray-50 opacity-40 grayscale'
                                            }`}
                                        >
                                            <span className="text-2xl sm:text-3xl mb-0.5">{badge.emoji}</span>
                                            <span className="text-[9px] font-black uppercase text-center leading-none tracking-tight">
                                                {badge.name}
                                            </span>
                                            {!isEarned && (
                                                <span className="absolute top-0.5 right-0.5 text-[9px]" aria-label="Locked">
                                                    🔒
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Badge Detail Panel */}
                            {selectedBadge && (
                                <div className="mt-3 p-2 bg-yellow-100 border-[3px] border-black text-left shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-200">
                                    <p className="font-black text-xs uppercase flex items-center gap-1">
                                        <span>{selectedBadge.emoji}</span>
                                        <span>{selectedBadge.name}</span>
                                        <span className="text-[8px] px-1 bg-black text-white font-bold ml-auto">
                                            {earnedBadges.includes(selectedBadge.id) ? 'UNLOCKED' : 'LOCKED'}
                                        </span>
                                    </p>
                                    <p className="text-[9px] text-gray-700 mt-1 uppercase font-bold leading-tight">
                                        {selectedBadge.description}
                                    </p>
                                    <p className="text-[8px] text-gray-500 mt-0.5 uppercase font-medium">
                                        Goal: {selectedBadge.criteria}
                                    </p>
                                </div>
                            )}

                            {/* Stats Progress Tracker */}
                            {stats && (
                                <div className="mt-4 border-t-2 border-black pt-3 text-left">
                                    <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">
                                        Progress Tracker
                                    </h4>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-bold uppercase text-gray-700">
                                        <div className="flex justify-between">
                                            <span>Chats:</span>
                                            <span className="font-black text-black">{stats.totalChats} / 10</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Messages:</span>
                                            <span className="font-black text-black">{stats.totalMessages} / 100</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Interests:</span>
                                            <span className="font-black text-black">{stats.chattedInterests.length} / 5</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>5★ Ratings:</span>
                                            <span className="font-black text-black">{stats.ratingsCountOfFive} / 3</span>
                                        </div>
                                        <div className="flex justify-between col-span-2">
                                            <span>Night Chat (12am-4am):</span>
                                            <span className="font-black text-black">{stats.hasCompletedNightChat ? '✅ UNLOCKED' : '❌ LOCKED'}</span>
                                        </div>
                                        <div className="flex justify-between col-span-2">
                                            <span>Cross-Region Chat:</span>
                                            <span className="font-black text-black">{stats.hasChattedDifferentRegion ? '✅ UNLOCKED' : '❌ LOCKED'}</span>
                                        </div>
                                        <div className="flex justify-between col-span-2">
                                            <span>Daily Challenges:</span>
                                            <span className="font-black text-black">{stats.dailyChallengesCompleted || 0} / 3</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}


