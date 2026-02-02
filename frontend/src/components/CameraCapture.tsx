'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { generateDeviceId } from '@/utils/device-id';

interface CameraCaptureProps {
    onCapture?: (imageUrl: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
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

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    console.error("Non-JSON response received:", responseText);
                    throw new Error(`Server Error: ${responseText.substring(0, 100)}...`);
                }

                if (!response.ok) {
                    throw new Error(result.detail || result.error || 'Verification failed');
                }

                setVerificationStatus('success');
                setVerificationMessage(`Verified as ${result.gender} (${(result.confidence * 100).toFixed(1)}%)`);

                // Trigger parent callback after short delay for UX
                if (onCapture) {
                    // Pass the detected gender to the parent
                    setTimeout(() => onCapture(result.gender), 1500);
                }
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
        <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-700">
            <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-white tracking-wide">
                    Identity Verification
                </h3>
                <p className="text-xs text-blue-300/80 uppercase tracking-widest">
                    AI Gender Detection
                </p>
            </div>

            <div className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 ${verificationStatus === 'success' ? 'ring-2 ring-green-500 shadow-green-500/20' :
                    verificationStatus === 'failed' ? 'ring-2 ring-red-500 shadow-red-500/20' : 'ring-1 ring-white/10'
                }`}>

                {/* Scanner Overlay Animation */}
                {isStreaming && verificationStatus === 'idle' && (
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        <div className="w-full h-full border-2 border-blue-500/30 rounded-2xl box-border relative">
                            {/* Scanning horizontal line */}
                            <div className="w-full h-[2px] bg-blue-400/80 shadow-[0_0_15px_rgba(60,130,246,0.8)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                            {/* Corner marks */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                        </div>
                    </div>
                )}

                {/* Initial State / Messages */}
                {!isStreaming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-gray-900/90 backdrop-blur-sm text-white transition-all">
                        {verificationStatus === 'success' ? (
                            <div className="text-green-400 flex flex-col items-center animate-in zoom-in spin-in-180 duration-500">
                                <span className="text-5xl drop-shadow-lg mb-2">✓</span>
                                <p className="text-lg font-bold">{verificationMessage}</p>
                                <p className="text-xs text-green-400/70 mt-1 uppercase tracking-wider">Secure & Private</p>
                            </div>
                        ) : verificationStatus === 'failed' ? (
                            <div className="text-red-400 flex flex-col items-center animate-in shake duration-300">
                                <span className="text-5xl drop-shadow-lg mb-2">✕</span>
                                <p className="text-lg font-bold">{verificationMessage}</p>
                                <button
                                    onClick={startCamera}
                                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold transition border border-white/20"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-sm text-gray-300 max-w-xs mx-auto leading-relaxed">
                                        We verify gender using AI to ensure accurate matching. <br />
                                        <span className="text-blue-400 font-semibold">No images are ever stored.</span>
                                    </p>
                                </div>
                                <button
                                    onClick={startCamera}
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full font-bold hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></span>
                                            Initializing...
                                        </span>
                                    ) : (
                                        'Start Camera Verification'
                                    )}
                                </button>
                            </div>
                        )}

                        {error && (
                            <p className="mt-4 text-red-400 bg-red-900/20 border border-red-500/20 px-4 py-2 rounded-lg text-sm">{error}</p>
                        )}
                    </div>
                )}

                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                    playsInline
                    muted
                    autoPlay
                />
            </div>

            {isStreaming && (
                <div className="flex flex-col items-center gap-3 w-full animate-in slide-in-from-bottom-4 duration-500">
                    <button
                        onClick={captureAndVerify}
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-98 disabled:opacity-50 disabled:grayscale"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? 'Processing...' : 'Verify Now'}
                        </span>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                    </button>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">
                        Privacy Protected • Zero Storage
                    </p>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Inline Animation Style */}
            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes shine {
                    100% { transform: translateX(100%); }
                }
                .group:hover .group-hover\:animate-shine {
                    animation: shine 1s;
                }
            `}</style>
        </div>
    );
}
