'use client';

import { useState } from 'react';
import CameraCapture from "@/components/CameraCapture";
import { getApiUrl } from '@/utils/api-config';

export default function UserVerification() {
    const [result, setResult] = useState<{ label: string; score: number }[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const handleCapture = async (img: string) => {
        console.log("Captured image, sending to backend...");
        setLoading(true);
        setApiError(null);
        setResult(null);

        try {
            // Convert base64 to blob
            const res = await fetch(img);
            const blob = await res.blob();

            const formData = new FormData();
            formData.append("file", blob, "capture.jpg");

            const response = await fetch(getApiUrl("/api/v1/detect/gender"), {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Detection failed");
            }

            const data = await response.json();
            console.log("Detection result:", data);
            setResult(data);
        } catch (e: any) {
            console.error("API Error:", e);
            setApiError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-lg font-semibold mb-4 text-center">User Verification</h2>
            <CameraCapture onCapture={handleCapture} />

            {loading && (
                <div className="mt-4 text-center text-blue-500 animate-pulse font-medium">
                    Detecting gender...
                </div>
            )}

            {apiError && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-center text-sm">
                    Error: {apiError}
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-800 text-center">
                    <h3 className="font-bold text-lg text-green-800 dark:text-green-100 mb-2">Detection Result</h3>
                    <div className="flex flex-col gap-1">
                        {result.map((item, idx) => (
                            <p key={idx} className="text-gray-700 dark:text-gray-200">
                                <span className="font-semibold capitalize">{item.label}</span>: {(item.score * 100).toFixed(1)}%
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
