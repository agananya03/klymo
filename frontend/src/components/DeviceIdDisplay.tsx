'use client';

import { useEffect, useState } from 'react';
import { generateDeviceId } from '@/utils/device-id';
import { Card } from '@/components/ui/Card';

export default function DeviceIdDisplay() {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <Card variant="white" className="max-w-md mt-4 p-4 border-[3px] border-black shadow-hard bg-gray-100">
            <h3 className="text-xs font-black uppercase tracking-wide mb-2 bg-black text-white inline-block px-2 py-1 transform -rotate-2">
                Device Identity
            </h3>
            {loading ? (
                <div className="animate-pulse h-8 w-3/4 bg-gray-300 border-[3px] border-black"></div>
            ) : (
                <div className="flex flex-col gap-2">
                    <code className="bg-white px-3 py-2 border-[3px] border-black font-mono text-sm break-all font-bold">
                        {deviceId || 'Error generating ID'}
                    </code>
                    <p className="text-[10px] uppercase font-bold text-gray-500">
                        Persisted in IndexedDB. Hashed from browser entropy.
                    </p>
                </div>
            )}
        </Card>
    );
}
