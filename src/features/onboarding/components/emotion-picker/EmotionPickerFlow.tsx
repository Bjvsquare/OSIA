import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEmotionPicker } from './useEmotionPicker';
import { EmotionOrbPickerLevel1 } from './EmotionOrbPickerLevel1';
import { EmotionOrbPickerLevel2 } from './EmotionOrbPickerLevel2';
import { EmotionIntensityWithVoice } from './EmotionIntensityWithVoice';
import { PsychologicalState, SubEmotion, FinalEmotion } from './types';

interface EmotionPickerFlowProps {
  onCheckInSaved?: (data: {
    emotion: FinalEmotion;
    intensity: number;
    context: string;
  }) => void;
}

export const EmotionPickerFlow: React.FC<EmotionPickerFlowProps> = ({ onCheckInSaved }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const picker = useEmotionPicker();
  const [currentLevel, setCurrentLevel] = useState(picker.getCurrentLevel());

  const handleLevel1Select = (state: PsychologicalState) => {
    picker.setLevel1(state);
    navigate('/onboarding/emotion/level2');
  };

  const handleLevel2Select = (emotion: SubEmotion) => {
    picker.setLevel2(emotion);
    navigate('/onboarding/emotion/level3');
  };

  const handleLevel3Save = async (data: {
    emotion: SubEmotion;
    intensity: number;
    context: string;
  }) => {
    picker.setLevel2(data.emotion);
    picker.setIntensity(data.intensity);
    picker.setContext(data.context);

    const finalEmotion = picker.getFinalEmotion();
    if (finalEmotion && onCheckInSaved) {
      onCheckInSaved({
        emotion: finalEmotion,
        intensity: data.intensity,
        context: data.context
      });
    }
  };

  const handleBack = () => {
    picker.goBack();
  };

  const level = picker.getCurrentLevel();

  if (level === 1) {
    return (
      <EmotionOrbPickerLevel1
        onSelect={handleLevel1Select}
        onBack={handleBack}
        initialSelected={picker.emotionState.level1}
      />
    );
  }

  if (level === 2 && picker.emotionState.level1) {
    return (
      <EmotionOrbPickerLevel2
        parentState={picker.emotionState.level1}
        onSelect={handleLevel2Select}
        onBack={handleBack}
        initialSelected={picker.emotionState.level2 || undefined}
      />
    );
  }

  if (level === 3 && picker.emotionState.level1 && picker.emotionState.level2) {
    return (
      <EmotionIntensityWithVoice
        emotion={picker.emotionState.level2}
        parentState={picker.emotionState.level1}
        onSave={handleLevel3Save}
        onBack={handleBack}
      />
    );
  }

  // Fallback to level 1 if state is invalid
  return (
    <EmotionOrbPickerLevel1
      onSelect={handleLevel1Select}
      onBack={handleBack}
      initialSelected={picker.emotionState.level1}
    />
  );
};
