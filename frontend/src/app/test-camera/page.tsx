'use client';

import CameraCapture from '../../components/CameraCapture';
import { useState } from 'react';

export default function TestCameraPage() {
    const [lastCapture, setLastCapture] = useState<string | null>(null);
    const [genderResult, setGenderResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCapture = (imageData: string) => {
        console.log("Image captured");
        setLastCapture(imageData);
        setGenderResult(null);
    };

    const verifyGender = async () => {
        if (!lastCapture) return;

        setLoading(true);
        setGenderResult(null);
        try {
            const response = await fetch('http://localhost:8000/api/v1/gender/verify-gender', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: lastCapture }),
            });

            const data = await response.json();
            if (response.ok) {
                setGenderResult(data.gender);
            } else {
                console.error("Verification failed", data);
                setGenderResult("Error: " + (data.detail || "Verification failed"));
            }
        } catch (error) {
            console.error("Network error", error);
            setGenderResult("Network Error - Check Backend Connection");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-center">Camera Capture & Gender Verification</h1>

            <div className="max-w-xl mx-auto flex flex-col gap-6">
                <CameraCapture onCapture={handleCapture} />

                {lastCapture && (
                    <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 flex flex-col items-center gap-4">
                        <h2 className="text-xl font-semibold">Capture Ready</h2>
                        <img src={lastCapture} alt="Capture" className="w-32 h-32 object-cover rounded shadow" />

                        <button
                            onClick={verifyGender}
                            disabled={loading}
                            className={`px-6 py-2 rounded-full font-bold text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                        >
                            {loading ? 'Verifying...' : 'Verify Gender'}
                        </button>

                        {genderResult && (
                            <div className={`mt-4 p-4 rounded-lg w-full text-center text-lg font-bold ${genderResult.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                }`}>
                                Result: {genderResult}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
