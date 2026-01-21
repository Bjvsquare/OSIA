import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour, TOUR_STEPS } from './TourContext';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';

// Map tour step targets to nav routes for navigation
const ROUTE_MAP: Record<string, string> = {
    // Home section
    'sidebar': '/home',
    'nav-home': '/home',
    'blueprint-orb': '/home',
    'layer-cards': '/home',
    // Insights section (Thesis + Patterns)
    'nav-insights': '/thesis',
    'patterns-overview': '/patterns',
    // Connect section
    'nav-connect': '/connect',
    'connect-overview': '/connect',
    // Circles section (Teams + Organizations)
    'nav-circles': '/teams',
    'team-overview': '/team',
    // Practice section (Protocols + Refinement)
    'nav-practice': '/protocols',
    'protocol-templates': '/protocols',
    // Journey section
    'nav-journey': '/journey',
    'journey-badges': '/journey',
    'journey-credits': '/journey',
    // Settings & other
    'user-dropdown': '/home',
    'voice-agent-button': '/home',
    'tour-complete-center': '/home'
};

export function GuidedTour() {
    const {
        isTourActive,
        currentStep,
        currentStepIndex,
        totalSteps,
        nextStep,
        prevStep,
        skipTour,
        endTour
    } = useTour();

    const navigate = useNavigate();
    const location = useLocation();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    // Navigate to the correct page for the current step
    useEffect(() => {
        if (!isTourActive || !currentStep) return;

        const targetRoute = ROUTE_MAP[currentStep.target];
        if (targetRoute && location.pathname !== targetRoute) {
            setIsNavigating(true);
            navigate(targetRoute);
            // Give more time for navigation and render
            setTimeout(() => setIsNavigating(false), 500);
        }
    }, [currentStep, isTourActive, location.pathname, navigate]);

    // Find and highlight the target element
    const updateTargetPosition = useCallback(() => {
        if (!currentStep || isNavigating) return;

        // Try to find the target element
        const element = document.querySelector(`[data-tour="${currentStep.target}"]`) ||
            document.querySelector(`#${currentStep.target}`) ||
            document.querySelector(`.${currentStep.target}`);

        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
        } else {
            // If not found, center the tooltip
            setTargetRect(null);
        }
    }, [currentStep, isNavigating]);

    useEffect(() => {
        if (!isTourActive) return;

        // Initial position update
        const timer = setTimeout(updateTargetPosition, 100);

        // Update on scroll/resize
        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener('scroll', updateTargetPosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateTargetPosition);
            window.removeEventListener('scroll', updateTargetPosition);
        };
    }, [isTourActive, updateTargetPosition, currentStepIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!isTourActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') skipTour();
            if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
            if (e.key === 'ArrowLeft') prevStep();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTourActive, nextStep, prevStep, skipTour]);

    if (!isTourActive || !currentStep) return null;

    const getTooltipPosition = () => {
        if (!targetRect) {
            // Center on screen
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            };
        }

        const position = currentStep.position || 'bottom';
        const padding = 20;

        switch (position) {
            case 'top':
                return {
                    bottom: `${window.innerHeight - targetRect.top + padding}px`,
                    left: `${targetRect.left + targetRect.width / 2}px`,
                    transform: 'translateX(-50%)'
                };
            case 'left':
                return {
                    top: `${targetRect.top + targetRect.height / 2}px`,
                    right: `${window.innerWidth - targetRect.left + padding}px`,
                    transform: 'translateY(-50%)'
                };
            case 'right':
                return {
                    top: `${targetRect.top + targetRect.height / 2}px`,
                    left: `${targetRect.right + padding}px`,
                    transform: 'translateY(-50%)'
                };
            default: // bottom
                return {
                    top: `${targetRect.bottom + padding}px`,
                    left: `${targetRect.left + targetRect.width / 2}px`,
                    transform: 'translateX(-50%)'
                };
        }
    };

    const isLastStep = currentStepIndex === totalSteps - 1;
    const isFirstStep = currentStepIndex === 0;

    return (
        <AnimatePresence>
            <motion.div
                key="tour-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] pointer-events-auto"
            >
                {/* Overlay with spotlight cutout */}
                <div className="absolute inset-0">
                    {targetRect ? (
                        <svg className="w-full h-full">
                            <defs>
                                <mask id="spotlight-mask">
                                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                    <rect
                                        x={targetRect.left - 8}
                                        y={targetRect.top - 8}
                                        width={targetRect.width + 16}
                                        height={targetRect.height + 16}
                                        rx="12"
                                        fill="black"
                                    />
                                </mask>
                            </defs>
                            <rect
                                x="0" y="0"
                                width="100%"
                                height="100%"
                                fill="rgba(0, 0, 0, 0.85)"
                                mask="url(#spotlight-mask)"
                            />
                        </svg>
                    ) : (
                        <div className="w-full h-full bg-black/85" />
                    )}
                </div>

                {/* Spotlight ring */}
                {targetRect && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute rounded-xl pointer-events-none"
                        style={{
                            top: targetRect.top - 8,
                            left: targetRect.left - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                            boxShadow: '0 0 0 4px rgba(56, 163, 165, 0.6), 0 0 40px rgba(56, 163, 165, 0.3)'
                        }}
                    />
                )}

                {/* Tooltip */}
                <motion.div
                    key={currentStep.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute max-w-md w-full px-4"
                    style={getTooltipPosition()}
                >
                    <div className="bg-gradient-to-br from-osia-dark-800 to-osia-dark-900 border border-osia-teal-500/30 rounded-2xl shadow-2xl shadow-osia-teal-500/10 p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-lg bg-osia-teal-500/20 text-osia-teal-400 text-xs font-medium">
                                    {currentStep.section}
                                </span>
                                <span className="text-osia-neutral-500 text-xs">
                                    {currentStepIndex + 1} / {totalSteps}
                                </span>
                            </div>
                            <button
                                onClick={skipTour}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                title="Skip tour"
                            >
                                <X className="w-4 h-4 text-osia-neutral-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-white mb-2">
                            {currentStep.title}
                        </h3>
                        <p className="text-osia-neutral-400 mb-6 leading-relaxed">
                            {currentStep.description}
                        </p>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-1.5 mb-4">
                            {TOUR_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentStepIndex
                                        ? 'bg-osia-teal-500 w-6'
                                        : idx < currentStepIndex
                                            ? 'bg-osia-teal-500/50'
                                            : 'bg-white/20'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={prevStep}
                                disabled={isFirstStep}
                                className="opacity-80"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Back
                            </Button>

                            <button
                                onClick={skipTour}
                                className="text-xs text-osia-neutral-500 hover:text-osia-neutral-300 flex items-center gap-1"
                            >
                                <SkipForward className="w-3 h-3" />
                                Skip Tour
                            </button>

                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-osia-teal-600 to-purple-600"
                                onClick={isLastStep ? endTour : nextStep}
                            >
                                {isLastStep ? 'Finish' : 'Next'}
                                {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
