import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { X, UserPlus, Clock, Shield, CheckCircle } from 'lucide-react';

interface InviteCollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LINK_TYPES = [
    "Partner", "Friend", "Colleague", "Manager", "Direct report", "Other"
];

const FREQUENCIES = [
    "Daily", "Weekly", "Ad hoc", "High-intensity bursts"
];

const MOCK_PATTERNS = [
    { id: 1, title: "Depth Before Decision", description: "Gather extensive information before committing." },
    { id: 2, title: "Pattern Mirror", description: "Mirror the emotional state of those around you." },
    { id: 3, title: "Sentient Field Reach", description: "High sensitivity to group dynamics." }
];

export function InviteCollaboratorModal({ isOpen, onClose }: InviteCollaboratorModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        linkType: '',
        frequency: '',
        selectedPatterns: [] as number[],
        consent: false
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const togglePattern = (id: number) => {
        setFormData(prev => ({
            ...prev,
            selectedPatterns: prev.selectedPatterns.includes(id)
                ? prev.selectedPatterns.filter(p => p !== id)
                : [...prev.selectedPatterns, id]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg"
            >
                <Card className="relative overflow-hidden border-white/10 bg-osia-deep-900 shadow-2xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-osia-neutral-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8">
                        {/* Progress Header */}
                        <div className="flex items-center space-x-2 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${step >= i ? 'bg-osia-teal-500' : 'bg-white/10'
                                        }`}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center space-x-3 text-osia-teal-400">
                                        <UserPlus className="w-6 h-6" />
                                        <h3 className="text-xl font-semibold text-white">Who are you inviting?</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Collaborator Name</Label>
                                            <Input
                                                placeholder="e.g. Alex Chen"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Connection Type</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {LINK_TYPES.map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setFormData({ ...formData, linkType: type })}
                                                        className={`p-2 rounded-lg border text-sm transition-all ${formData.linkType === type
                                                                ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                                                : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                                            }`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!formData.name || !formData.linkType}
                                        className="w-full"
                                    >
                                        Next
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center space-x-3 text-osia-teal-400">
                                        <Clock className="w-6 h-6" />
                                        <h3 className="text-xl font-semibold text-white">Interaction Frequency</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {FREQUENCIES.map(freq => (
                                            <button
                                                key={freq}
                                                onClick={() => setFormData({ ...formData, frequency: freq })}
                                                className={`w-full p-4 rounded-xl border text-left transition-all ${formData.frequency === freq
                                                        ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                                        : 'border-white/10 hover:bg-white/5 text-osia-neutral-400'
                                                    }`}
                                            >
                                                {freq}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex space-x-3">
                                        <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                                        <Button onClick={handleNext} disabled={!formData.frequency} className="flex-1">Next</Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center space-x-3 text-osia-teal-400">
                                        <Shield className="w-6 h-6" />
                                        <h3 className="text-xl font-semibold text-white">Share your patterns</h3>
                                    </div>
                                    <p className="text-sm text-osia-neutral-400">
                                        Select which insights you'd like to share with {formData.name}.
                                        They will only see what you explicitly allow.
                                    </p>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                        {MOCK_PATTERNS.map(pattern => (
                                            <button
                                                key={pattern.id}
                                                onClick={() => togglePattern(pattern.id)}
                                                className={`w-full p-4 rounded-xl border text-left transition-all ${formData.selectedPatterns.includes(pattern.id)
                                                        ? 'border-osia-teal-500 bg-osia-teal-500/10'
                                                        : 'border-white/10 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-medium text-white">{pattern.title}</h4>
                                                    {formData.selectedPatterns.includes(pattern.id) && (
                                                        <CheckCircle className="w-4 h-4 text-osia-teal-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-osia-neutral-400 mt-1">{pattern.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex space-x-3">
                                        <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                                        <Button onClick={handleNext} className="flex-1">Next</Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center space-x-3 text-osia-teal-400">
                                        <CheckCircle className="w-6 h-6" />
                                        <h3 className="text-xl font-semibold text-white">Final Confirmation</h3>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-osia-neutral-400">Inviting</span>
                                            <span className="text-white font-medium">{formData.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-osia-neutral-400">Role</span>
                                            <span className="text-white font-medium">{formData.linkType}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-osia-neutral-400">Shared Insights</span>
                                            <span className="text-white font-medium">{formData.selectedPatterns.length} patterns</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-4 rounded-xl bg-osia-teal-500/5 border border-osia-teal-500/20">
                                        <input
                                            type="checkbox"
                                            id="consent"
                                            className="mt-1"
                                            checked={formData.consent}
                                            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                                        />
                                        <label htmlFor="consent" className="text-xs text-osia-neutral-300 leading-relaxed">
                                            I confirm mutual consent to link with {formData.name} and share my selected patterns.
                                            I understand they will also be asked to share their patterns with me.
                                        </label>
                                    </div>
                                    <div className="flex space-x-3">
                                        <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                                        <Button
                                            onClick={onClose}
                                            disabled={!formData.consent}
                                            className="flex-1"
                                        >
                                            Send Invite
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
