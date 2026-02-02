'use client';

import { useState, useEffect } from 'react';

interface Stats {
    users: { total: number; male: number; female: number };
    sessions: { total: number; active_now: number };
    queues: { male: number; female: number; any: number; total_waiting: number };
    safety: { reports: number };
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/v1/analytics/dashboard');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050510] text-blue-500">
                <span className="animate-pulse tracking-widest uppercase">Initializing System...</span>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-[#050510] text-white p-8 font-mono overflow-auto">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 border-b border-blue-500/20 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent uppercase tracking-tighter">
                        Nexus/Admin
                    </h1>
                    <p className="text-xs text-blue-400/60 uppercase tracking-widest mt-1">System Monitoring Interface v1.0</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    LIVE FEED
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Active Sessions Card */}
                <div className="bg-[#0a0a1f] border border-blue-500/10 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <svg className="w-24 h-24 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-blue-400 mb-2 uppercase text-xs tracking-wider">Active Conversations</h3>
                    <p className="text-5xl font-bold text-white mb-2">{stats.sessions.active_now}</p>
                    <div className="text-xs text-blue-300/50">
                        Total Historical: {stats.sessions.total}
                    </div>
                </div>

                {/* Queue Card */}
                <div className="bg-[#0a0a1f] border border-cyan-500/10 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <svg className="w-24 h-24 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-cyan-400 mb-2 uppercase text-xs tracking-wider">Waiting in Queue</h3>
                    <p className="text-5xl font-bold text-white mb-4">{stats.queues.total_waiting}</p>

                    <div className="flex gap-2 text-xs">
                        <span className="bg-blue-500/20 px-2 py-1 rounded text-blue-300">M: {stats.queues.male}</span>
                        <span className="bg-pink-500/20 px-2 py-1 rounded text-pink-300">F: {stats.queues.female}</span>
                        <span className="bg-white/10 px-2 py-1 rounded text-gray-300">Any: {stats.queues.any}</span>
                    </div>
                </div>

                {/* User Base Card */}
                <div className="bg-[#0a0a1f] border border-purple-500/10 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <svg className="w-24 h-24 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-purple-400 mb-2 uppercase text-xs tracking-wider">Total Users</h3>
                    <p className="text-5xl font-bold text-white mb-4">{stats.users.total}</p>

                    <div className="w-full bg-white/5 rounded-full h-1.5 flex overflow-hidden">
                        <div style={{ width: `${(stats.users.male / stats.users.total) * 100}%` }} className="bg-blue-500 h-full"></div>
                        <div style={{ width: `${(stats.users.female / stats.users.total) * 100}%` }} className="bg-pink-500 h-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase text-gray-500 mt-1">
                        <span>Male</span>
                        <span>Female</span>
                    </div>
                </div>

                {/* Safety Card */}
                <div className="bg-[#0a0a1f] border border-red-500/10 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <svg className="w-24 h-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-red-400 mb-2 uppercase text-xs tracking-wider">Reports Filed</h3>
                    <p className="text-5xl font-bold text-white mb-2">{stats.safety.reports}</p>
                    <div className="text-xs text-red-300/50">
                        Attention Required
                    </div>
                </div>

            </div>

            {/* Grid Visualization */}
            <div className="max-w-7xl mx-auto mt-8 bg-[#0a0a1f] border border-white/5 p-6 rounded-2xl">
                <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-4 border-b border-white/5 pb-2">System Logs</h3>
                <div className="space-y-2 text-xs font-mono text-gray-500 h-32 overflow-hidden">
                    <p className="flex gap-4"><span className="text-blue-500">{new Date().toISOString()}</span> <span>SYSTEM ONLINE</span></p>
                    <p className="flex gap-4"><span className="text-blue-500">{new Date(Date.now() - 1000).toISOString()}</span> <span>REDIS CONNECTION ESTABLISHED</span></p>
                    <p className="flex gap-4"><span className="text-blue-500">{new Date(Date.now() - 2000).toISOString()}</span> <span>SYNCING KLYMO QUEUES...</span></p>
                    <p className="flex gap-4"><span className="text-green-500">{new Date(Date.now() - 5000).toISOString()}</span> <span>STATS UPDATED SUCCESSFULLY</span></p>
                </div>
            </div>
        </div>
    );
}
