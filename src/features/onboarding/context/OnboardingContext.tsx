import React, { createContext, useContext, useReducer } from 'react';
import type { OnboardingState, Answer, EventSchema, ConsentLedgerEntry } from '../../../core/models';

type Action =
    | { type: 'SET_STAGE'; payload: string }
    | { type: 'SET_ANSWER'; payload: Answer }
    | { type: 'COMPLETE_STAGE'; payload: string }
    | { type: 'RECORD_EVENT'; payload: EventSchema }
    | { type: 'UPDATE_CONSENT'; payload: ConsentLedgerEntry };

const initialState: OnboardingState = {
    currentStageId: 'BLUEPRINT',
    answers: {},
    completedStages: [],
    consentLedger: [],
    sessionId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
};

const OnboardingContext = createContext<{
    state: OnboardingState;
    dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function onboardingReducer(state: OnboardingState, action: Action): OnboardingState {
    switch (action.type) {
        case 'SET_STAGE':
            return { ...state, currentStageId: action.payload };
        case 'SET_ANSWER':
            return {
                ...state,
                answers: {
                    ...state.answers,
                    [action.payload.question_id]: action.payload,
                },
            };
        case 'COMPLETE_STAGE':
            return {
                ...state,
                completedStages: [...state.completedStages, action.payload],
            };
        case 'RECORD_EVENT':
            // In a real app, this would send to an analytics/audit endpoint
            console.log('Event Recorded:', action.payload);
            return state;
        case 'UPDATE_CONSENT':
            return {
                ...state,
                consentLedger: [...state.consentLedger, action.payload],
            };
        default:
            return state;
    }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(onboardingReducer, initialState, (initial) => {
        const saved = localStorage.getItem('osia_onboarding_state');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return initial;
            }
        }
        return initial;
    });

    React.useEffect(() => {
        localStorage.setItem('osia_onboarding_state', JSON.stringify(state));
    }, [state]);

    return (
        <OnboardingContext.Provider value={{ state, dispatch }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within a OnboardingProvider');
    }
    return context;
}
