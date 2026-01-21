import { useState } from 'react';
import { motion } from 'framer-motion';
import { IntegrationRituals } from './components/IntegrationRituals';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle, ArrowRight, Calendar, Clock, Target, Bell } from 'lucide-react';

export function IntegrationPage() {
    const [isComplete, setIsComplete] = useState(false);
    const [ritualData, setRitualData] = useState<any>(null);

    const handleComplete = (data: any) => {
        setRitualData(data);
        setIsComplete(true);
    };

    if (isComplete) {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-osia-teal-500/20 text-osia-teal-400 mb-4">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Rituals Established</h2>
                    <p className="text-osia-neutral-400">
                        Your growth rhythm is now synchronized with OSIA.
                    </p>
                </motion.div>

                <Card className="p-8 bg-white/5 border-white/10 space-y-6">
                    <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">Your Integration Blueprint</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-osia-teal-400 text-xs font-bold uppercase tracking-widest">
                                <Calendar className="w-3 h-3" />
                                <span>Cadence</span>
                            </div>
                            <p className="text-white font-medium">{ritualData.cadence}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-osia-teal-400 text-xs font-bold uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                <span>Preferred Time</span>
                            </div>
                            <p className="text-white font-medium">{ritualData.timePref}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-osia-teal-400 text-xs font-bold uppercase tracking-widest">
                                <Target className="w-3 h-3" />
                                <span>Focus Areas</span>
                            </div>
                            <p className="text-white font-medium">{ritualData.focusAreas.join(', ')}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-osia-teal-400 text-xs font-bold uppercase tracking-widest">
                                <Bell className="w-3 h-3" />
                                <span>Nudge Style</span>
                            </div>
                            <p className="text-white font-medium">{ritualData.nudgeStyle}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <div className="text-xs font-bold text-osia-teal-400 uppercase tracking-widest mb-2">Progress Indicator</div>
                        <p className="text-osia-neutral-300 italic text-sm">"{ritualData.progressIndicator}"</p>
                    </div>

                    <Button className="w-full mt-4" onClick={() => window.location.href = '/dashboard'}>
                        Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">Integration & Rituals</h2>
                <p className="text-osia-neutral-400">
                    Design the rhythm of your ongoing growth and reflection.
                </p>
            </div>

            <IntegrationRituals onComplete={handleComplete} />
        </div>
    );
}
