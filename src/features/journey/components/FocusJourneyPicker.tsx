import { Card } from '../../../components/ui/Card';
import { Target, Zap, Shield, MessageSquare } from 'lucide-react';

const FOCUS_AREAS = [
    {
        id: 'stress_recovery',
        title: 'Stress & Recovery',
        description: 'Master your energy cycles and stress response.',
        icon: Zap,
        color: 'text-amber-400',
        bg: 'bg-amber-400/10'
    },
    {
        id: 'decision_making',
        title: 'Decision-making',
        description: 'Refine how you process complexity and take action.',
        icon: Target,
        color: 'text-osia-teal-400',
        bg: 'bg-osia-teal-400/10'
    },
    {
        id: 'boundaries_closeness',
        title: 'Boundaries & Closeness',
        description: 'Navigate relational depth and personal space.',
        icon: Shield,
        color: 'text-purple-400',
        bg: 'bg-purple-400/10'
    },
    {
        id: 'communication_pressure',
        title: 'Communication',
        description: 'Stay clear and connected when the heat is on.',
        icon: MessageSquare,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10'
    }
];

interface FocusJourneyPickerProps {
    onSelect: (id: string) => void;
    selectedId?: string;
}

export function FocusJourneyPicker({ onSelect, selectedId }: FocusJourneyPickerProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FOCUS_AREAS.map((area) => {
                    const Icon = area.icon;
                    const isSelected = selectedId === area.id;

                    return (
                        <button
                            key={area.id}
                            onClick={() => onSelect(area.id)}
                            className={`text-left transition-all duration-200 group ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                                }`}
                        >
                            <Card className={`h-full p-4 border-2 transition-colors ${isSelected
                                ? 'border-osia-teal-500 bg-osia-teal-500/10'
                                : 'border-white/5 bg-white/5 hover:border-white/20'
                                }`}>
                                <div className="flex items-start space-x-4">
                                    <div className={`p-2 rounded-lg ${area.bg} ${area.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white group-hover:text-osia-teal-300 transition-colors">
                                            {area.title}
                                        </h4>
                                        <p className="text-xs text-osia-neutral-400 mt-1 leading-relaxed">
                                            {area.description}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <div className="w-2 h-2 rounded-full bg-osia-teal-500 mt-2" />
                                    )}
                                </div>
                            </Card>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
