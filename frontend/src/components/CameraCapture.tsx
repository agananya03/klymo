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
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setDebugLogs(prev => [...prev.slice(-4), msg]); // Keep last 5 logs
        console.log(msg);
    };

    const startCamera = async () => {
        addLog("Starting camera...");
        try {
            setError(null);
            addLog("Requesting navigator.mediaDevices.getUserMedia...");

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser API navigator.mediaDevices.getUserMedia not available");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true // Simplified constraints for maximum compatibility
            });
            addLog("Stream acquired successfully");

            if (videoRef.current) {
                addLog("Attaching stream to video element");
                videoRef.current.srcObject = stream;
                try {
                    await videoRef.current.play();
                    addLog("Video playing");
                    setIsStreaming(true);
                } catch (playError) {
                    addLog(`Play error: ${playError}`);
                    console.error("Play error", playError);
                }
            } else {
                addLog("Error: videoRef is null");
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            const errMsg = err.name + ": " + err.message;
            addLog(`Error: ${errMsg}`);
            setError(`Camera Error: ${errMsg}. Check permissions.`);
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
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
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

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg shadow-md max-w-md mx-auto bg-white dark:bg-gray-800">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                {!isStreaming && !capturedImage && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                        <button
                            onClick={startCamera}
                            className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition"
                        >
                            Start Camera
                        </button>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500 p-4 text-center z-10 bg-black/80">
                        {error}
                        <button onClick={startCamera} className="mt-4 px-3 py-1 bg-white text-black rounded text-sm">Retry</button>
                    </div>
                )}

                {/* Debug Logs Overlay */}
                <div className="absolute top-0 left-0 p-2 text-xs text-green-400 bg-black/50 pointer-events-none z-20 w-full text-left font-mono">
                    {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                </div>

                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
                    playsInline
                    muted
                    autoPlay
                />

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

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
