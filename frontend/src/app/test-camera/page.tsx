'use client';

import CameraCapture from '../../components/CameraCapture';
import { useState } from 'react';
import { getApiUrl } from '@/utils/api-config';

export default function TestCameraPage() {
    const [lastCapture, setLastCapture] = useState<string | null>(null);
    const [detectionResult, setDetectionResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCapture = async (imageData: string) => {
        console.log("Image captured:", imageData.substring(0, 50) + "...");
        setLastCapture(imageData);
        setDetectionResult(null);
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(imageData);
            const blob = await res.blob();
            const formData = new FormData();
            formData.append("file", blob, "test-capture.jpg");

            const response = await fetch(getApiUrl("/api/v1/detect/gender"), {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "API Error");
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setDetectionResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-center">Camera Capture & Gender Verification</h1>

            <div className="max-w-xl mx-auto flex flex-col gap-6">
                <CameraCapture onCapture={handleCapture} />

                {loading && <div className="mt-4 text-center animate-pulse text-blue-500">Detecting Gender...</div>}

                {error && <div className="mt-4 text-center text-red-500">Error: {error}</div>}

                {detectionResult && (
                    <div className="mt-4 p-4 border border-green-500 bg-green-50 dark:bg-green-900 rounded">
                        <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Detection Result</h2>
                        <pre className="text-xs bg-white dark:bg-black p-2 rounded overflow-auto">
                            {JSON.stringify(detectionResult, null, 2)}
                        </pre>
                    </div>
                )}

                {lastCapture && (
                    <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 flex flex-col items-center gap-4">
                        <h2 className="text-xl font-semibold">Capture Ready</h2>
                        <img src={lastCapture} alt="Capture" className="w-32 h-32 object-cover rounded shadow" />
                        {/* 
                        <button
                            onClick={() => handleCapture(lastCapture)}
                            disabled={loading}
                            className={`px-6 py-2 rounded-full font-bold text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {loading ? 'Retrying...' : 'Retry Verification'}
                        </button> 
                        */}
                    </div>
                )}
            </div>
        </div>
    );
}
