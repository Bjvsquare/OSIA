// ═══════════════════════════════════════════════════════════
// WebcamCapture — Camera stream for selfie capture
// ═══════════════════════════════════════════════════════════

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RotateCcw, Check, X } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export function WebcamCapture({ onCapture, onCancel }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Start camera stream
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsReady(true);
          };
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera permissions and try again.');
        console.error('[WebcamCapture] Camera error:', err);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image for selfie view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    // Stop the camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const handleCapture = useCallback(() => {
    // 3-second countdown
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        setCountdown(null);
        captureFrame();
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [captureFrame]);

  const handleRetake = useCallback(async () => {
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError('Failed to restart camera');
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedImage) onCapture(capturedImage);
  }, [capturedImage, onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-red-400 text-sm text-center">{error}</div>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera Preview / Captured Image */}
      <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden border border-cyan-500/20 bg-black">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {/* Countdown overlay */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                >
                  <span className="text-7xl font-black text-cyan-400 drop-shadow-lg">
                    {countdown}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Face guide overlay */}
            {isReady && countdown === null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 border-2 border-cyan-500/30 rounded-full" />
              </div>
            )}
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured selfie"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!capturedImage ? (
          <>
            <button
              onClick={onCancel}
              className="p-3 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.button
              onClick={handleCapture}
              disabled={!isReady || countdown !== null}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-5 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 border-2 border-cyan-500/40 text-cyan-400 hover:border-cyan-400/60 transition-colors disabled:opacity-30"
            >
              <Camera className="w-7 h-7" />
            </motion.button>
            <div className="w-11" /> {/* Spacer for centering */}
          </>
        ) : (
          <>
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <motion.button
              onClick={handleConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-bold hover:bg-cyan-500/30 transition-colors"
            >
              <Check className="w-4 h-4" />
              Use Photo
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
