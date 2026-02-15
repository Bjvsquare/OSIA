import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Users, Target, Settings, Building2, Trophy, GraduationCap, Palette, Stethoscope, CircleEllipsis } from 'lucide-react';

interface TeamSetupProps {
    onComplete: (data: any) => void;
}

const TEAM_TYPES = [
    { id: 'Corporate', icon: Building2, label: 'Corporate & Tech' },
    { id: 'Sport', icon: Trophy, label: 'Sport & Athletics' },
    { id: 'Education', icon: GraduationCap, label: 'Education & Research' },
    { id: 'Creative', icon: Palette, label: 'Creative & Design' },
    { id: 'Healthcare', icon: Stethoscope, label: 'Healthcare & Wellness' },
    { id: 'Other', icon: CircleEllipsis, label: 'Other / Custom' }
];

const TEAM_TYPE_CONFIG: Record<string, any[]> = {
    Corporate: [
        {
            theme: 'Alignment & Clarity',
            description: 'How well the team understands its shared direction',
            options: ['Everyone knows why their work matters', 'Decisions happen without bottlenecks', 'Priorities are clear and shared', 'Goals connect to real outcomes']
        },
        {
            theme: 'Trust & Openness',
            description: 'The quality of honesty and safety in the team',
            options: ['People speak up without fear', 'Mistakes are learning moments, not blame', 'Disagreements lead to better ideas', 'Help is asked for and given freely']
        },
        {
            theme: 'Sustainable Momentum',
            description: 'How the team moves without burning out',
            options: ['Consistent output without overtime culture', 'Recovery time is respected', 'Workload is distributed fairly', 'Progress feels steady, not frantic']
        }
    ],
    Sport: [
        {
            theme: 'Collective Mindset',
            description: 'The mental edge and shared belief of the team',
            options: ['Players lift each other under pressure', 'Confidence grows from preparation', 'The team identity is stronger than any individual', 'Setbacks fuel comeback energy']
        },
        {
            theme: 'On-Field Connection',
            description: 'How players read and respond to each other',
            options: ['Communication is instinctive, not forced', 'Roles are owned, not just assigned', 'Adaptability in live situations', 'Support runs happen without being asked']
        },
        {
            theme: 'Growth Culture',
            description: 'How the squad develops over time',
            options: ['Honest feedback is normal, not personal', 'Young players feel genuinely welcomed', 'Training intensity matches match-day desire', 'Individual development serves the collective']
        }
    ],
    Education: [
        {
            theme: 'Learning That Sticks',
            description: 'Are students genuinely engaged and growing?',
            options: ['Students ask questions that surprise you', 'Understanding deepens, not just grades', 'Curiosity outlasts the classroom', 'Students connect ideas across subjects']
        },
        {
            theme: 'Staff Synergy',
            description: 'How well the teaching team collaborates',
            options: ['Teachers share what works and what doesn\'t', 'Planning is collaborative, not siloed', 'Workload feels manageable and purposeful', 'Innovation is encouraged, not just tolerated']
        },
        {
            theme: 'Inclusive Environment',
            description: 'Does every learner feel they belong?',
            options: ['Every student feels seen and heard', 'Different learning styles are actively supported', 'Struggles are met with patience, not judgment', 'Success is celebrated in many forms']
        }
    ],
    Creative: [
        {
            theme: 'Creative Courage',
            description: 'The team\'s willingness to take real creative risks',
            options: ['Wild ideas get genuine consideration', 'Failure is part of the creative process', 'The team pushes past safe and familiar', 'Inspiration comes from unexpected places']
        },
        {
            theme: 'Creative Flow',
            description: 'How well the team enters and sustains deep work',
            options: ['Uninterrupted creative time is protected', 'Collaboration amplifies individual strengths', 'Feedback improves work without killing spirit', 'The team knows when to converge and diverge']
        },
        {
            theme: 'Craft & Standards',
            description: 'The quality bar the team holds itself to',
            options: ['Details are cared for, not just deadlines', 'The work reflects genuine pride', 'Skills are continuously sharpened', 'Craft is valued over speed']
        }
    ],
    Healthcare: [
        {
            theme: 'Patient-Centred Care',
            description: 'How the team serves those who need them',
            options: ['Patients feel heard, not processed', 'Care decisions are thoughtful, not rushed', 'Handoffs preserve context and dignity', 'Families are treated as partners']
        },
        {
            theme: 'Team Resilience',
            description: 'How staff sustain themselves through demanding work',
            options: ['Emotional load is shared, not carried alone', 'Rest is treated as essential, not optional', 'Difficult cases are debriefed together', 'Compassion fatigue is openly addressed']
        },
        {
            theme: 'Safety & Precision',
            description: 'The culture of accuracy and accountability',
            options: ['Near-misses are reported without blame', 'Protocols are followed because they\'re understood', 'Questions are welcomed at every level', 'Continuous learning is built into the day']
        }
    ],
    Other: [
        {
            theme: 'Shared Direction',
            description: 'Does the team know where it\'s going and why?',
            options: ['Purpose is clear and genuinely shared', 'Each person knows how they contribute', 'Progress is visible and celebrated', 'Course corrections happen quickly']
        },
        {
            theme: 'Team Health',
            description: 'How people feel about being on this team',
            options: ['People enjoy working together', 'Conflict is handled, not avoided', 'Everyone\'s voice carries weight', 'Energy levels stay sustainable']
        },
        {
            theme: 'Execution Quality',
            description: 'How well intentions become outcomes',
            options: ['Commitments are kept consistently', 'Quality is a habit, not an afterthought', 'Processes serve people, not the other way around', 'Learning from what didn\'t work is normalised']
        }
    ]
};

