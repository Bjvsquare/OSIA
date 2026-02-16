import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { CheckCircle, Circle, Zap } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   OneTodayCard — Daily micro-commitment from active focus

   Shows a single actionable item pulled from the user's
   active focus area. Tap to mark complete.
   ═══════════════════════════════════════════════════════════ */

interface OneTodayCardProps {
    domain: string;
    text: string;
    completed: boolean;
    onComplete: () => void;
}

const DOMAIN_LABELS: Record<string, string> = {
    spiritual: 'Spiritual Life',
    physical_health: 'Physical Health',
    personal: 'Personal Life',
    relationships: 'Key Relationships',
    career: 'Career/Job',
    business: 'Business',
    finances: 'Finances',
};

export function OneTodayCard({ domain, text, completed, onComplete }: OneTodayCardProps) {
    return (
        <Card className={`p-5 border-white/5 overflow-hidden relative transition-all duration-300 ${completed
                ? 'bg-green-500/[0.05] border-green-500/20'
                : 'bg-gradient-to-br from-osia-teal-500/[0.05] to-transparent hover:border-osia-teal-500/20'
            }`}>
            <div className="flex items-center gap-2 mb-3">
                <Zap className={`w-4 h-4 ${completed ? 'text-green-500/70' : 'text-osia-teal-500/70'}`} />
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${completed ? 'text-green-500/70' : 'text-osia-teal-500/70'}`}>
                    One Thing Today
                </h3>
                <span className="text-[8px] font-bold text-white/20 ml-auto uppercase">
                    {DOMAIN_LABELS[domain] || domain}
                </span>
            </div>

            <button
                onClick={onComplete}
                disabled={completed}
                className="w-full flex items-center gap-3 text-left group"
            >
                <motion.div
                    className="flex-shrink-0"
                    whileTap={!completed ? { scale: 0.85 } : {}}
                >
                    {completed ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </motion.div>
                    ) : (
                        <Circle className="w-6 h-6 text-white/20 group-hover:text-osia-teal-500 transition-colors" />
                    )}
                </motion.div>
                <span className={`text-sm font-medium transition-all ${completed
                        ? 'text-white/30 line-through'
                        : 'text-white/70 group-hover:text-white'
                    }`}>
                    {text}
                </span>
            </button>

            {completed && (
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-green-500/50 mt-3 font-medium"
                >
                    ✨ Done for today. Great work.
                </motion.p>
            )}
        </Card>
    );
}
