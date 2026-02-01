'use client';

import { useState, useEffect } from 'react';
import { generateDeviceId } from '@/utils/device-id';

interface ProfileFormProps {
    onProfileComplete: () => void;
}

export default function ProfileForm({ onProfileComplete }: ProfileFormProps) {
    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
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
                    bio: bio.trim()
                }),
            });

            if (!res.ok) throw new Error('Failed to save profile');

            setStatus('Profile saved successfully!');
            setStatus('Profile saved successfully!');
            console.log("Calling onProfileComplete immediately");
            onProfileComplete(); // Immediate call for debugging
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
            setStatus('Profile data cleared.');
        } catch (err) {
            setStatus('Error clearing data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Setup Profile</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your nickname is temporary. No profile pictures are allowed for privacy.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Nickname</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="e.g. MysteryWalker"
                        maxLength={50}
                        required
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Short Bio (Optional)</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Just here to chat..."
                        maxLength={200}
                        rows={3}
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                    />
                </div>

                {status && (
                    <p className={`text-sm text-center font-medium ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                        {status}
                    </p>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={isLoading || !nickname.trim()}
                        className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
                    >
                        {isLoading ? 'Saving...' : 'Continue'}
                    </button>
                    {nickname && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isLoading}
                            className="px-4 py-3 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Clear Profile Data"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
