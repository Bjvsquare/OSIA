import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, RotateCcw, X, Check } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   CameraCapture — Browser camera component for KYC
   
   Uses getUserMedia API for live camera capture.
   Falls back to file upload if camera unavailable.
   Captures as Blob for form upload.
   ═══════════════════════════════════════════════════════════ */

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
    instructions?: string;
    captureLabel?: string;
}

export function CameraCapture({ onCapture, onCancel, instructions, captureLabel = 'Capture Photo' }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = useCallback(async (facing: 'user' | 'environment') => {
        // Stop any existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 960 }
                },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraReady(true);
                setCameraError(null);
            }
        } catch (err: any) {
            console.warn('[Camera] Failed to access camera:', err.message);
            setCameraError('Camera not available. Please use the upload option instead.');
            setCameraReady(false);
        }
    }, []);

    useEffect(() => {
        startCamera(facingMode);
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [facingMode]);

    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror for front camera
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
    }, [facingMode]);

    const handleAccept = useCallback(() => {
        if (!capturedImage) return;

        // Convert data URL to File
        const byteString = atob(capturedImage.split(',')[1]);
        const mimeType = 'image/jpeg';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: mimeType });
        onCapture(file);
    }, [capturedImage, onCapture]);

    const handleRetake = useCallback(() => {
        setCapturedImage(null);
    }, []);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onCapture(file);
    }, [onCapture]);

    const toggleCamera = useCallback(() => {
        setCapturedImage(null);
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    return (
        <div className="space-y-4">
            {/* Instructions */}
            {instructions && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200">
                    {instructions}
                </div>
            )}

            {/* Camera View / Captured Image */}
            <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 aspect-[4/3]">
                {!capturedImage ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {!cameraReady && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-osia-neutral-400 text-sm animate-pulse">Initializing camera...</div>
                            </div>
                        )}
                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                                <Camera className="w-12 h-12 text-osia-neutral-500" />
                                <p className="text-sm text-osia-neutral-400 text-center">{cameraError}</p>
                            </div>
                        )}

                        {/* Viewfinder overlay */}
                        {cameraReady && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-[15%] border-2 border-white/20 rounded-xl" />
                                <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <span className="text-xs text-white/50 bg-black/40 px-3 py-1 rounded-full">
                                        Position your document within the frame
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="flex gap-3">
                {!capturedImage ? (
                    <>
                        <button
                            onClick={onCancel}
                            className="flex-shrink-0 px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {cameraReady && (
                            <>
                                <button
                                    onClick={handleCapture}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-osia-teal-500 to-osia-teal-600 rounded-xl transition-all shadow-lg shadow-osia-teal-500/20"
                                >
                                    <Camera className="w-4 h-4" />
                                    {captureLabel}
                                </button>
                                <button
                                    onClick={toggleCamera}
                                    className="flex-shrink-0 px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                                    title="Switch camera"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {/* Upload fallback */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-osia-neutral-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleRetake}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retake
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl transition-all shadow-lg shadow-green-500/20"
                        >
                            <Check className="w-4 h-4" />
                            Use This Photo
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