export function TeamSetup({ onComplete }: TeamSetupProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        teamType: '',
        teamName: '',
        purpose: '',
        expectedSize: 5,
        successMarkers: ['', '', ''],
        sessionMode: ''
    });

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const updateSuccessMarker = (index: number, value: string) => {
        const newMarkers = [...formData.successMarkers];
        newMarkers[index] = value;
        setFormData({ ...formData, successMarkers: newMarkers });
    };

    const isStep2Valid = formData.teamName.length > 0 && formData.purpose.length > 0 && formData.expectedSize >= 1;
    const isStep3Valid = formData.successMarkers.every(m => m.length > 0);
    const isStep4Valid = formData.sessionMode !== '';

    const currentMarkers = formData.teamType ? (TEAM_TYPE_CONFIG[formData.teamType] || TEAM_TYPE_CONFIG['Other']) : [];

    return (
        <div className="max-w-2xl mx-auto py-8">
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
                            <Target className="w-6 h-6" />
                            <h3 className="text-2xl font-bold text-white">Team Sector</h3>
                        </div>
                        <p className="text-osia-neutral-400 font-medium italic">What best describes the environment of your team?</p>

                        <div className="grid grid-cols-2 gap-4">
                            {TEAM_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setFormData({ ...formData, teamType: type.id, successMarkers: ['', '', ''] });
                                        handleNext();
                                    }}
                                    className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 ${formData.teamType === type.id
                                        ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                        : 'border-white/10 bg-white/5 text-osia-neutral-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
                                        }`}
                                >
                                    <type.icon className="w-8 h-8 opacity-80" />
                                    <span className="text-sm font-bold uppercase tracking-widest text-center">{type.label}</span>
                                </button>
                            ))}
                        </div>
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
                            <Users className="w-6 h-6" />
                            <h3 className="text-2xl font-bold text-white">Team Identity</h3>
                        </div>
                        <Card className="p-6 space-y-6 bg-white/5 border-white/10">
                            <div className="space-y-2">
                                <Label>Team Name</Label>
                                <Input
                                    placeholder="e.g. Product Engineering"
                                    value={formData.teamName}
                                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Team Purpose (One sentence)</Label>
                                <textarea
                                    className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-osia-teal-500 transition-colors placeholder:text-osia-neutral-600"
                                    placeholder="What is the core reason this team exists?"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expected Team Size</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 10"
                                    value={formData.expectedSize}
                                    onChange={(e) => setFormData({ ...formData, expectedSize: parseInt(e.target.value) || 0 })}
                                />
                                <p className="text-[10px] text-osia-neutral-500 italic">This helps calibrate privacy thresholds for team climate indicators.</p>
                            </div>
                        </Card>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={handleNext} disabled={!isStep2Valid} className="flex-1">Next</Button>
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
                            <Target className="w-6 h-6" />
                            <h3 className="text-2xl font-bold text-white">Success Markers</h3>
                        </div>
                        <p className="text-osia-neutral-400 font-medium italic">Tailored for {TEAM_TYPES.find(t => t.id === formData.teamType)?.label}</p>

                        <div className="space-y-8">
                            {currentMarkers.map((theme, i) => (
                                <div key={i} className="space-y-4">
                                    <div className="flex items-center justify-between pl-2">
                                        <div>
                                            <Label className="text-osia-teal-400 text-sm font-bold uppercase tracking-wider">{theme.theme}</Label>
                                            <p className="text-[10px] text-osia-neutral-500 mt-0.5">{theme.description}</p>
                                        </div>
                                        {formData.successMarkers[i] && (
                                            <span className="text-[10px] font-bold text-osia-teal-500 bg-osia-teal-500/10 px-2 py-0.5 rounded-full border border-osia-teal-500/20 animate-pulse">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {theme.options.map((option: string) => (
                                            <button
                                                key={option}
                                                onClick={() => updateSuccessMarker(i, option)}
                                                className={`p-4 rounded-xl border text-left text-[11px] leading-tight transition-all duration-300 ${formData.successMarkers[i] === option
                                                    ? 'border-osia-teal-500 bg-osia-teal-500/10 text-osia-teal-300'
                                                    : 'border-white/10 bg-white/5 text-osia-neutral-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex space-x-3 pt-6">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button onClick={handleNext} disabled={!isStep3Valid} className="flex-1">Next</Button>
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
                            <Settings className="w-6 h-6" />
                            <h3 className="text-2xl font-bold text-white">Session Mode</h3>
                        </div>
                        <Card className="p-6 space-y-4 bg-white/5 border-white/10">
                            <div className="grid grid-cols-1 gap-4">
                                {['Facilitated', 'Self-serve'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setFormData({ ...formData, sessionMode: mode })}
                                        className={`p-6 rounded-xl border text-left transition-all ${formData.sessionMode === mode
                                            ? 'border-osia-teal-500 bg-osia-teal-500/10'
                                            : 'border-white/10 hover:bg-white/5'
                                            }`}
                                    >
                                        <h4 className={`font-bold ${formData.sessionMode === mode ? 'text-osia-teal-300' : 'text-white'}`}>
                                            {mode}
                                        </h4>
                                        <p className="text-sm text-osia-neutral-400 mt-1">
                                            {mode === 'Facilitated'
                                                ? 'Guided sessions with an external or internal facilitator.'
                                                : 'Team-led sessions using OSIA\'s automated tools.'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </Card>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                            <Button
                                onClick={() => onComplete(formData)}
                                disabled={!isStep4Valid}
                                className="flex-1"
                            >
                                Complete Setup
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
