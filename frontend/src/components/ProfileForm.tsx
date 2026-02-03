'use client';

import { useState, useEffect } from 'react';
import { generateDeviceId } from '@/utils/device-id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ProfileFormProps {
    onProfileComplete: (preference: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProfileForm({ onProfileComplete }: ProfileFormProps) {
    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
    const [preference, setPreference] = useState('any');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            const id = await generateDeviceId();
            setDeviceId(id);
            try {
                const res = await fetch(`${API_BASE}/api/v1/profiles/${id}`);
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
            const res = await fetch(`${API_BASE}/api/v1/profiles`, {
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
            setTimeout(() => onProfileComplete(preference), 1000);
        } catch (err) {
            setStatus('Error saving profile.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = async () => {
        if (!deviceId || !confirm("Are you sure? This action is permanent.")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/profiles/${deviceId}`, {
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
        <Card variant="white" className="w-full max-w-md mx-auto">
            <h3 className="text-3xl font-black uppercase mb-4 text-center bg-primary border-b-[3px] border-black p-2 -mx-6 -mt-6">
                Setup Profile
            </h3>
            <p className="font-bold mb-6 text-center bg-black text-white p-2 border-[3px] border-black inline-block transform -rotate-1 mx-auto block max-w-xs">
                NO PICTURES. JUST VIBES.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="MYSTERY_WALKER"
                    maxLength={50}
                    required
                />

                {/* Looking For field removed as per request */}

                <div className="flex flex-col gap-2">
                    <label className="font-bold uppercase tracking-tight text-sm">Bio (Optional)</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="JUST HERE TO CHAT..."
                        maxLength={200}
                        rows={3}
                        className="w-full p-3 bg-white border-[3px] border-black font-bold focus:outline-none focus:shadow-hard transition-all resize-none placeholder:text-gray-500"
                    />
                </div>

                {status && (
                    <div className={`p-4 border-[3px] border-black font-bold text-center uppercase ${status.includes('Error') ? 'bg-red-500 text-white' : 'bg-green-400 text-black'}`}>
                        {status}
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <Button
                        type="submit"
                        disabled={isLoading || !nickname.trim()}
                        className="flex-1"
                        variant="primary"
                        size="lg"
                    >
                        {isLoading ? 'SAVING...' : 'CONTINUE'}
                    </Button>

                    {nickname && (
                        <Button
                            type="button"
                            onClick={handleClear}
                            disabled={isLoading}
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                            CLEAR
                        </Button>
                    )}
                </div>
            </form>
        </Card>
    );
}