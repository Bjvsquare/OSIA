import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface TourStep {
    id: string;
    section: string;
    target: string;
    title: string;
    description: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourContextType {
    isTourActive: boolean;
    currentStepIndex: number;
    currentStep: TourStep | null;
    totalSteps: number;
    tourCompleted: boolean;
    startTour: () => void;
    endTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    goToStep: (index: number) => void;
}

const TourContext = createContext<TourContextType | null>(null);

export const TOUR_STEPS: TourStep[] = [
    // ===== WELCOME =====
    {
        id: 'welcome',
        section: 'Welcome',
        target: 'sidebar',
        title: 'Welcome to OSIA',
        description: 'Your command center for personal intelligence. Let\'s walk through each section from left to right.',
        position: 'bottom'
    },

    // ===== 1. HOME =====
    {
        id: 'nav-home',
        section: 'Home',
        target: 'nav-home',
        title: 'Home',
        description: 'Your digital twin dashboard. This is where your Blueprint—your evolving psychological model—lives.',
        position: 'bottom'
    },
    {
        id: 'blueprint-orb',
        section: 'Home',
        target: 'blueprint-orb',
        title: 'Your Blueprint',
        description: 'This orb represents your digital twin. It evolves based on your inputs, patterns, and growth over time.'
    },

    // ===== 2. INSIGHTS (Thesis + Patterns) =====
    {
        id: 'nav-insights',
        section: 'Insights',
        target: 'nav-insights',
        title: 'Insights',
        description: 'Your deep intelligence hub. Switch between your Personality Thesis—a long-form psychological architecture—and Patterns that reveal recurring dynamics in your behavior.',
        position: 'bottom'
    },
    {
        id: 'patterns-overview',
        section: 'Insights',
        target: 'patterns-overview',
        title: 'Pattern Intelligence',
        description: 'View your psychological traits and tendencies. Patterns become actionable insights for personal optimization. Use the tabs to switch between Thesis and Patterns.'
    },

    // ===== 3. CONNECT =====
    {
        id: 'nav-connect',
        section: 'Connect',
        target: 'nav-connect',
        title: 'Connect',
        description: 'Build your network of trusted connections. Share insights and see how your blueprints complement each other.',
        position: 'bottom'
    },
    {
        id: 'connect-overview',
        section: 'Connect',
        target: 'connect-overview',
        title: 'Connection Requests',
        description: 'Send and receive connection requests. Once connected, you can compare patterns and unlock synergy insights.'
    },

    // ===== 4. CIRCLES (Teams + Organizations) =====
    {
        id: 'nav-circles',
        section: 'Circles',
        target: 'nav-circles',
        title: 'Circles',
        description: 'Your teams and organizations in one place. Create work groups, family circles, or join organizations to unlock collective intelligence.',
        position: 'bottom'
    },
    {
        id: 'team-overview',
        section: 'Circles',
        target: 'team-overview',
        title: 'Team Intelligence',
        description: 'See aggregate dynamics, complementary strengths, and collective patterns. Switch to Organizations to explore or build culture profiles.'
    },

    // ===== 5. PRACTICE (Protocols + Refinement) =====
    {
        id: 'nav-practice',
        section: 'Practice',
        target: 'nav-practice',
        title: 'Practice',
        description: 'Guided sessions designed for high-performance professionals. Each protocol refines specific Blueprint layers. Switch between Protocols and Refinement.',
        position: 'bottom'
    },
    {
        id: 'protocol-templates',
        section: 'Practice',
        target: 'protocol-templates',
        title: 'Protocol Library',
        description: 'Choose from Strategic Briefing, Performance Calibration, Stakeholder Intelligence, and more.'
    },

    // ===== 6. JOURNEY =====
    {
        id: 'nav-journey',
        section: 'Journey',
        target: 'nav-journey',
        title: 'Journey',
        description: 'Track your personal progression, earn unique evolutionary badges, and monitor your subscription credits.',
        position: 'bottom'
    },
    {
        id: 'journey-badges',
        section: 'Journey',
        target: 'journey-badges',
        title: 'Achievements',
        description: 'Earn premium badges as you complete protocols and reach milestones.'
    },
    {
        id: 'journey-credits',
        section: 'Journey',
        target: 'journey-credits',
        title: 'Subscription Credits',
        description: 'Consistent engagement earns credits toward your subscription. Stay active to reduce your costs.'
    },

    // ===== SETTINGS (user dropdown) =====
    {
        id: 'settings-dropdown',
        section: 'Settings',
        target: 'user-dropdown',
        title: 'Profile & Architecture',
        description: 'Manage your digital identity, security protocols, and system preferences from your personal menu.',
        position: 'bottom'
    },

    // ===== VOICE AGENT PREVIEW =====
    {
        id: 'voice-agent',
        section: 'Voice',
        target: 'voice-agent-button',
        title: 'Voice Intelligence',
        description: 'Coming soon: Engage with your AI companion through natural voice conversation.',
        position: 'left'
    },

    // ===== COMPLETION =====
    {
        id: 'tour-complete',
        section: 'Complete',
        target: 'tour-complete-center',
        title: 'You\'re Ready',
        description: 'That\'s the essentials. Explore at your own pace—your Blueprint grows more accurate with every interaction.'
    }
];

export function TourProvider({ children }: { children: ReactNode }) {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [tourCompleted, setTourCompleted] = useState(false);

    // Check if tour has been completed before
    useEffect(() => {
        const completed = localStorage.getItem('osia_tour_completed');
        if (completed === 'true') {
            setTourCompleted(true);
        }
    }, []);

    const startTour = () => {
        setCurrentStepIndex(0);
        setIsTourActive(true);
    };

    const endTour = () => {
        setIsTourActive(false);
        setTourCompleted(true);
        localStorage.setItem('osia_tour_completed', 'true');
    };

    const skipTour = () => {
        endTour();
    };

    const nextStep = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            endTour();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const goToStep = (index: number) => {
        if (index >= 0 && index < TOUR_STEPS.length) {
            setCurrentStepIndex(index);
        }
    };

    const value: TourContextType = {
        isTourActive,
        currentStepIndex,
        currentStep: isTourActive ? TOUR_STEPS[currentStepIndex] : null,
        totalSteps: TOUR_STEPS.length,
        tourCompleted,
        startTour,
        endTour,
        nextStep,
        prevStep,
        skipTour,
        goToStep
    };

    return (
        <TourContext.Provider value={value}>
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
}
