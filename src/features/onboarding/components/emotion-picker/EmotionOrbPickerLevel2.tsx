import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Orb } from './Orb';
import { emotionHierarchy } from './emotionHierarchy';
import { PsychologicalState, SubEmotion } from './types';
import { slideInFromBottom, fadeInStagger } from './animationVariants';

interface EmotionOrbPickerLevel2Props {
  parentState: PsychologicalState;
  onSelect: (emotion: SubEmotion) => void;
  onBack: () => void;
  initialSelected?: SubEmotion | null;
}

export const EmotionOrbPickerLevel2: React.FC<EmotionOrbPickerLevel2Props> = ({
  parentState,
  onSelect,
  onBack,
  initialSelected = null
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<SubEmotion | null>(initialSelected);
  const [showFeedback, setShowFeedback] = useState(false);

  // Get parent state from URL param if not provided via props
  const parent = (searchParams.get('parent') as PsychologicalState) || parentState;
  const parentConfig = emotionHierarchy[parent];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const numKey = parseInt(e.key, 10);
      if (numKey >= 1 && numKey <= parentConfig.subEmotions.length) {
        const emotion = parentConfig.subEmotions[numKey - 1].id as SubEmotion;
        handleEmotionSelect(emotion);
      } else if (e.key === 'Escape') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [parentConfig.subEmotions]);

  const handleEmotionSelect = (emotion: SubEmotion) => {
    setSelected(emotion);
    setShowFeedback(true);

    setTimeout(() => {
      onSelect(emotion);
      navigate(`/onboarding/emotion/level3?parent=${parent}&emotion=${emotion}`);
    }, 600);
  };

  const handleBack = () => {
    onBack();
    navigate('/onboarding/emotion/level1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#0d1f3d] to-[#0a1128] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
      </div>

      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back Button */}
        <motion.button
          onClick={handleBack}
          className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        {/* Parent State Breadcrumb */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-12"
          variants={slideInFromBottom}
          initial="hidden"
          animate="visible"
        >
          <div
            className="w-8 h-8 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${parentConfig.color}, ${parentConfig.color}dd)`,
              boxShadow: `0 0 20px ${parentConfig.color}80`
            }}
          />
          <span className="text-gray-300 text-sm">{parent}</span>
        </motion.div>

        {/* Center content */}
        <div className="flex flex-col items-center">
          {/* Title */}
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-3 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Which resonates more?
          </motion.h1>

          <motion.p
            className="text-gray-400 mb-16 text-sm md:text-base"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Narrow down your feeling
          </motion.p>

          {/* Orbs Container */}
          <motion.div
            className="flex flex-col md:flex-row gap-12 md:gap-16 items-center justify-center mb-12"
            variants={fadeInStagger}
            initial="hidden"
            animate="visible"
          >
            {parentConfig.subEmotions.map((emotion, index) => (
              <motion.div key={emotion.id} variants={fadeInStagger.item}>
                <Orb
                  id={emotion.id}
                  label={emotion.label}
                  color={parentConfig.color}
                  motionPattern={parentConfig.motionPattern}
                  description={emotion.description}
                  isSelected={selected === emotion.id}
                  onSelect={(id) => handleEmotionSelect(id as SubEmotion)}
                  size="medium"
                />
                {/* Number hint */}
                <motion.div
                  className="text-center text-gray-500 text-xs mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  Press {index + 1}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Feedback text */}
          {showFeedback && selected && (
            <motion.div
              className="text-lg text-cyan-400 font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              Got it. You're feeling <span className="text-white">{selected}</span>
            </motion.div>
          )}

          {/* Helper text */}
          <motion.p
            className="text-gray-500 text-xs mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Keyboard: Press 1-3 • Escape to go back
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};
