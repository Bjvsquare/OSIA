export type PsychologicalState = 'Flowing' | 'Activated' | 'Grounded' | 'Reflecting';
export type SubEmotion = 'Excited' | 'Stressed' | 'Curious' | 'Connected' | 'Creative' | 'Purposeful' | 'Secure' | 'Focused' | 'Restful' | 'Thoughtful' | 'Stuck' | 'Overwhelmed';
export type FinalEmotion = 'Connected' | 'Creative' | 'Excited' | 'Stressed' | 'Curious' | 'Secure' | 'Focused' | 'Thoughtful';

export interface EmotionState {
  level1: PsychologicalState | null;
  level2: SubEmotion | null;
  intensity: number;
  context: string;
  voiceTranscript?: string;
}

export interface OrbConfig {
  id: string;
  label: string;
  color: string;
  motionPattern: 'wave' | 'pulse' | 'drift' | 'spiral';
  description?: string;
}

export interface EmotionHierarchyNode {
  id: PsychologicalState | SubEmotion;
  label: string;
  color: string;
  motionPattern: 'wave' | 'pulse' | 'drift' | 'spiral';
  children?: EmotionHierarchyNode[];
  description: string;
}

export const EMOTION_MAP: Record<SubEmotion, FinalEmotion> = {
  Connected: 'Connected',
  Creative: 'Creative',
  Purposeful: 'Creative',
  Excited: 'Excited',
  Stressed: 'Stressed',
  Curious: 'Curious',
  Secure: 'Secure',
  Focused: 'Focused',
  Restful: 'Secure',
  Thoughtful: 'Thoughtful',
  Stuck: 'Thoughtful',
  Overwhelmed: 'Thoughtful'
};
