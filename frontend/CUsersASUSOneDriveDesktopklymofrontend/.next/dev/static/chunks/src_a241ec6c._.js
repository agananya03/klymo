(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/utils/device-id.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateDeviceId",
    ()=>generateDeviceId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fingerprintjs$2f$fingerprintjs$2f$dist$2f$fp$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@fingerprintjs/fingerprintjs/dist/fp.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$idb$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/idb/build/index.js [app-client] (ecmascript)");
;
;
const DB_NAME = 'anonymousChat';
const STORE_NAME = 'identity';
const KEY_NAME = 'deviceId';
async function getStoredDeviceId() {
    try {
        const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$idb$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["openDB"])(DB_NAME, 1, {
            upgrade (db) {
                db.createObjectStore(STORE_NAME);
            }
        });
        return await db.get(STORE_NAME, KEY_NAME);
    } catch (error) {
        console.error('Error accessing IndexedDB:', error);
        return undefined;
    }
}
async function storeDeviceId(deviceId) {
    try {
        const db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$idb$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["openDB"])(DB_NAME, 1);
        await db.put(STORE_NAME, deviceId, KEY_NAME);
    } catch (error) {
        console.error('Error storing to IndexedDB:', error);
    }
}
async function hashString(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b)=>b.toString(16).padStart(2, '0')).join('');
}
async function generateDeviceId() {
    // 1. Check if ID already exists in IndexedDB
    const storedId = await getStoredDeviceId();
    if (storedId) {
        console.log('Device ID retrieved from storage:', storedId);
        return storedId;
    }
    // 2. Initialize FingerprintJS
    const fp = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$fingerprintjs$2f$fingerprintjs$2f$dist$2f$fp$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].load();
    const result = await fp.get();
    // 3. Collect entropy sources
    const entropy = {
        visitorId: result.visitorId,
        language: navigator.language,
        screenWidth: screen.width,
        screenHeight: screen.height,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgent: navigator.userAgent
    };
    // 4. Create a consistent string from entropy
    // Sorting keys to ensure consistency regardless of object property order
    const entropyString = Object.keys(entropy).sort().map((key)=>`${key}:${entropy[key]}`).join('|');
    console.log('Entropy string for hashing:', entropyString);
    // 5. Hash the combined string
    const deviceId = await hashString(entropyString);
    // 6. Store in IndexedDB
    await storeDeviceId(deviceId);
    console.log('New Device ID generated and stored:', deviceId);
    return deviceId;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/CameraCapture.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CameraCapture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/device-id.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function CameraCapture({ onCapture }) {
    _s();
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isStreaming, setIsStreaming] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [verificationStatus, setVerificationStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [verificationMessage, setVerificationMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const startCamera = async ()=>{
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
                video: {
                    facingMode: 'user',
                    width: 640,
                    height: 480
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = ()=>{
                    videoRef.current?.play().catch((e)=>console.error("Play error:", e));
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
    const stopCamera = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CameraCapture.useCallback[stopCamera]": ()=>{
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach({
                    "CameraCapture.useCallback[stopCamera]": (track)=>track.stop()
                }["CameraCapture.useCallback[stopCamera]"]);
                videoRef.current.srcObject = null;
                setIsStreaming(false);
            }
        }
    }["CameraCapture.useCallback[stopCamera]"], []);
    const captureAndVerify = async ()=>{
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
        canvas.toBlob(async (blob)=>{
            if (!blob) {
                setError("Failed to capture image");
                setIsLoading(false);
                return;
            }
            // Immediately stop camera privacy rule
            stopCamera();
            try {
                const deviceId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateDeviceId"])();
                console.log("Starting verification request..."); // Force HMR update
                const formData = new FormData();
                formData.append('file', blob, 'capture.jpg');
                formData.append('device_id', deviceId);
                // Use relative path to leverage Next.js proxy
                const response = await fetch('/api/v1/verification/verify-gender', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.detail || 'Verification failed');
                }
                setVerificationStatus('success');
                setVerificationMessage(`Verified as ${result.gender} (${(result.confidence * 100).toFixed(1)}%)`);
                // Trigger parent callback after short delay for UX
                if (onCapture) {
                    setTimeout(()=>onCapture(blob.size.toString()), 1500);
                }
            } catch (err) {
                console.error("Verification error:", err);
                setVerificationStatus('failed');
                setVerificationMessage(err instanceof Error ? err.message : "Verification failed");
            // Allow retrying
            } finally{
                setIsLoading(false);
            }
        }, 'image/jpeg', 0.92);
    };
    // Cleanup
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CameraCapture.useEffect": ()=>{
            return ({
                "CameraCapture.useEffect": ()=>stopCamera()
            })["CameraCapture.useEffect"];
        }
    }["CameraCapture.useEffect"], [
        stopCamera
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center gap-6 p-6 border rounded-xl shadow-lg max-w-lg mx-auto bg-white dark:bg-gray-800 transition-all",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xl font-bold text-gray-800 dark:text-white",
                children: "Identity Verification"
            }, void 0, false, {
                fileName: "[project]/src/components/CameraCapture.tsx",
                lineNumber: 138,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 ${verificationStatus === 'success' ? 'border-green-500' : verificationStatus === 'failed' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`,
                children: [
                    !isStreaming && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-black/80 text-white",
                        children: [
                            verificationStatus === 'success' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-green-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-4xl",
                                        children: "✓"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 151,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 font-semibold",
                                        children: verificationMessage
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 152,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm opacity-75 mt-1",
                                        children: "Image discarded for privacy."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 153,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/CameraCapture.tsx",
                                lineNumber: 150,
                                columnNumber: 29
                            }, this) : verificationStatus === 'failed' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-red-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-4xl",
                                        children: "⚠"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 157,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 font-semibold",
                                        children: verificationMessage
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 158,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: startCamera,
                                        className: "mt-4 px-4 py-2 bg-white text-red-600 rounded-full text-sm font-bold hover:bg-gray-200",
                                        children: "Try Again"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 159,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/CameraCapture.tsx",
                                lineNumber: 156,
                                columnNumber: 29
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm opacity-90 max-w-xs mx-auto",
                                        children: "Instant camera-only verification. No uploads allowed. Images are processed in memory and immediately deleted."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 168,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: startCamera,
                                        disabled: isLoading,
                                        className: "px-6 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-700 transition disabled:opacity-50",
                                        children: isLoading ? 'Starting...' : 'Enable Camera'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/CameraCapture.tsx",
                                        lineNumber: 172,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/CameraCapture.tsx",
                                lineNumber: 167,
                                columnNumber: 29
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 text-red-500 bg-black/90 px-3 py-1 rounded",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/src/components/CameraCapture.tsx",
                                lineNumber: 183,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/CameraCapture.tsx",
                        lineNumber: 148,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                        ref: videoRef,
                        className: "w-full h-full object-cover",
                        playsInline: true,
                        muted: true,
                        autoPlay: true
                    }, void 0, false, {
                        fileName: "[project]/src/components/CameraCapture.tsx",
                        lineNumber: 188,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/CameraCapture.tsx",
                lineNumber: 142,
                columnNumber: 13
            }, this),
            isStreaming && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-3 w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: captureAndVerify,
                        disabled: isLoading,
                        className: "w-full px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg transition transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed",
                        children: isLoading ? 'Verifying...' : 'Verify Identity'
                    }, void 0, false, {
                        fileName: "[project]/src/components/CameraCapture.tsx",
                        lineNumber: 199,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-400",
                        children: "By verifying, you confirm this is your real photo."
                    }, void 0, false, {
                        fileName: "[project]/src/components/CameraCapture.tsx",
                        lineNumber: 206,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/CameraCapture.tsx",
                lineNumber: 198,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                className: "hidden"
            }, void 0, false, {
                fileName: "[project]/src/components/CameraCapture.tsx",
                lineNumber: 212,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/CameraCapture.tsx",
        lineNumber: 137,
        columnNumber: 9
    }, this);
}
_s(CameraCapture, "1sOI5C+9Bhub8LRM9PNvLd6pOOI=");
_c = CameraCapture;
var _c;
__turbopack_context__.k.register(_c, "CameraCapture");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ProfileForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProfileForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/device-id.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function ProfileForm({ onProfileComplete }) {
    _s();
    const [nickname, setNickname] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [bio, setBio] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [deviceId, setDeviceId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileForm.useEffect": ()=>{
            // Load device ID and check for existing profile
            const loadProfile = {
                "ProfileForm.useEffect.loadProfile": async ()=>{
                    const id = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateDeviceId"])();
                    setDeviceId(id);
                    try {
                        // Use relative path for proxy
                        const res = await fetch(`/api/v1/profiles/${id}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.nickname) setNickname(data.nickname);
                            if (data.bio) setBio(data.bio);
                        }
                    } catch (err) {
                        console.error("Failed to load profile", err);
                    }
                }
            }["ProfileForm.useEffect.loadProfile"];
            loadProfile();
        }
    }["ProfileForm.useEffect"], []);
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!deviceId) return;
        setIsLoading(true);
        setStatus(null);
        try {
            const res = await fetch('/api/v1/profiles', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    device_id: deviceId,
                    nickname: nickname.trim(),
                    bio: bio.trim()
                })
            });
            if (!res.ok) throw new Error('Failed to save profile');
            setStatus('Profile saved successfully!');
            setStatus('Profile saved successfully!');
            console.log("Calling onProfileComplete immediately");
            onProfileComplete(); // Immediate call for debugging
        } catch (err) {
            setStatus('Error saving profile. Please try again.');
            console.error(err);
        } finally{
            setIsLoading(false);
        }
    };
    const handleClear = async ()=>{
        if (!deviceId || !confirm("Are you sure you want to clear your profile data?")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/profiles/${deviceId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to clear profile');
            setNickname('');
            setBio('');
            setStatus('Profile data cleared.');
        } catch (err) {
            setStatus('Error clearing data.');
        } finally{
            setIsLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xl font-bold mb-2 text-gray-900 dark:text-gray-100",
                children: "Setup Profile"
            }, void 0, false, {
                fileName: "[project]/src/components/ProfileForm.tsx",
                lineNumber: 91,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-gray-500 dark:text-gray-400 mb-6",
                children: "Your nickname is temporary. No profile pictures are allowed for privacy."
            }, void 0, false, {
                fileName: "[project]/src/components/ProfileForm.tsx",
                lineNumber: 92,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit,
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-xs font-semibold uppercase text-gray-500 mb-1",
                                children: "Nickname"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProfileForm.tsx",
                                lineNumber: 98,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: nickname,
                                onChange: (e)=>setNickname(e.target.value),
                                placeholder: "e.g. MysteryWalker",
                                maxLength: 50,
                                required: true,
                                className: "w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProfileForm.tsx",
                                lineNumber: 99,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ProfileForm.tsx",
                        lineNumber: 97,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-xs font-semibold uppercase text-gray-500 mb-1",
                                children: "Short Bio (Optional)"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProfileForm.tsx",
                                lineNumber: 111,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                value: bio,
                                onChange: (e)=>setBio(e.target.value),
                                placeholder: "Just here to chat...",
                                maxLength: 200,
                                rows: 3,
                                className: "w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProfileForm.tsx",
                                lineNumber: 112,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ProfileForm.tsx",
                        lineNumber: 110,
                        columnNumber: 17
                    }, this),
                    status && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: `text-sm text-center font-medium ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`,
                        children: status
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProfileForm.tsx",
                        lineNumber: 123,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3 pt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                disabled: isLoading || !nickname.trim(),
                                className: "flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95",
                                children: isLoading ? 'Saving...' : 'Continue'
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProfileForm.tsx",
                                lineNumber: 129,
                                columnNumber: 21
                            }, this),
                            nickname && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleClear,
                                disabled: isLoading,
                                className: "px-4 py-3 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition",
                                title: "Clear Profile Data",
                                children: "Clear"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProfileForm.tsx",
                                lineNumber: 137,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ProfileForm.tsx",
                        lineNumber: 128,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ProfileForm.tsx",
                lineNumber: 96,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ProfileForm.tsx",
        lineNumber: 90,
        columnNumber: 9
    }, this);
}
_s(ProfileForm, "AmvAs4colqFzVwO1d4I550xrUkM=");
_c = ProfileForm;
var _c;
__turbopack_context__.k.register(_c, "ProfileForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/socket.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "disconnectSocket",
    ()=>disconnectSocket,
    "getSocket",
    ()=>getSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
;
// Direct connection to backend (local dev)
const SOCKET_URL = 'http://localhost:8000';
let socket = null;
const getSocket = ()=>{
    if (!socket) {
        // Initialize socket only when requested
        // Auto-connect is true by default, but we might want to control it
        // We will pass auth in connect logic or here if we have it globally
        socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(SOCKET_URL, {
            path: '/socket.io',
            autoConnect: false,
            transports: [
                'websocket',
                'polling'
            ]
        });
    }
    return socket;
};
const disconnectSocket = ()=>{
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/MatchingQueue.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MatchingQueue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/socket.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/device-id.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function MatchingQueue({ onMatchFound, autoJoin = false, initialPreference = 'any', onPreferenceSelect }) {
    _s();
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Connecting...');
    const [preference, setPreference] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialPreference);
    // Track if we have already triggered auto-join to prevent double emits
    const autoJoinedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MatchingQueue.useEffect": ()=>{
            const connectAndJoin = {
                "MatchingQueue.useEffect.connectAndJoin": async ()=>{
                    const deviceId = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateDeviceId"])();
                    const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
                    if (!socket.connected) {
                        socket.auth = {
                            device_id: deviceId
                        };
                        socket.connect();
                    }
                    const handleConnect = {
                        "MatchingQueue.useEffect.connectAndJoin.handleConnect": ()=>{
                            if (autoJoin && !autoJoinedRef.current) {
                                setStatus(`Auto-joining queue for ${initialPreference}...`);
                                socket.emit('join_queue', {
                                    preference: initialPreference
                                });
                                autoJoinedRef.current = true;
                            } else {
                                setStatus('Select a preference');
                            }
                        }
                    }["MatchingQueue.useEffect.connectAndJoin.handleConnect"];
                    if (socket.connected) {
                        handleConnect();
                    } else {
                        socket.on('connect', handleConnect);
                    }
                    socket.on('connect_error', {
                        "MatchingQueue.useEffect.connectAndJoin": (err)=>{
                            setStatus(`Connection error: ${err.message}`);
                        }
                    }["MatchingQueue.useEffect.connectAndJoin"]);
                    socket.on('queue_status', {
                        "MatchingQueue.useEffect.connectAndJoin": (data)=>{
                            setStatus('Searching for a partner...');
                        }
                    }["MatchingQueue.useEffect.connectAndJoin"]);
                    socket.on('match_found', {
                        "MatchingQueue.useEffect.connectAndJoin": (data)=>{
                            setStatus('Match Found!');
                            setTimeout({
                                "MatchingQueue.useEffect.connectAndJoin": ()=>{
                                    onMatchFound(data);
                                }
                            }["MatchingQueue.useEffect.connectAndJoin"], 1000);
                        }
                    }["MatchingQueue.useEffect.connectAndJoin"]);
                    socket.on('error', {
                        "MatchingQueue.useEffect.connectAndJoin": (data)=>{
                            setStatus(`Error: ${data.message}`);
                        }
                    }["MatchingQueue.useEffect.connectAndJoin"]);
                    return ({
                        "MatchingQueue.useEffect.connectAndJoin": ()=>{
                            socket.off('connect', handleConnect);
                            socket.off('connect_error');
                            socket.off('queue_status');
                            socket.off('match_found');
                            socket.off('error');
                        }
                    })["MatchingQueue.useEffect.connectAndJoin"];
                }
            }["MatchingQueue.useEffect.connectAndJoin"];
            connectAndJoin();
            return ({
                "MatchingQueue.useEffect": ()=>{
                // Cleanup handled by logic flow
                }
            })["MatchingQueue.useEffect"];
        }
    }["MatchingQueue.useEffect"], [
        onMatchFound,
        autoJoin,
        initialPreference
    ]);
    const handleJoin = (pref)=>{
        setPreference(pref);
        if (onPreferenceSelect) {
            onPreferenceSelect(pref);
        }
        setStatus(`Searching for ${pref}...`);
        const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
        socket.emit('join_queue', {
            preference: pref
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center animate-pulse",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-4xl",
                            children: "🔍"
                        }, void 0, false, {
                            fileName: "[project]/src/components/MatchingQueue.tsx",
                            lineNumber: 101,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/MatchingQueue.tsx",
                        lineNumber: 100,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "absolute top-0 left-0 w-24 h-24 bg-blue-500 rounded-full animate-ping opacity-25"
                    }, void 0, false, {
                        fileName: "[project]/src/components/MatchingQueue.tsx",
                        lineNumber: 104,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/MatchingQueue.tsx",
                lineNumber: 99,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-gray-900 dark:text-white",
                        children: status
                    }, void 0, false, {
                        fileName: "[project]/src/components/MatchingQueue.tsx",
                        lineNumber: 108,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-500 dark:text-gray-400",
                        children: "Finding someone compatible with you..."
                    }, void 0, false, {
                        fileName: "[project]/src/components/MatchingQueue.tsx",
                        lineNumber: 109,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/MatchingQueue.tsx",
                lineNumber: 107,
                columnNumber: 13
            }, this),
            status === 'Select a preference' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleJoin('female'),
                        className: "px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-semibold transition shadow-lg",
                        children: "Female"
                    }, void 0, false, {
                        fileName: "[project]/src/components/MatchingQueue.tsx",
                        lineNumber: 114,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleJoin('male'),
                        className: "px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition shadow-lg",
                        children: "Male"
                    }, void 0, false, {
                        fileName: "[project]/src/components/MatchingQueue.tsx",
                        lineNumber: 117,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleJoin('any'),
                        className: "px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-full font-semibold transition shadow-lg",
                        children: "Anyone"
                    }, void 0, false, {
                        fileName: "[project]/src/components/MatchingQueue.tsx",
                        lineNumber: 120,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/MatchingQueue.tsx",
                lineNumber: 113,
                columnNumber: 17
            }, this),
            status.startsWith('Searching') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>{
                    window.location.reload(); // Simplest cancel for MVP
                },
                className: "text-red-500 hover:text-red-700 font-medium text-sm",
                children: "Cancel"
            }, void 0, false, {
                fileName: "[project]/src/components/MatchingQueue.tsx",
                lineNumber: 128,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/MatchingQueue.tsx",
        lineNumber: 98,
        columnNumber: 9
    }, this);
}
_s(MatchingQueue, "iFvYoV0B7ysOipbcX6nmBmUyfTg=");
_c = MatchingQueue;
var _c;
__turbopack_context__.k.register(_c, "MatchingQueue");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ChatInterface.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ChatInterface
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/socket.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/device-id.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function ChatInterface({ sessionData, onLeave, onNext }) {
    _s();
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [myId, setMyId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [partnerLeft, setPartnerLeft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Auto-scroll ref
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [partnerTyping, setPartnerTyping] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const typingTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatInterface.useEffect": ()=>{
            const init = {
                "ChatInterface.useEffect.init": async ()=>{
                    const id = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateDeviceId"])();
                    setMyId(id);
                    const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
                    // CRITICAL: Join the session room to receive messages
                    // The person who triggered the match is added by server, but the partner MUST join explicitly.
                    socket.emit('join_session', {
                        session_id: sessionData.session_id
                    });
                    socket.on('new_message', {
                        "ChatInterface.useEffect.init": (data)=>{
                            setPartnerTyping(false); // Clear typing when message received
                            setMessages({
                                "ChatInterface.useEffect.init": (prev)=>[
                                        ...prev,
                                        {
                                            id: Date.now().toString(),
                                            sender_id: data.sender_id,
                                            content: data.content,
                                            timestamp: data.timestamp,
                                            isMe: data.sender_id === id
                                        }
                                    ]
                            }["ChatInterface.useEffect.init"]);
                        }
                    }["ChatInterface.useEffect.init"]);
                    socket.on('partner_left', {
                        "ChatInterface.useEffect.init": ()=>{
                            setPartnerLeft(true);
                            setPartnerTyping(false);
                        }
                    }["ChatInterface.useEffect.init"]);
                    socket.on('partner_typing', {
                        "ChatInterface.useEffect.init": (data)=>{
                            setPartnerTyping(data.is_typing);
                        }
                    }["ChatInterface.useEffect.init"]);
                    socket.on('disconnect', {
                        "ChatInterface.useEffect.init": ()=>{
                            setIsConnected(false);
                        }
                    }["ChatInterface.useEffect.init"]);
                    socket.on('connect', {
                        "ChatInterface.useEffect.init": ()=>{
                            setIsConnected(true);
                            // Re-join on reconnect
                            socket.emit('join_session', {
                                session_id: sessionData.session_id
                            });
                        }
                    }["ChatInterface.useEffect.init"]);
                }
            }["ChatInterface.useEffect.init"];
            // Load persisted messages
            const saved = sessionStorage.getItem(`chat_${sessionData.session_id}`);
            if (saved) {
                try {
                    setMessages(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse saved chat", e);
                }
            }
            init();
            return ({
                "ChatInterface.useEffect": ()=>{
                    const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
                    socket.off('new_message');
                    socket.off('partner_left');
                    socket.off('partner_typing');
                    socket.off('disconnect');
                    socket.off('connect');
                }
            })["ChatInterface.useEffect"];
        }
    }["ChatInterface.useEffect"], [
        sessionData.session_id
    ]);
    // Scroll to bottom & Persist
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChatInterface.useEffect": ()=>{
            messagesEndRef.current?.scrollIntoView({
                behavior: 'smooth'
            });
            // Persist to session storage
            if (messages.length > 0) {
                sessionStorage.setItem(`chat_${sessionData.session_id}`, JSON.stringify(messages));
            }
        }
    }["ChatInterface.useEffect"], [
        messages,
        partnerTyping,
        sessionData.session_id
    ]);
    const handleInputChange = (e)=>{
        setInput(e.target.value);
        const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
        // Emit typing start
        socket.emit('typing_start', {
            session_id: sessionData.session_id
        });
        // Debounce stop
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(()=>{
            socket.emit('typing_stop', {
                session_id: sessionData.session_id
            });
        }, 1500);
    };
    const handleSend = (e)=>{
        e.preventDefault();
        if (!input.trim()) return;
        const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
        socket.emit('send_message', {
            session_id: sessionData.session_id,
            content: input.trim()
        });
        // Stop typing immediately on send
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', {
            session_id: sessionData.session_id
        });
        setInput('');
    };
    const handleLeave = ()=>{
        const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
        socket.emit('leave_chat', {
            session_id: sessionData.session_id
        });
        sessionStorage.removeItem(`chat_${sessionData.session_id}`);
        onLeave();
    };
    // Also clear on "Next Match" (handled by parent onNext usually, but good to clean here OR parent)
    // We'll wrap onNext to clear storage
    const handleNext = ()=>{
        sessionStorage.removeItem(`chat_${sessionData.session_id}`);
        onNext();
    };
    const handleReport = ()=>{
        const reason = prompt("Why are you reporting this user?");
        if (reason) {
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$socket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSocket"])();
            socket.emit('report_user', {
                session_id: sessionData.session_id,
                reason: reason,
                reported_device_id: sessionData.partner.device_id
            });
            alert("Report submitted.");
            handleLeave();
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-lg h-[90vh] md:h-[600px] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `w-2 h-2 rounded-full ${partnerLeft ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ChatInterface.tsx",
                                        lineNumber: 174,
                                        columnNumber: 25
                                    }, this),
                                    sessionData.partner.nickname || "Stranger"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ChatInterface.tsx",
                                lineNumber: 173,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400",
                                children: "Encrypted • Ephemeral"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatInterface.tsx",
                                lineNumber: 177,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 172,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleReport,
                                className: "text-gray-400 hover:text-red-500 transition",
                                title: "Report",
                                children: "🚩"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatInterface.tsx",
                                lineNumber: 180,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleLeave,
                                className: "text-gray-400 hover:text-red-500 transition font-bold",
                                title: "Leave",
                                children: "✕"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatInterface.tsx",
                                lineNumber: 183,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 179,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ChatInterface.tsx",
                lineNumber: 171,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 dark:bg-gray-950/50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center text-xs text-gray-400 my-4",
                        children: "Session Started. Say hi! 👋"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 192,
                        columnNumber: 17
                    }, this),
                    messages.map((msg, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `flex ${msg.isMe ? 'justify-end' : 'justify-start'}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `max-w-[75%] p-3 rounded-2xl text-sm shadow-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'}`,
                                children: msg.content
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatInterface.tsx",
                                lineNumber: 198,
                                columnNumber: 25
                            }, this)
                        }, idx, false, {
                            fileName: "[project]/src/components/ChatInterface.tsx",
                            lineNumber: 197,
                            columnNumber: 21
                        }, this)),
                    partnerTyping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-start animate-in fade-in slide-in-from-bottom-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gray-200 dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none text-xs text-gray-500 flex gap-1 items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ChatInterface.tsx",
                                    lineNumber: 210,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ChatInterface.tsx",
                                    lineNumber: 211,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ChatInterface.tsx",
                                    lineNumber: 212,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ChatInterface.tsx",
                            lineNumber: 209,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 208,
                        columnNumber: 21
                    }, this),
                    partnerLeft && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-4 space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-500 text-sm",
                                children: "Partner left the chat."
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatInterface.tsx",
                                lineNumber: 219,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleNext,
                                className: "px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-blue-700 transition",
                                children: "Find Next Match ➔"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ChatInterface.tsx",
                                lineNumber: 220,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 218,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: messagesEndRef
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 225,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ChatInterface.tsx",
                lineNumber: 190,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSend,
                className: "p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: input,
                        onChange: handleInputChange,
                        placeholder: partnerLeft ? "Session ended." : "Type a message...",
                        disabled: partnerLeft,
                        className: "flex-1 p-3 rounded-full bg-gray-100 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 230,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        disabled: !input.trim() || partnerLeft,
                        className: "p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:scale-95 transition shadow-md w-12 h-12 flex items-center justify-center transform active:scale-95",
                        children: "➤"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ChatInterface.tsx",
                        lineNumber: 238,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ChatInterface.tsx",
                lineNumber: 229,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ChatInterface.tsx",
        lineNumber: 169,
        columnNumber: 9
    }, this);
}
_s(ChatInterface, "suLh0hRXeuYKAFkkKykqvDJQijw=");
_c = ChatInterface;
var _c;
__turbopack_context__.k.register(_c, "ChatInterface");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/Dashboard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Dashboard({ onStartChat, onEditProfile }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-8 pb-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-center relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Dashboard.tsx",
                        lineNumber: 13,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-3xl font-extrabold text-white mb-2 relative z-10",
                        children: "Welcome to Klymo"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Dashboard.tsx",
                        lineNumber: 15,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-blue-100 relative z-10",
                        children: "Your space to connect and vibe."
                    }, void 0, false, {
                        fileName: "[project]/src/components/Dashboard.tsx",
                        lineNumber: 18,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Dashboard.tsx",
                lineNumber: 12,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-6 -mt-8 relative z-20",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-500 dark:text-gray-400 mb-4",
                            children: "Ready to meet someone new?"
                        }, void 0, false, {
                            fileName: "[project]/src/components/Dashboard.tsx",
                            lineNumber: 26,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onStartChat,
                            className: "w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-lg shadow-md transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Start Matching"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Dashboard.tsx",
                                    lineNumber: 33,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "group-hover:translate-x-1 transition-transform",
                                    children: "🚀"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Dashboard.tsx",
                                    lineNumber: 34,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Dashboard.tsx",
                            lineNumber: 29,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-400 mt-3",
                            children: [
                                Math.floor(Math.random() * 500) + 120,
                                " users online now"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Dashboard.tsx",
                            lineNumber: 36,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/Dashboard.tsx",
                    lineNumber: 25,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/Dashboard.tsx",
                lineNumber: 24,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4",
                        children: "Daily Activities"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Dashboard.tsx",
                        lineNumber: 44,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition cursor-pointer group",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl mb-2 group-hover:scale-110 transition-transform",
                                        children: "🗳️"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Dashboard.tsx",
                                        lineNumber: 49,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: "font-bold text-sm text-gray-800 dark:text-gray-200",
                                        children: "Daily Poll"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Dashboard.tsx",
                                        lineNumber: 50,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-400",
                                        children: "Vote on today's topic"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Dashboard.tsx",
                                        lineNumber: 51,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Dashboard.tsx",
                                lineNumber: 48,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition cursor-pointer group",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl mb-2 group-hover:scale-110 transition-transform",
                                        children: "🎭"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Dashboard.tsx",
                                        lineNumber: 54,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: "font-bold text-sm text-gray-800 dark:text-gray-200",
                                        children: "Mood Check"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Dashboard.tsx",
                                        lineNumber: 55,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-400",
                                        children: "How are you feeling?"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Dashboard.tsx",
                                        lineNumber: 56,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Dashboard.tsx",
                                lineNumber: 53,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Dashboard.tsx",
                        lineNumber: 47,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onEditProfile,
                            className: "text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition underline underline-offset-4",
                            children: "Edit Profile"
                        }, void 0, false, {
                            fileName: "[project]/src/components/Dashboard.tsx",
                            lineNumber: 61,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Dashboard.tsx",
                        lineNumber: 60,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Dashboard.tsx",
                lineNumber: 43,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Dashboard.tsx",
        lineNumber: 10,
        columnNumber: 9
    }, this);
}
_c = Dashboard;
var _c;
__turbopack_context__.k.register(_c, "Dashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/device-id.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CameraCapture$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/CameraCapture.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProfileForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ProfileForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$MatchingQueue$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/MatchingQueue.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ChatInterface$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ChatInterface.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Dashboard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Dashboard.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function Home() {
    _s();
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('verification');
    const [chatSession, setChatSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null); // To store session data
    const [lastPreference, setLastPreference] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('any');
    const [isAutoJoining, setIsAutoJoining] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Initialize Device ID silently on load
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$device$2d$id$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateDeviceId"])().catch(console.error);
        }
    }["Home.useEffect"], []);
    // Callback when CameraCapture successfully verifies
    const handleVerificationSuccess = ()=>{
        setStep('profile');
    };
    // Callback when Profile is saved
    const handleProfileComplete = ()=>{
        console.log("Setting step to home");
        setStep('home');
    };
    const handleStartChat = ()=>{
        setIsAutoJoining(false); // Reset auto join state when starting fresh
        setStep('chat');
    };
    const handleMatchFound = (sessionData)=>{
        setChatSession(sessionData);
        setIsAutoJoining(false); // Clear auto-join flag once matched
    };
    const handleLeaveChat = ()=>{
        setChatSession(null);
        setIsAutoJoining(false);
        // Return to dashboard after chat? or Queue? 
        // Usually dashboard is better UX to take a break.
        setStep('home');
    };
    const handleNextMatch = ()=>{
        // Leave current chat and immediately queue again with same preference
        setChatSession(null);
        setIsAutoJoining(true);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-lg",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full text-center sm:text-left",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold mb-2",
                        children: "Klymo"
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 60,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full transition-all duration-500",
                    children: [
                        step === 'verification' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CameraCapture$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            onCapture: handleVerificationSuccess
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 66,
                            columnNumber: 13
                        }, this),
                        step === 'profile' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ProfileForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            onProfileComplete: handleProfileComplete
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 70,
                            columnNumber: 13
                        }, this),
                        step === 'home' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Dashboard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            onStartChat: handleStartChat,
                            onEditProfile: ()=>setStep('profile')
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 74,
                            columnNumber: 13
                        }, this),
                        step === 'chat' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                !chatSession ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$MatchingQueue$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    onMatchFound: handleMatchFound,
                                    autoJoin: isAutoJoining,
                                    initialPreference: lastPreference,
                                    onPreferenceSelect: setLastPreference
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 83,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ChatInterface$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    sessionData: chatSession,
                                    onLeave: handleLeaveChat,
                                    onNext: handleNextMatch
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 90,
                                    columnNumber: 17
                                }, this),
                                !chatSession && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-8 text-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setStep('home'),
                                        className: "text-sm text-gray-500 hover:underline",
                                        children: "Back to Dashboard"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 99,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 98,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 64,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 59,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_s(Home, "7OMLKXV8mr5PmZ2sD7/2sNuR1ys=");
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_a241ec6c._.js.map