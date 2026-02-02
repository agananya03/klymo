'use client';

import { useState, useEffect } from 'react';
import { generateDeviceId } from '@/utils/device-id';

interface ProfileFormProps {
    onProfileComplete: () => void;
}

export default function ProfileForm({ onProfileComplete }: { onProfileComplete: (pref: string) => void }) {
    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
    const [preference, setPreference] = useState('any');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        // Load device ID and check for existing profile
        const loadProfile = async () => {
            const id = await generateDeviceId();
            setDeviceId(id);
            try {
                // Use relative path for proxy
                const res = await fetch(`/api/v1/profiles/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.nickname) setNickname(data.nickname);
                    if (data.bio) setBio(data.bio);
                    if (data.preference) setPreference(data.preference);
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        loadProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceId) return;

        setIsLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/v1/profiles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: deviceId,
                    nickname: nickname.trim(),
                    bio: bio.trim(),
                    preference: preference
                }),
            });

            if (!res.ok) throw new Error('Failed to save profile');

            setStatus('Profile saved successfully!');
            setTimeout(() => onProfileComplete(preference), 1000); // Proceed after delay
        } catch (err) {
            setStatus('Error saving profile. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        if (!deviceId || !confirm("Are you sure you want to clear your profile data?")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/profiles/${deviceId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to clear profile');

            setNickname('');
            setBio('');
            setPreference('any');
            setStatus('Profile data cleared.');
        } catch (err) {
            setStatus('Error clearing data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h3 className="text-2xl font-bold mb-2 text-white text-center tracking-tight">Setup Profile</h3>
            <p className="text-sm text-gray-400 mb-8 text-center font-light">
                Your nickname is temporary. No profile pictures allowed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-2 ml-1">Nickname</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="MysteryWalker"
                        maxLength={50}
                        required
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-300 group-hover:bg-white/10"
                    />
                </div>

                <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-pink-300 mb-2 ml-1">Looking For</label>
                    <div className="relative">
                        <select
                            value={preference}
                            onChange={(e) => setPreference(e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white appearance-none focus:ring-2 focus:ring-pink-500 outline-none transition-all duration-300 cursor-pointer hover:bg-white/10"
                        >
                            <option value="any" className="bg-gray-900">Anyone (Fastest Match)</option>
                            <option value="male" className="bg-gray-900">Male</option>
                            <option value="female" className="bg-gray-900">Female</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-pink-500">
                            ▼
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-2 ml-1">Short Bio (Optional)</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Just here to chat..."
                        maxLength={200}
                        rows={3}
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-300 resize-none group-hover:bg-white/10"
                    />
                </div>

                {status && (
                    <p className={`text-sm text-center font-bold tracking-wide animate-pulse ${status?.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {status}
                    </p>
                )}

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isLoading || !nickname.trim()}
                        className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></span>
                            </span>
                        ) : 'Start Matching'}
                    </button>
                    {nickname && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isLoading}
                            className="px-6 py-4 text-red-400 font-semibold hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/50"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
