import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboarding } from '../../context/OnboardingContext';
import { useAuth } from '../../../auth/AuthContext';
import { emotionHierarchy } from './emotionHierarchy';
import { PsychologicalState, SubEmotion } from './types';
import { slideInFromBottom } from './animationVariants';

interface EmotionIntensityWithVoiceProps {
  emotion: SubEmotion;
  parentState: PsychologicalState;
  onSave: (data: { emotion: SubEmotion; intensity: number; context: string }) => void;
  onBack: () => void;
}

export const EmotionIntensityWithVoice: React.FC<EmotionIntensityWithVoiceProps> = ({
  emotion,
  parentState,
  onSave,
  onBack
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch } = useOnboarding();
  const { refreshProfile, auth } = useAuth();
  const [intensity, setIntensity] = useState(50);
  const [context, setContext] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get parent state and emotion from URL if not provided
  const parent = (searchParams.get('parent') as PsychologicalState) || parentState;
  const emotioniId = (searchParams.get('emotion') as SubEmotion) || emotion;
  const parentConfig = emotionHierarchy[parent];

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceAvailable(!!SpeechRecognition);

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      } else if (e.key === 'Enter') {
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleRecordClick = async () => {
    if (!voiceAvailable) {
      alert('Voice recognition not available on this browser');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Stop stream
        stream.getTracks().forEach(track => track.stop());

        // Use Web Speech API for transcription
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
              }
            }
            if (finalTranscript) {
              setTranscript(finalTranscript.trim());
              setContext(finalTranscript.trim());
            }
          };

          recognition.start();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 10000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSkip = () => {
    setContext('');
    handleSave();
  };

  const handleSave = async () => {
    onSave({
      emotion: emotioniId,
      intensity,
      context
    });

    const token = auth.token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Save check-in
      const checkInResponse = await fetch('/api/check-ins/quick', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          emotion: emotioniId,
          energy_level: intensity,
          context
        })
      });

      if (!checkInResponse.ok) {
        // Don't block user - log and continue
        console.warn('Check-in save failed, continuing anyway');
      }

      // Mark onboarding complete on server
      try {
        await fetch('/api/users/complete-onboarding', {
          method: 'POST',
          headers
        });
      } catch (err) {
        console.warn('Could not mark onboarding complete:', err);
      }

      // Mark onboarding as completed locally
      dispatch({
        type: 'COMPLETE_STAGE',
        payload: { stageId: 'INITIAL_CHECK_IN' }
      });

      // Refresh auth profile to pick up onboardingCompleted flag
      await refreshProfile();

      // Navigate to home
      navigate('/home');
    } catch (error) {
      console.error('Error saving check-in:', error);
      // Even on error, allow user to proceed - don't block the flow
      navigate('/home');
    }
  };

  const handleBack = () => {
    onBack();
    navigate(`/onboarding/emotion/level2?parent=${parent}`);
  };

  // Calculate intensity color gradient
  const getIntensityColor = () => {
    if (intensity < 25) return '#ff6b6b';
    if (intensity < 50) return '#ffa500';
    if (intensity < 75) return '#ffd93d';
    return '#00d4ff';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#0d1f3d] to-[#0a1128] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={handleBack}
          className="absolute top-0 left-0 text-gray-400 hover:text-white transition-colors z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        {/* Breadcrumb */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-12 text-sm text-gray-400"
          variants={slideInFromBottom}
          initial="hidden"
          animate="visible"
        >
          <span>{parent}</span>
          <span>›</span>
          <span>{emotioniId}</span>
        </motion.div>

        <div className="text-center">
          {/* Title */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            How intense?
          </motion.h1>

          {/* Intensity Slider Section */}
          <motion.div
            className="mt-12 mb-12"
            variants={slideInFromBottom}
            initial="hidden"
            animate="visible"
          >
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-4">
                Intensity Level
              </label>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ff6b6b 0%, #ffa500 33%, #ffd93d 66%, #00d4ff 100%)`
                }}
              />

              {/* Labels */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Mild</span>
                <span>Intense</span>
              </div>
            </div>

            {/* Intensity Display */}
            <motion.div
              className="text-center"
              key={intensity}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <div className="text-5xl font-bold" style={{ color: getIntensityColor() }}>
                {intensity}%
              </div>
            </motion.div>
          </motion.div>

          {/* Voice Input Section */}
          <motion.div
            className="border border-gray-700 rounded-lg p-8 bg-gray-900 bg-opacity-50 backdrop-blur"
            variants={slideInFromBottom}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-300 text-sm font-medium mb-6">
              What triggered this?
            </label>

            {/* Voice Button */}
            {voiceAvailable && (
              <motion.button
                onClick={handleRecordClick}
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${
                  isRecording
                    ? 'bg-red-500 ring-4 ring-red-300'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.7 2.36-2.2 0-4.23-.9-5.7-2.36m11-4.04V19c0 .55-.45 1-1 1h-2v2h-2v-2h-2v-2c0-.55.45-1 1-1h6c.55 0 1-.45 1-1z" />
                </svg>
              </motion.button>
            )}

            {isRecording && (
              <motion.div
                className="text-center text-red-400 text-sm mb-4"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Recording... (max 10 seconds)
              </motion.div>
            )}

            {/* Transcript Display */}
            {transcript && (
              <motion.div
                className="bg-gray-800 rounded p-4 mb-4 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-gray-300 text-sm italic">"{transcript}"</p>
              </motion.div>
            )}

            {/* Text Input as Fallback */}
            <div className="mb-6">
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, 200))}
                placeholder={voiceAvailable ? 'Or type if you prefer...' : 'Share what triggered this...'}
                maxLength={200}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm"
                rows={3}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {context.length}/200
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex gap-4 mt-8 justify-center flex-wrap"
            variants={slideInFromBottom}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleSkip}
              className="px-6 py-2 text-gray-400 hover:text-gray-300 border border-gray-600 rounded transition-colors"
            >
              Skip
            </button>

            <button
              onClick={handleSave}
              className="px-8 py-2 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-white rounded font-semibold transition-all shadow-lg hover:shadow-cyan-500/50"
            >
              Save Check-in
            </button>
          </motion.div>

          {/* Helper text */}
          <motion.p
            className="text-gray-500 text-xs mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Keyboard: Escape to go back • Enter to save
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};
