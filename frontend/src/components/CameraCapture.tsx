'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { generateDeviceId } from '@/utils/device-id';

export default function CameraCapture() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const [verificationMessage, setVerificationMessage] = useState<string>('');

    const startCamera = async () => {
        setIsLoading(true);
        setError(null);
        setVerificationStatus('idle');
        setVerificationMessage('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Camera API is not supported in this browser");
            setIsLoading(false);
            return;
        }

        try {
            // Strict constraint for user-facing camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Play error:", e));
                    setIsStreaming(true);
                    setIsLoading(false);
                };
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(`Camera access denied. Please allow permissions to verify.`);
            setIsLoading(false);
        }
    };

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsStreaming(false);
        }
    }, []);

    const captureAndVerify = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsLoading(true);
        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError("Internal error: Canvas context missing");
            setIsLoading(false);
            return;
        }

        // Draw current frame
        ctx.drawImage(video, 0, 0);

        // Convert to Blob (JPEG 92%)
        canvas.toBlob(async (blob) => {
            if (!blob) {
                setError("Failed to capture image");
                setIsLoading(false);
                return;
            }

            // Immediately stop camera privacy rule
            stopCamera();

            try {
                const deviceId = await generateDeviceId();
                console.log("Starting verification request..."); // Force HMR update
                const formData = new FormData();
                formData.append('file', blob, 'capture.jpg');
                formData.append('device_id', deviceId);

                // Use relative path to leverage Next.js proxy
                const response = await fetch('/api/v1/verification/verify-gender', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.detail || 'Verification failed');
                }

                setVerificationStatus('success');
                setVerificationMessage(`Verified as ${result.gender} (${(result.confidence * 100).toFixed(1)}%)`);
            } catch (err) {
                console.error("Verification error:", err);
                setVerificationStatus('failed');
                setVerificationMessage(err instanceof Error ? err.message : "Verification failed");
                // Allow retrying
            } finally {
                setIsLoading(false);
            }

        }, 'image/jpeg', 0.92);
    };

    // Cleanup
    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <div className="flex flex-col items-center gap-6 p-6 border rounded-xl shadow-lg max-w-lg mx-auto bg-white dark:bg-gray-800 transition-all">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Identity Verification
            </h3>

            <div className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 ${verificationStatus === 'success' ? 'border-green-500' :
                verificationStatus === 'failed' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}>

                {/* Initial State / Messages */}
                {!isStreaming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-black/80 text-white">
                        {verificationStatus === 'success' ? (
                            <div className="text-green-400">
                                <span className="text-4xl">✓</span>
                                <p className="mt-2 font-semibold">{verificationMessage}</p>
                                <p className="text-sm opacity-75 mt-1">Image discarded for privacy.</p>
                            </div>
                        ) : verificationStatus === 'failed' ? (
                            <div className="text-red-400">
                                <span className="text-4xl">⚠</span>
                                <p className="mt-2 font-semibold">{verificationMessage}</p>
                                <button
                                    onClick={startCamera}
                                    className="mt-4 px-4 py-2 bg-white text-red-600 rounded-full text-sm font-bold hover:bg-gray-200"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm opacity-90 max-w-xs mx-auto">
                                    Instant camera-only verification. No uploads allowed.
                                    Images are processed in memory and immediately deleted.
                                </p>
                                <button
                                    onClick={startCamera}
                                    disabled={isLoading}
                                    className="px-6 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Starting...' : 'Enable Camera'}
                                </button>
                            </div>
                        )}

                        {error && (
                            <p className="mt-4 text-red-500 bg-black/90 px-3 py-1 rounded">{error}</p>
                        )}
                    </div>
                )}

                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                />
            </div>

            {isStreaming && (
                <div className="flex flex-col items-center gap-3 w-full">
                    <button
                        onClick={captureAndVerify}
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg transition transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Verifying...' : 'Verify Identity'}
                    </button>
                    <p className="text-xs text-gray-400">
                        By verifying, you confirm this is your real photo.
                    </p>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
