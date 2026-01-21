import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { useNavigate } from 'react-router-dom';


export function CheckInPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'type' | 'reflect'>('type');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const checkInTypes = [
        { id: 'conversation', label: 'A conversation', icon: '💬' },
        { id: 'decision', label: 'A decision', icon: '🎯' },
        { id: 'emotional_shift', label: 'An emotional shift', icon: '🌊' },
        { id: 'friction', label: 'A moment of friction', icon: '⚡' },
        { id: 'went_well', label: 'Something that went well', icon: '✨' },
        { id: 'other', label: 'Something else', icon: '🌀' }
    ];

    const tags = [
        'Energy up', 'Energy down', 'Felt aligned', 'Felt stuck',
        'Avoided something', 'Said what mattered', 'Held back', 'Surprised myself'
    ];

    const handleTypeSelect = (typeId: string) => {
        setSelectedType(typeId);
        setStep('reflect');
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSave = () => {
        // Mock save logic
        navigate('/home');
    };

    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden">
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-2xl">
                <AnimatePresence mode="wait">
                    {step === 'type' ? (
                        <motion.div
                            key="type-selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <h1 className="text-4xl font-bold tracking-tight">What are you checking in about?</h1>
                                <p className="text-osia-neutral-500 text-sm italic">This is optional. A few words is enough.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {checkInTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleTypeSelect(type.id)}
                                        className="group relative"
                                    >
                                        <Card className="p-8 border-white/5 bg-[#0a1128]/40 hover:border-osia-teal-500/30 transition-all duration-300 flex flex-col items-center gap-4">
                                            <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">{type.icon}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-400 group-hover:text-white transition-colors">
                                                {type.label}
                                            </span>
                                        </Card>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="reflection-input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    {selectedType === 'conversation' && 'What stood out in that conversation?'}
                                    {selectedType === 'decision' && 'Tell us about the decision.'}
                                    {selectedType === 'emotional_shift' && 'What changed in your energy?'}
                                    {selectedType === 'friction' && 'Where did the friction come from?'}
                                    {selectedType === 'went_well' && 'What worked well?'}
                                    {selectedType === 'other' && 'What’s on your mind?'}
                                </h2>
                                <p className="text-osia-neutral-500 text-sm italic">Short is better than detailed.</p>
                            </div>

                            <div className="space-y-10">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="A sentence or two is enough..."
                                    className="w-full min-h-[160px] bg-black/40 border-white/10 rounded-2xl p-6 text-xl text-white placeholder-osia-neutral-700 focus:outline-none focus:border-osia-teal-500/50 transition-colors resize-none"
                                />

                                <div className="space-y-4">
                                    <div className="text-[10px] font-bold text-osia-neutral-600 uppercase tracking-widest">Anything you want to tag?</div>
                                    <div className="flex flex-wrap gap-3">
                                        {tags.map((tag) => (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${selectedTags.includes(tag)
                                                    ? 'bg-osia-teal-500 border-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.3)]'
                                                    : 'bg-white/5 border-white/10 text-osia-neutral-500 hover:border-white/20'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/5 flex gap-4">
                                    <Button onClick={handleSave} variant="primary" className="flex-1 py-6 text-lg">
                                        Save check-in
                                    </Button>
                                    <Button onClick={() => setStep('type')} variant="secondary" className="px-10 py-6 text-lg">
                                        Cancel
                                    </Button>
                                </div>
                            </div>

                            <p className="text-center text-[10px] text-osia-neutral-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-osia-teal-500 rounded-full animate-pulse" />
                                This reflection stays private.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
