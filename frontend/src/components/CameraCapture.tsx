'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface CameraCaptureProps {
    onCapture?: (imageData: string) => void;
    width?: number;
    height?: number;
}

export default function CameraCapture({
    onCapture,
    width = 640,
    height = 480
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const startCamera = async () => {
        console.log("Starting camera...");
        try {
            setError(null);
            console.log("Requesting user media...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            console.log("Stream acquired:", stream);

            if (videoRef.current) {
                console.log("Setting video srcObject");
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsStreaming(true);
            } else {
                console.error("Video ref is null");
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
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

    const takePhoto = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                // Match canvas size to video size
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Get base64 string
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);

                if (onCapture) {
                    onCapture(dataUrl);
                }
            }
        }
    }, [onCapture]);

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-md max-w-md mx-auto bg-white dark:bg-gray-800">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                {!isStreaming && !capturedImage && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <button
                            onClick={startCamera}
                            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition"
                        >
                            Start Camera
                        </button>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center">
                        {error}
                    </div>
                )}

                {/* Video Preview */}
                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
                    playsInline
                    muted
                    autoPlay
                />

                {/* Captured Image Preview */}
                {capturedImage && (
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            <div className="flex gap-4">
                {isStreaming && !capturedImage && (
                    <button
                        onClick={takePhoto}
                        className="px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 shadow-lg transition transform active:scale-95"
                    >
                        Capture
                    </button>
                )}

                {capturedImage && (
                    <button
                        onClick={retake}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                    >
                        Retake
                    </button>
                )}

                {isStreaming && (
                    <button
                        onClick={stopCamera}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                        Stop
                    </button>
                )}
            </div>

            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
