import { useState, useCallback } from 'react';
import { EmotionState, PsychologicalState, SubEmotion, FinalEmotion, EMOTION_MAP } from './types';

export interface UseEmotionPickerReturn {
  emotionState: EmotionState;
  setLevel1: (state: PsychologicalState) => void;
  setLevel2: (emotion: SubEmotion) => void;
  setIntensity: (intensity: number) => void;
  setContext: (context: string) => void;
  setVoiceTranscript: (transcript: string) => void;
  canGoBack: () => boolean;
  goBack: () => void;
  getCurrentLevel: () => 1 | 2 | 3;
  getFinalEmotion: () => FinalEmotion | null;
  reset: () => void;
}

const INITIAL_STATE: EmotionState = {
  level1: null,
  level2: null,
  intensity: 50,
  context: '',
  voiceTranscript: undefined
};

export function useEmotionPicker(): UseEmotionPickerReturn {
  const [emotionState, setEmotionState] = useState<EmotionState>(INITIAL_STATE);

  const getCurrentLevel = useCallback((): 1 | 2 | 3 => {
    if (!emotionState.level1) return 1;
    if (!emotionState.level2) return 2;
    return 3;
  }, [emotionState.level1, emotionState.level2]);

  const canGoBack = useCallback((): boolean => getCurrentLevel() > 1, [getCurrentLevel]);

  const goBack = useCallback(() => {
    const level = getCurrentLevel();
    if (level === 2) {
      setEmotionState(prev => ({ ...prev, level2: null }));
    } else if (level === 3) {
      setEmotionState(prev => ({ ...prev, level2: null }));
    }
  }, [getCurrentLevel]);

  const setLevel1 = useCallback((state: PsychologicalState) => {
    setEmotionState(prev => ({ ...prev, level1: state, level2: null }));
  }, []);

  const setLevel2 = useCallback((emotion: SubEmotion) => {
    setEmotionState(prev => ({ ...prev, level2: emotion }));
  }, []);

  const setIntensity = useCallback((intensity: number) => {
    const clipped = Math.min(100, Math.max(0, intensity));
    setEmotionState(prev => ({ ...prev, intensity: clipped }));
  }, []);

  const setContext = useCallback((context: string) => {
    setEmotionState(prev => ({ ...prev, context }));
  }, []);

  const setVoiceTranscript = useCallback((transcript: string) => {
    setEmotionState(prev => ({ ...prev, voiceTranscript: transcript, context: transcript }));
  }, []);

  const getFinalEmotion = useCallback((): FinalEmotion | null => {
    if (!emotionState.level2) return null;
    return EMOTION_MAP[emotionState.level2];
  }, [emotionState.level2]);

  const reset = useCallback(() => {
    setEmotionState(INITIAL_STATE);
  }, []);

  return {
    emotionState,
    setLevel1,
    setLevel2,
    setIntensity,
    setContext,
    setVoiceTranscript,
    canGoBack,
    goBack,
    getCurrentLevel,
    getFinalEmotion,
    reset
  };
}
