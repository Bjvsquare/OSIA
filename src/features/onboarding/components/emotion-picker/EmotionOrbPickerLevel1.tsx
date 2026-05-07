import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Orb } from './Orb';
import { STATE_ORDER, emotionHierarchy } from './emotionHierarchy';
import { PsychologicalState } from './types';
import { fadeInStagger } from './animationVariants';

interface EmotionOrbPickerLevel1Props {
  onSelect: (state: PsychologicalState) => void;
  onBack: () => void;
  initialSelected?: PsychologicalState | null;
}

export const EmotionOrbPickerLevel1: React.FC<EmotionOrbPickerLevel1Props> = ({
  onSelect,
  onBack,
  initialSelected = null
}) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PsychologicalState | null>(initialSelected);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const keyMap: Record<string, PsychologicalState> = {
        '1': 'Flowing',
        '2': 'Activated',
        '3': 'Grounded',
        '4': 'Reflecting'
      };

      if (keyMap[e.key]) {
        handleOrbSelect(keyMap[e.key]);
      } else if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onBack]);

  const handleOrbSelect = (state: PsychologicalState) => {
    setSelected(state);
    setShowFeedback(true);

    setTimeout(() => {
      onSelect(state);
      // Navigate to level 2
      navigate('/onboarding/emotion/level2');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#0d1f3d] to-[#0a1128] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20" />
      </div>

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Title */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-white mb-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          How are you?
        </motion.h1>

        <motion.p
          className="text-gray-400 mb-16 text-sm md:text-base"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Select the state that resonates with you right now
        </motion.p>

        {/* Orbs Container */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-12 justify-items-center"
          variants={fadeInStagger}
          initial="hidden"
          animate="visible"
        >
          {STATE_ORDER.map((state) => {
            const config = emotionHierarchy[state];
            return (
              <motion.div key={state} variants={fadeInStagger.item}>
                <Orb
                  id={state}
                  label={state}
                  color={config.color}
                  motionPattern={config.motionPattern}
                  description={config.description}
                  isSelected={selected === state}
                  onSelect={handleOrbSelect}
                  size="large"
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feedback text */}
        {showFeedback && selected && (
          <motion.div
            className="mt-8 text-lg text-cyan-400 font-semibold"
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
          Keyboard: Press 1, 2, 3, or 4 • Escape to go back
        </motion.p>
      </motion.div>
    </div>
  );
};
