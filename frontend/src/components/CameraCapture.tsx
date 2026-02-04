'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { generateDeviceId } from '@/utils/device-id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
            setError(`Camera access denied.`);
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
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) return;

            stopCamera();

            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            try {
                const deviceId = await generateDeviceId();
                const formData = new FormData();
                formData.append('file', blob, 'capture.jpg');
                formData.append('device_id', deviceId);

                const response = await fetch(`${API_BASE}/api/v1/verification/verify-gender`, {
                    method: 'POST',
                    body: formData,
                });

                const responseText = await response.text();
                let result;
                try { result = JSON.parse(responseText); } catch (e) { throw new Error('Server error'); }

                if (!response.ok) throw new Error(result.detail || 'Verification failed');

                setVerificationStatus('success');
                setVerificationMessage(`Verified as ${result.gender} (${(result.confidence * 100).toFixed(1)}%)`);

                if (onCapture) {
                    setTimeout(() => onCapture(result.gender), 1500);
                }
            } catch (err) {
                console.error("Verification error:", err);
                setVerificationStatus('failed');
                // Show URL for debugging
                const errorMessage = err instanceof Error ? err.message : "Verification failed";
                setVerificationMessage(`${errorMessage} (Target: ${API_BASE})`);
            } finally {
                setIsLoading(false);
            }

        }, 'image/jpeg', 0.92);
    };

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <Card variant="white" className="flex flex-col items-center gap-6 max-w-lg mx-auto">
            <h3 className="text-2xl font-black uppercase bg-primary px-4 py-1 border-[3px] border-black transform -rotate-1">
                Identity Check
            </h3>

            <div className={`relative w-full aspect-video bg-black/10 overflow-hidden border-[3px] border-black shadow-hard ${verificationStatus === 'success' ? 'border-green-500' :
                verificationStatus === 'failed' ? 'border-red-500' : ''
                }`}>

                {!isStreaming && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-white/90">
                        {verificationStatus === 'success' ? (
                            <div className="text-black">
                                <span className="text-6xl text-green-500 font-black">✓</span>
                                <p className="mt-2 font-bold uppercase">{verificationMessage}</p>
                            </div>
                        ) : verificationStatus === 'failed' ? (
                            <div className="text-red-600">
                                <span className="text-6xl font-black">!</span>
                                <p className="mt-2 font-bold uppercase">{verificationMessage}</p>
                                <Button
                                    onClick={startCamera}
                                    variant="outline"
                                    className="mt-4 border-red-600 text-red-600"
                                >
                                    TRY AGAIN
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="font-bold uppercase max-w-xs mx-auto">
                                    Instant Camera Verification.
                                </p>
                                <Button
                                    onClick={startCamera}
                                    disabled={isLoading}
                                    variant="primary"
                                    size="lg"
                                >
                                    {isLoading ? 'INITIATING...' : 'ENABLE CAMERA'}
                                </Button>
                            </div>
                        )}

                        {error && (
                            <p className="mt-4 font-bold bg-red-500 text-white px-2 border-2 border-black">{error}</p>
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
                    <Button
                        onClick={captureAndVerify}
                        disabled={isLoading}
                        variant="accent"
                        size="lg"
                        className="w-full"
                    >
                        {isLoading ? 'VERIFYING...' : 'VERIFY MY IDENTITY'}
                    </Button>
                    <p className="text-xs font-bold uppercase text-gray-500">
                        We process this image instantly and then delete it.
                    </p>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </Card>
    );
}