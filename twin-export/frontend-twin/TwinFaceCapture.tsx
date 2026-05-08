import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, AlertCircle } from 'lucide-react';
import { WebcamCapture } from './components/WebcamCapture';
import { useTwinStore } from './store/twinStore';

interface TwinFaceCaptureProps {
  onImageSelected: () => void;
}

export function TwinFaceCapture({ onImageSelected }: TwinFaceCaptureProps) {
  const [mode, setMode] = useState<'choose' | 'webcam'>('choose');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setSourceImage, state } = useTwinStore();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirmPhoto = useCallback(() => {
    if (preview) {
      setSourceImage(preview);
      onImageSelected();
    }
  }, [preview, setSourceImage, onImageSelected]);

  const handleWebcamCapture = useCallback((dataUrl: string) => {
    setPreview(dataUrl);
    setMode('choose');
  }, []);

  if (mode === 'webcam') {
    return (
      <div className="w-full min-h-[calc(100vh-7rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <WebcamCapture onCapture={handleWebcamCapture} onCancel={() => setMode('choose')} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-7rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/70">
            Create Your Twin Face
          </h2>
          <p className="text-sm text-white/40">
            Upload a clear face photo or take one now. We'll turn it into your plexus portrait.
          </p>
        </div>

        {/* Error display */}
        {state.error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">{state.error}</p>
          </motion.div>
        )}

        {/* Preview */}
        {preview ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-cyan-500/20">
              <img src={preview} alt="Face preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-2xl pointer-events-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPreview(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wider hover:text-white hover:border-white/20 transition-colors">
                Change Photo
              </button>
              <motion.button onClick={handleConfirmPhoto}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-colors">
                Generate Twin
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Upload / Webcam options */
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'rgba(56, 163, 165, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-cyan-500/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-white/50 group-hover:text-white/70 transition-colors">
                Upload photo
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'rgba(56, 163, 165, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('webcam')}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-cyan-500/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
                <Camera className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-white/50 group-hover:text-white/70 transition-colors">
                Use webcam
              </span>
            </motion.button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={handleFileUpload} />
      </motion.div>
    </div>
  );
}
