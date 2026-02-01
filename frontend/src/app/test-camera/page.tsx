'use client';

import CameraCapture from '../../components/CameraCapture';
import { useState } from 'react';

export default function TestCameraPage() {
    const [lastCapture, setLastCapture] = useState<string | null>(null);

    const handleCapture = (imageData: string) => {
        console.log("Image captured:", imageData.substring(0, 50) + "...");
        setLastCapture(imageData);
    };

    return (
        <div className="min-h-screen p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-center">Camera Capture Test</h1>

            <div className="max-w-xl mx-auto">
                <CameraCapture onCapture={handleCapture} />

                {lastCapture && (
                    <div className="mt-8 p-4 border rounded bg-gray-50 dark:bg-gray-800">
                        <h2 className="text-xl font-semibold mb-4">Last Capture Result</h2>
                        <p className="text-sm text-gray-500 mb-2">Base64 Data (truncated):</p>
                        <code className="block p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto text-xs">
                            {lastCapture.substring(0, 100)}...
                        </code>
                    </div>
                )}
            </div>
        </div>
    );
}
