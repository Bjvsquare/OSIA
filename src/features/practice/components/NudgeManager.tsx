import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import {
    CheckCircle, Circle, Flame,
    Pause, Play, Trash2, Loader2, MessageSquare, X, Bell,
    PartyPopper, Plus, TrendingUp
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   NudgeManager — Compact Card Grid (Mobile-First)

   Displays practice nudges as small, tappable cards in a
   responsive grid matching the ValuesMap card style.
   Shows a completion state when all today's tasks are done.
   ═══════════════════════════════════════════════════════════ */

interface PracticeNudge {
    id: string;
    valueId: string;
    title: string;
    description: string;
    frequency: string;
    context: string;
    isActive: boolean;
    streak: number;
    totalCompletions: number;
    notifyAt?: string;
}

interface NudgeManagerProps {
    nudges: PracticeNudge[];
    valueName: (valueId: string) => string;
    todayCompleted: string[];
    onComplete: (nudgeId: string, reflection?: string) => Promise<void>;
    onToggleActive: (nudgeId: string, isActive: boolean) => Promise<void>;
    onDelete: (nudgeId: string) => Promise<void>;
    onCreateNew?: () => void;
}

const contextIcons: Record<string, string> = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌙',
    anytime: '⏰',
};

export function NudgeManager({ nudges, valueName, todayCompleted, onComplete, onToggleActive, onDelete, onCreateNew }: NudgeManagerProps) {
    const [reflectionId, setReflectionId] = useState<string | null>(null);
    const [reflectionText, setReflectionText] = useState('');
    const [completing, setCompleting] = useState<string | null>(null);

    const activeNudges = nudges.filter(n => n.isActive);
    const pausedNudges = nudges.filter(n => !n.isActive);

    // ── Completion detection ──────────────────
    const allDone = useMemo(() => {
        if (activeNudges.length === 0) return false;
        return activeNudges.every(n => todayCompleted.includes(n.id));
    }, [activeNudges, todayCompleted]);

    const totalStreak = useMemo(() => {
        return activeNudges.reduce((sum, n) => sum + n.streak, 0);
    }, [activeNudges]);

    const totalCompletions = useMemo(() => {
        return nudges.reduce((sum, n) => sum + n.totalCompletions, 0);
    }, [nudges]);

    const handleTap = async (nudgeId: string) => {
        const isDone = todayCompleted.includes(nudgeId);
        if (isDone) return;

        if (reflectionId === nudgeId) {
            // Second tap — submit with reflection
            setCompleting(nudgeId);
            await onComplete(nudgeId, reflectionText || undefined);
            setReflectionId(null);
            setReflectionText('');
            setCompleting(null);
        } else {
            // First tap — open reflection option
            setReflectionId(nudgeId);
            setReflectionText('');
        }
    };

    const skipReflection = async (nudgeId: string) => {
        setCompleting(nudgeId);
        await onComplete(nudgeId);
        setReflectionId(null);
        setReflectionText('');
        setCompleting(null);
    };

    const renderCard = (nudge: PracticeNudge, i: number) => {
        const isDone = todayCompleted.includes(nudge.id);
        const showReflection = reflectionId === nudge.id && !isDone;

        return (
            <motion.div
                key={nudge.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
            >
                <Card
                    className={`p-3.5 border-white/5 transition-all relative overflow-hidden ${isDone
                        ? 'bg-green-500/[0.04] border-green-500/15'
                        : 'bg-white/[0.02] hover:bg-white/[0.04]'
                        } ${!nudge.isActive ? 'opacity-35' : ''}`}
                >
                    {/* Main content — tap to complete */}
                    <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => nudge.isActive && handleTap(nudge.id)}
                    >
                        {/* Status indicator */}
                        <div className="mt-0.5 flex-shrink-0">
                            {completing === nudge.id ? (
                                <Loader2 className="w-5 h-5 text-osia-teal-500 animate-spin" />
                            ) : isDone ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <Circle className="w-5 h-5 text-white/15" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-bold truncate ${isDone ? 'text-white/25 line-through' : 'text-white/80'}`}>
                                {nudge.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[8px] font-bold text-osia-teal-500/50 uppercase">{valueName(nudge.valueId)}</span>
                                <span className="text-[8px] text-white/20">{contextIcons[nudge.context]} {nudge.context}</span>
                                {nudge.notifyAt && (
                                    <span className="text-[8px] text-amber-400/40 flex items-center gap-0.5">
                                        <Bell className="w-2.5 h-2.5" /> {nudge.notifyAt}
                                    </span>
                                )}
                                {nudge.streak > 0 && (
                                    <span className="text-[8px] text-amber-400/50 flex items-center gap-0.5">
                                        <Flame className="w-2.5 h-2.5" /> {nudge.streak}d
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Inline reflection + quick actions */}
                    <AnimatePresence>
                        {showReflection && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
                                    <div className="flex items-center gap-1.5 text-[8px] text-white/20">
                                        <MessageSquare className="w-2.5 h-2.5" />
                                        <span>Quick reflection (optional)</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="text"
                                            value={reflectionText}
                                            onChange={e => setReflectionText(e.target.value)}
                                            placeholder="How did it go?"
                                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[10px] placeholder:text-white/15 focus:outline-none focus:border-osia-teal-500/40"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleTap(nudge.id)}
                                            className="px-2.5 py-1.5 rounded-lg bg-osia-teal-500/20 text-osia-teal-400 text-[8px] font-black uppercase"
                                        >
                                            Done
                                        </button>
                                        <button
                                            onClick={() => skipReflection(nudge.id)}
                                            className="px-2 py-1.5 rounded-lg bg-white/5 text-white/30 text-[8px] font-bold"
                                        >
                                            Skip
                                        </button>
                                        <button
                                            onClick={() => setReflectionId(null)}
                                            className="p-1.5 rounded-lg text-white/15 hover:text-white/30"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Subtle action row — visible on long-press/hover */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/[0.03]">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleActive(nudge.id, !nudge.isActive); }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[7px] font-bold text-white/15 hover:text-white/30 hover:bg-white/5 transition-all uppercase tracking-wider"
                        >
                            {nudge.isActive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                            {nudge.isActive ? 'Pause' : 'Resume'}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(nudge.id); }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[7px] font-bold text-red-400/20 hover:text-red-400/50 hover:bg-red-500/5 transition-all uppercase tracking-wider ml-auto"
                        >
                            <Trash2 className="w-2.5 h-2.5" /> Remove
                        </button>
                    </div>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="space-y-5">
            {/* ── ALL DONE Celebration ────────────── */}
            <AnimatePresence>
                {allDone && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-osia-teal-500/10 border-green-500/20 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
                                className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-osia-teal-500 flex items-center justify-center mx-auto mb-4"
                            >
                                <PartyPopper className="w-7 h-7 text-white" />
                            </motion.div>
                            <h3 className="text-sm font-bold text-white mb-1">All Done for Today!</h3>
                            <p className="text-[10px] text-white/30 mb-4">
                                You completed all {activeNudges.length} practice{activeNudges.length !== 1 ? 's' : ''}. Keep the momentum going.
                            </p>

                            {/* Stats row */}
                            <div className="flex items-center justify-center gap-6 mb-5">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-amber-400">
                                        <Flame className="w-3.5 h-3.5" />
                                        <span className="text-sm font-bold">{totalStreak}</span>
                                    </div>
                                    <span className="text-[7px] text-white/20 uppercase tracking-wider">Streak Days</span>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-green-400">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span className="text-sm font-bold">{totalCompletions}</span>
                                    </div>
                                    <span className="text-[7px] text-white/20 uppercase tracking-wider">Total Done</span>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-osia-teal-400">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span className="text-sm font-bold">{nudges.length}</span>
                                    </div>
                                    <span className="text-[7px] text-white/20 uppercase tracking-wider">Practices</span>
                                </div>
                            </div>

                            {onCreateNew && (
                                <button
                                    onClick={onCreateNew}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-osia-teal-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Create New Practice
                                </button>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active nudges */}
            {activeNudges.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400 px-1 mb-3">
                        Today's Practice
                        {todayCompleted.length > 0 && (
                            <span className="ml-2 text-green-400/50">
                                {todayCompleted.filter(id => activeNudges.some(n => n.id === id)).length}/{activeNudges.length}
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeNudges.map((n, i) => renderCard(n, i))}
                    </div>
                </div>
            )}

            {/* Paused nudges */}
            {pausedNudges.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/15 px-1 mb-3">
                        Paused
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pausedNudges.map((n, i) => renderCard(n, i))}
                    </div>
                </div>
            )}

            {nudges.length === 0 && (
                <Card className="p-6 border-white/5 bg-white/[0.02] text-center">
                    <p className="text-xs text-white/20 mb-3">No practice nudges yet. Create some from your values.</p>
                    {onCreateNew && (
                        <button
                            onClick={onCreateNew}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-osia-teal-500/20 to-purple-500/20 border border-osia-teal-500/30 text-osia-teal-400 text-[10px] font-black uppercase tracking-widest hover:from-osia-teal-500/30 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" /> Create Practice
                        </button>
                    )}
                </Card>
            )}
        </div>
    );
}

