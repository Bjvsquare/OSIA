import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { api } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import {
    Loader2, Sparkles, Target, Plus, X,
    BookOpen, Flame, Check, RefreshCw, Bell
} from 'lucide-react';
import { SocraticDialogue } from './components/SocraticDialogue';
import { ValuesMap } from './components/ValuesMap';
import { NudgeManager } from './components/NudgeManager';
import { PracticeLog } from './components/PracticeLog';
import { BlueprintRefine } from './components/BlueprintRefine';

/* ═══════════════════════════════════════════════════════════
   PracticeHubPage — Behavioral Activation System

   Three states:
   1. No values → Start Socratic Discovery CTA
   2. Values but no nudges → ValuesMap + Create Nudge CTA
   3. Active practice → ValuesMap + NudgeManager + PracticeLog

   Route: /practice
   ═══════════════════════════════════════════════════════════ */

type Tab = 'practice' | 'values' | 'refine' | 'log';

export function PracticeHubPage() {
    const { showToast, ToastComponent } = useToast();

    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('practice');
    const [showDiscovery, setShowDiscovery] = useState(false);
    const [showCreateNudge, setShowCreateNudge] = useState(false);

    // Data
    const [values, setValues] = useState<any[]>([]);
    const [discoveryCompleted, setDiscoveryCompleted] = useState(false);
    const [nudges, setNudges] = useState<any[]>([]);
    const [practiceLog, setPracticeLog] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);

    // Create nudge form
    const [newNudge, setNewNudge] = useState({ valueId: '', title: '', description: '', frequency: 'daily', context: 'anytime', notifyAt: '' });

    const fetchAll = useCallback(async () => {
        try {
            const [valData, nudgeData, logData, summaryData] = await Promise.all([
                api.getValues(),
                api.getPracticeNudges(),
                api.getPracticeLog(30),
                api.getPracticeSummary(),
            ]);
            setValues(valData.values || []);
            setDiscoveryCompleted(valData.discoveryCompleted || false);
            setNudges(nudgeData.nudges || []);
            setPracticeLog(logData);
            setSummary(summaryData);
        } catch (error) {
            console.error('[Practice] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ─── Handlers ─────────────────────────────────────────

    const handleDiscoveryComplete = async (discoveredValues: any[]) => {
        try {
            await api.saveValues(discoveredValues);
            showToast('Values discovered! Now create your practice nudges.', 'success');
            setShowDiscovery(false);

            // If any values have nudgeActivity, auto-create nudges
            const valData = await api.getValues();
            setValues(valData.values || []);
            setDiscoveryCompleted(true);

            for (const dv of discoveredValues) {
                if (dv.nudgeActivity) {
                    const matchingVal = (valData.values || []).find((v: any) => v.name === dv.name);
                    if (matchingVal) {
                        await api.createPracticeNudge({
                            valueId: matchingVal.id,
                            title: dv.nudgeActivity,
                            description: `Practice activity for ${dv.name}`,
                            frequency: 'daily',
                            context: 'anytime',
                        });
                    }
                }
            }

            await fetchAll();
        } catch (error) {
            showToast('Failed to save values', 'error');
        }
    };

    const handleCreateNudge = async () => {
        if (!newNudge.valueId || !newNudge.title) {
            showToast('Select a value and enter a title', 'error');
            return;
        }
        try {
            await api.createPracticeNudge(newNudge);
            showToast('Practice nudge created!', 'success');
            setShowCreateNudge(false);
            setNewNudge({ valueId: '', title: '', description: '', frequency: 'daily', context: 'anytime', notifyAt: '' });
            await fetchAll();
        } catch (error) {
            showToast('Failed to create nudge', 'error');
        }
    };

    const handleComplete = async (nudgeId: string, reflection?: string) => {
        try {
            await api.completePracticeNudge(nudgeId, reflection);
            showToast('Practice completed!', 'success');
            await fetchAll();
        } catch (error: any) {
            showToast(error.message || 'Failed to complete', 'error');
        }
    };

    const handleToggleActive = async (nudgeId: string, isActive: boolean) => {
        try {
            await api.updatePracticeNudge(nudgeId, { isActive });
            await fetchAll();
        } catch {
            showToast('Failed to update', 'error');
        }
    };

    const handleDelete = async (nudgeId: string) => {
        // Direct delete - no confirmation modal for now
        try {
            const authData = localStorage.getItem('OSIA_auth');
            const token = authData ? JSON.parse(authData).token : null;
            const response = await fetch(`/api/practice/nudges/${nudgeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed');
            await fetchAll();
        } catch {
            showToast('Failed to delete', 'error');
        }
    };

    const getValueName = (valueId: string) => {
        return values.find(v => v.id === valueId)?.name || 'Unknown';
    };

    const getNudgeCounts = () => {
        const counts: Record<string, number> = {};
        for (const nudge of nudges) {
            counts[nudge.valueId] = (counts[nudge.valueId] || 0) + 1;
        }
        return counts;
    };

    // ─── Loading ──────────────────────────────────────────

    if (loading) {
        return (
            <div className="w-full min-h-[calc(100vh-7rem)] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-osia-teal-500 animate-spin" />
            </div>
        );
    }

    // ─── Discovery Flow ───────────────────────────────────

    if (showDiscovery) {
        return (
            <div className="w-full min-h-[calc(100vh-7rem)] py-8 px-4">
                <SocraticDialogue
                    onComplete={handleDiscoveryComplete}
                    onCancel={() => setShowDiscovery(false)}
                />
                <ToastComponent />
            </div>
        );
    }

    // ─── Empty State: No Values ───────────────────────────

    if (!discoveryCompleted) {
        return (
            <div className="w-full min-h-[calc(100vh-7rem)] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-osia-teal-500/10 flex items-center justify-center border border-osia-teal-500/20 mx-auto mb-6">
                        <Target className="w-8 h-8 text-osia-teal-500" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white mb-3">
                        Discover Your Values
                    </h1>
                    <p className="text-sm text-white/30 mb-8 leading-relaxed">
                        A reflective dialogue to uncover your core values — then build daily practices around them.
                    </p>
                    <button
                        onClick={() => setShowDiscovery(true)}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-osia-teal-500 to-emerald-500 text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                        <Sparkles className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                        Begin Discovery
                    </button>
                    <ToastComponent />
                </motion.div>
            </div>
        );
    }

    // ─── Main Practice Hub ────────────────────────────────

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'practice', label: 'Practice', icon: <Target className="w-4 h-4" /> },
        { id: 'refine', label: 'Refine', icon: <RefreshCw className="w-4 h-4" /> },
        { id: 'values', label: 'Values', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'log', label: 'Log', icon: <BookOpen className="w-4 h-4" /> },
    ];

    return (
        <div className="w-full min-h-[calc(100vh-7rem)] text-white pb-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between pt-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-osia-teal-500/10 flex items-center justify-center border border-osia-teal-500/20">
                            <Target className="w-5 h-5 text-osia-teal-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight">Practice</h1>
                            <p className="text-[10px] text-osia-neutral-400 font-medium">
                                {summary?.activeNudgesCount || 0} active · {summary?.todayCompleted?.length || 0} done today
                                {summary?.currentStreaks?.length > 0 && (
                                    <span className="text-amber-400/60 ml-2">
                                        <Flame className="w-3 h-3 inline" /> {Math.max(...summary.currentStreaks.map((s: any) => s.streak))}d best streak
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateNudge(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-osia-teal-500/10 text-osia-teal-500 text-[10px] font-black uppercase tracking-widest hover:bg-osia-teal-500/20 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Nudge
                    </button>
                </motion.div>

                {/* Tab Bar */}
                <div className="flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/5">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id
                                ? 'bg-osia-teal-500/10 text-osia-teal-500'
                                : 'text-white/25 hover:text-white/40'
                                }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {tab === 'practice' && (
                            <NudgeManager
                                nudges={nudges}
                                valueName={getValueName}
                                todayCompleted={summary?.todayCompleted || []}
                                onComplete={handleComplete}
                                onToggleActive={handleToggleActive}
                                onDelete={handleDelete}
                            />
                        )}
                        {tab === 'values' && (
                            <div className="space-y-6">
                                <ValuesMap
                                    values={values}
                                    nudgeCounts={getNudgeCounts()}
                                />
                                <div className="text-center">
                                    <button
                                        onClick={() => setShowDiscovery(true)}
                                        className="text-[10px] font-bold text-osia-teal-500/50 hover:text-osia-teal-500 transition-colors"
                                    >
                                        Re-discover Values
                                    </button>
                                </div>
                            </div>
                        )}
                        {tab === 'refine' && (
                            <BlueprintRefine />
                        )}
                        {tab === 'log' && practiceLog && (
                            <PracticeLog
                                entries={practiceLog.entries || []}
                                totalCompletions={practiceLog.totalCompletions || 0}
                                activeDays={practiceLog.activeDays || 0}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ──────────────────────────────────────────────
                Create Nudge Modal — Chip-based, auto-populated from discovery
             ────────────────────────────────────────────── */}
            <AnimatePresence>
                {showCreateNudge && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                        onClick={() => setShowCreateNudge(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a1128] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-bold text-white">Create Practice Nudge</h3>
                                <button onClick={() => setShowCreateNudge(false)} className="text-white/30 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Value select — chips instead of dropdown */}
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2 block">
                                        Linked Value
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {values.map((v: any) => (
                                            <button
                                                key={v.id}
                                                onClick={() => setNewNudge({ ...newNudge, valueId: v.id })}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${newNudge.valueId === v.id
                                                    ? 'bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/40'
                                                    : 'bg-white/[0.03] text-white/40 border border-white/5 hover:bg-white/[0.06]'
                                                    }`}
                                            >
                                                {newNudge.valueId === v.id && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
                                                {v.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title — selectable suggestions from discovery + tomorrowAction */}
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2 block">
                                        Activity — tap to select
                                    </label>
                                    {(() => {
                                        const selectedVal = values.find((v: any) => v.id === newNudge.valueId);
                                        const suggestions: string[] = [];
                                        if (selectedVal) {
                                            // Pull from discovery data: tomorrowAction
                                            if (selectedVal.tomorrowAction) suggestions.push(selectedVal.tomorrowAction);
                                            // Pull existing practice activities for context
                                            const existingTitles = nudges.filter((n: any) => n.valueId === newNudge.valueId).map((n: any) => n.title);
                                            // Add generic suggestions based on value name
                                            const generics = [
                                                `5 minutes of ${selectedVal.name.toLowerCase()} reflection`,
                                                `Practice ${selectedVal.name.toLowerCase()} in one interaction`,
                                                `Daily ${selectedVal.name.toLowerCase()} journal entry`,
                                                `${selectedVal.name} check-in with someone`,
                                                `10-minute ${selectedVal.name.toLowerCase()} exercise`,
                                                `Morning ${selectedVal.name.toLowerCase()} intention setting`,
                                            ];
                                            generics.forEach(g => { if (!existingTitles.includes(g) && !suggestions.includes(g)) suggestions.push(g); });
                                        }
                                        return (
                                            <div className="flex flex-wrap gap-1.5">
                                                {!newNudge.valueId && (
                                                    <p className="text-[10px] text-white/15 italic">Select a value above to see suggestions</p>
                                                )}
                                                {suggestions.map((s, si) => (
                                                    <button
                                                        key={si}
                                                        onClick={() => setNewNudge({ ...newNudge, title: s, description: `Practice activity for ${values.find((v: any) => v.id === newNudge.valueId)?.name || 'your value'}` })}
                                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${newNudge.title === s
                                                            ? 'bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/30'
                                                            : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Frequency & Context */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 block">Frequency</label>
                                        <div className="flex gap-1">
                                            {['daily', 'weekly', 'situational'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setNewNudge({ ...newNudge, frequency: f })}
                                                    className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider ${newNudge.frequency === f
                                                        ? 'bg-osia-teal-500/20 text-osia-teal-500 border border-osia-teal-500/30'
                                                        : 'bg-white/5 text-white/25 border border-white/5'
                                                        }`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 block">When</label>
                                        <div className="flex gap-1">
                                            {['morning', 'evening', 'anytime'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNewNudge({ ...newNudge, context: c })}
                                                    className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider ${newNudge.context === c
                                                        ? 'bg-osia-teal-500/20 text-osia-teal-500 border border-osia-teal-500/30'
                                                        : 'bg-white/5 text-white/25 border border-white/5'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Remind Me At — notification time chips */}
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1 block">
                                        <Bell className="w-3 h-3 inline mr-1 -mt-0.5" /> Remind me at
                                    </label>
                                    <div className="flex gap-1">
                                        {[
                                            { label: '🌅 Morning', time: '06:30' },
                                            { label: '☀️ Midday', time: '12:30' },
                                            { label: '🌙 Evening', time: '19:00' },
                                            { label: '⏰ Off', time: '' },
                                        ].map(opt => (
                                            <button
                                                key={opt.label}
                                                onClick={async () => {
                                                    setNewNudge({ ...newNudge, notifyAt: opt.time });
                                                    if (opt.time && notificationService.isSupported() && notificationService.getPermission() !== 'granted') {
                                                        await notificationService.subscribe();
                                                    }
                                                }}
                                                className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold transition-all ${newNudge.notifyAt === opt.time
                                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                                    : 'bg-white/5 text-white/25 border border-white/5'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selected summary */}
                                {newNudge.valueId && newNudge.title && (
                                    <Card className="p-3 bg-osia-teal-500/5 border-osia-teal-500/10">
                                        <p className="text-[10px] text-osia-teal-500/70 font-medium">
                                            ✨ {newNudge.title} — {newNudge.frequency}, {newNudge.context}
                                            {newNudge.notifyAt && <span className="text-amber-400/60"> · 🔔 {newNudge.notifyAt}</span>}
                                        </p>
                                    </Card>
                                )}

                                <button
                                    onClick={handleCreateNudge}
                                    disabled={!newNudge.valueId || !newNudge.title}
                                    className="w-full py-2.5 rounded-xl bg-osia-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-osia-teal-600 transition-colors disabled:opacity-30"
                                >
                                    Create Nudge
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ToastComponent />
        </div>
    );
}
