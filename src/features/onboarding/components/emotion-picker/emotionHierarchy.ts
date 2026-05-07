import { PsychologicalState } from './types';

export const emotionHierarchy: Record<PsychologicalState, {
  color: string;
  motionPattern: 'wave' | 'pulse' | 'drift' | 'spiral';
  description: string;
  subEmotions: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}> = {
  Flowing: {
    color: '#00d4ff',
    motionPattern: 'wave',
    description: 'In sync, growing, connected',
    subEmotions: [
      { id: 'Connected', label: 'Connected', description: 'Relational alignment' },
      { id: 'Creative', label: 'Creative', description: 'Generative energy' },
      { id: 'Purposeful', label: 'Purposeful', description: 'Aligned action' }
    ]
  },
  Activated: {
    color: '#ff6b6b',
    motionPattern: 'pulse',
    description: 'Engaged, reacting, processing',
    subEmotions: [
      { id: 'Excited', label: 'Excited', description: 'Energized, ready' },
      { id: 'Stressed', label: 'Stressed', description: 'Reactive, overwhelmed' },
      { id: 'Curious', label: 'Curious', description: 'Questioning, exploring' }
    ]
  },
  Grounded: {
    color: '#00b894',
    motionPattern: 'drift',
    description: 'Present, secure, anchored',
    subEmotions: [
      { id: 'Secure', label: 'Secure', description: 'Safe, protected' },
      { id: 'Focused', label: 'Focused', description: 'Disciplined presence' },
      { id: 'Restful', label: 'Restful', description: 'Recovering, restorative' }
    ]
  },
  Reflecting: {
    color: '#9d4edd',
    motionPattern: 'spiral',
    description: 'Processing, integrating, aware',
    subEmotions: [
      { id: 'Thoughtful', label: 'Thoughtful', description: 'Integrating, wise' },
      { id: 'Stuck', label: 'Stuck', description: 'Blocked, uncertain' },
      { id: 'Overwhelmed', label: 'Overwhelmed', description: 'Too much input' }
    ]
  }
};

export const STATE_ORDER: PsychologicalState[] = ['Flowing', 'Activated', 'Grounded', 'Reflecting'];
