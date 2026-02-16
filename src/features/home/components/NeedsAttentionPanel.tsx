import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { AlertTriangle, Clock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   NeedsAttentionPanel — Auto-detected neglected life areas

   Shows areas with no activity >7 days or declining scores.
   ═══════════════════════════════════════════════════════════ */

interface AttentionItem {
    domain: string;
    reason: string;
    daysSince: number;
}

interface NeedsAttentionPanelProps {
    items: AttentionItem[];
    onAreaClick: (domain: string) => void;
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

export function NeedsAttentionPanel({ items, onAreaClick }: NeedsAttentionPanelProps) {
    if (items.length === 0) return null;

    return (
        <Card className="p-5 border-amber-500/10 bg-amber-500/[0.03]">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500/70" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500/70">
                    Needs Attention
                </h3>
            </div>
            <div className="space-y-2.5">
                {items.map((item, i) => (
                    <motion.button
                        key={`${item.domain}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onAreaClick(item.domain)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-amber-500/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                                {DOMAIN_LABELS[item.domain] || item.domain}
                            </p>
                            <p className="text-[10px] text-white/30 truncate">{item.reason}</p>
                        </div>
                        <span className="text-[9px] font-bold text-amber-500/50 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            {item.daysSince}d
                        </span>
                    </motion.button>
                ))}
            </div>
        </Card>
    );
}
