import { useState } from 'react';
import { motion } from 'framer-motion';

interface LikertQuestionProps {
    question: {
        id: string;
        text: string;
        trait: string;
        traitLabel: string;
        direction: 'positive' | 'negative'; // positive = agree increases score, negative = agree decreases score
    };
    onAnswer: (value: number) => void;
    currentValue?: number;
}

const LIKERT_OPTIONS = [
    { value: 1, label: 'Strongly Disagree', color: 'from-red-500 to-orange-500', bgHover: 'hover:bg-red-500/20' },
    { value: 2, label: 'Disagree', color: 'from-orange-500 to-yellow-500', bgHover: 'hover:bg-orange-500/20' },
    { value: 3, label: 'Agree', color: 'from-green-400 to-teal-400', bgHover: 'hover:bg-green-500/20' },
    { value: 4, label: 'Strongly Agree', color: 'from-teal-400 to-cyan-400', bgHover: 'hover:bg-teal-500/20' },
];

export function LikertQuestion({ question, onAnswer, currentValue }: LikertQuestionProps) {
    const [selected, setSelected] = useState<number | null>(currentValue ?? null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleSelect = (value: number) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setSelected(value);

        // Small delay for animation before triggering callback
        setTimeout(() => {
            onAnswer(value);
            setIsAnimating(false);
        }, 300);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            {/* Question Text */}
            <div className="text-center space-y-3">
                <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed max-w-2xl mx-auto">
                    "{question.text}"
                </p>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-osia-neutral-500 uppercase tracking-widest">Affects:</span>
                    <span className="px-3 py-1 rounded-full bg-osia-teal-500/20 text-osia-teal-300 text-xs font-medium">
                        {question.traitLabel}
                    </span>
                </div>
            </div>

            {/* Likert Scale Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                {LIKERT_OPTIONS.map((option) => (
                    <motion.button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            relative p-6 rounded-2xl border transition-all duration-300
                            ${selected === option.value
                                ? `bg-gradient-to-br ${option.color} border-transparent shadow-lg shadow-white/10`
                                : `bg-white/5 border-white/10 ${option.bgHover}`
                            }
                        `}
                    >
                        {/* Selected indicator ring */}
                        {selected === option.value && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute inset-0 rounded-2xl ring-4 ring-white/30"
                            />
                        )}

                        <div className="relative z-10 text-center space-y-2">
                            {/* Visual indicator */}
                            <div className={`
                                w-8 h-8 mx-auto rounded-full flex items-center justify-center text-lg font-bold
                                ${selected === option.value
                                    ? 'bg-white/20 text-white'
                                    : 'bg-white/10 text-osia-neutral-400'
                                }
                            `}>
                                {option.value === 1 && '−−'}
                                {option.value === 2 && '−'}
                                {option.value === 3 && '+'}
                                {option.value === 4 && '++'}
                            </div>

                            <p className={`
                                text-sm font-medium
                                ${selected === option.value ? 'text-white' : 'text-osia-neutral-300'}
                            `}>
                                {option.label}
                            </p>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Guidance text */}
            <p className="text-center text-xs text-osia-neutral-600 max-w-md mx-auto">
                Your response helps refine your Blueprint by recalibrating the <strong className="text-osia-neutral-400">{question.traitLabel}</strong> dimension.
            </p>
        </motion.div>
    );
}
