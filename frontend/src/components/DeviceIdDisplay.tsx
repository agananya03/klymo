'use client';

import { useEffect, useState } from 'react';
import { generateDeviceId } from '@/utils/device-id';

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
        <div className="p-4 bg-gray-100 rounded-lg shadow-sm border border-gray-200 max-w-md mt-4 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 dark:text-gray-400">
                Device Identity
            </h3>
            {loading ? (
                <div className="animate-pulse h-6 w-3/4 bg-gray-300 rounded dark:bg-gray-700"></div>
            ) : (
                <div className="flex flex-col gap-1">
                    <code className="bg-white px-2 py-1 rounded border border-gray-200 font-mono text-sm break-all text-gray-800 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200">
                        {deviceId || 'Error generating ID'}
                    </code>
                    <p className="text-xs text-gray-400 mt-1">
                        Persisted in IndexedDB. Hashed from browser entropy.
                    </p>
                </div>
            )}
        </div>
    );
}
