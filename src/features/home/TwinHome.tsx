import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../services/api';
import {
    Sparkles, BarChart3, Users, Settings, Loader2,
    X, Check, Target
} from 'lucide-react';
import { LifeAreaRadar } from './components/LifeAreaRadar';
import { ActiveFocusAreas } from './components/ActiveFocusAreas';
import { NeedsAttentionPanel } from './components/NeedsAttentionPanel';
import { OneTodayCard } from './components/OneTodayCard';

/* ═══════════════════════════════════════════════════════════
   TwinHome — Life Command Center Dashboard

   "Where am I? What needs work? What am I currently doing?"

   Widgets:
   1. Welcome Header + Summary
   2. Life Area Radar (7-axis spider chart)
   3. Active Focus Areas
   4. Needs Attention
   5. One Thing Today
   6. Quick Actions
   ═══════════════════════════════════════════════════════════ */

const DOMAIN_META: Record<string, { label: string; icon: string }> = {
    spiritual: { label: 'Spiritual Life', icon: '🕯️' },
    physical_health: { label: 'Physical Health', icon: '💪' },
    personal: { label: 'Personal Life', icon: '🪞' },
    relationships: { label: 'Key Relationships', icon: '❤️' },
    career: { label: 'Career/Job', icon: '📈' },
    business: { label: 'Business', icon: '🏢' },
    finances: { label: 'Finances', icon: '💰' },
};

export function TwinHome() {
    const navigate = useNavigate();
    const { showToast, ToastComponent } = useToast();
    const { userProfile, refreshProfile } = useAuth();
    const [searchParams] = useSearchParams();

    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [scoreEditModal, setScoreEditModal] = useState<{ domain: string; score: number } | null>(null);
    const [focusModal, setFocusModal] = useState(false);
    const [tempScore, setTempScore] = useState(5);
    const [focusGoal, setFocusGoal] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Handle Stripe checkout return
    React.useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            setTimeout(() => {
                refreshProfile();
                showToast('Identity updated. New subscription active.', 'success');
            }, 1500);
        }
    }, [searchParams, refreshProfile, showToast]);

    const fetchDashboard = useCallback(async () => {
        try {
            const data = await api.getDashboardSummary();
            setDashboard(data);
        } catch (error) {
            console.error('[Dashboard] Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    const firstName = userProfile?.name?.split(' ')[0] || 'Explorer';

    // ─── Actions ──────────────────────────────────────────

    const handleScoreSave = async () => {
        if (!scoreEditModal) return;
        setActionLoading(true);
        try {
            await api.updateLifeAreaScore(scoreEditModal.domain, tempScore);
            showToast(`Score updated to ${tempScore}/10`, 'success');
            setScoreEditModal(null);
            await fetchDashboard();
        } catch (error) {
            showToast('Failed to update score', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveFocus = async (domain: string) => {
        try {
            await api.setLifeAreaFocus(domain, false);
            await fetchDashboard();
        } catch {
            showToast('Failed to update focus', 'error');
        }
    };

    const handleAddFocus = async (domain: string) => {
        setActionLoading(true);
        try {
            await api.setLifeAreaFocus(domain, true, focusGoal || undefined);
            showToast(`${DOMAIN_META[domain]?.label || domain} set as active focus`, 'success');
            setFocusModal(false);
            setFocusGoal('');
            await fetchDashboard();
        } catch {
            showToast('Failed to set focus', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteToday = async () => {
        if (!dashboard?.oneToday) return;
        try {
            await api.completeOneThingToday(dashboard.oneToday.domain);
            showToast('Well done! Marked as complete.', 'success');
            await fetchDashboard();
        } catch {
            showToast('Failed to complete', 'error');
        }
    };

    // ─── Quick Actions ────────────────────────────────────

    const quickActions = [
        { label: 'View Insights', icon: BarChart3, path: '/insight/first', color: 'from-osia-teal-500/20 to-osia-teal-500/5' },
        { label: 'Team Setup', icon: Users, path: '/team', color: 'from-osia-purple-500/20 to-osia-purple-500/5' },
        { label: 'Settings', icon: Settings, path: '/settings', color: 'from-white/10 to-white/5' }
    ];

    // ─── Loading State ────────────────────────────────────

    if (loading) {
        return (
            <div className="w-full min-h-[calc(100vh-7rem)] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-osia-teal-500 animate-spin" />
            </div>
        );
    }

    const areas = dashboard?.areas || [];
    const radarAreas = areas.map((a: any) => ({
        domain: a.domain,
        healthScore: a.healthScore,
        label: DOMAIN_META[a.domain]?.label || a.domain,
        icon: DOMAIN_META[a.domain]?.icon || '📊',
    }));

    // Areas not yet active-focused (for add-focus modal)
    const activeDomains = new Set((dashboard?.activeFocusAreas || []).map((a: any) => a.domain));
    const availableFocusAreas = areas.filter((a: any) => !activeDomains.has(a.domain));

    return (
        <div className="w-full min-h-[calc(100vh-7rem)] text-white relative pb-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* ▷ Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 pt-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-osia-teal-500/10 flex items-center justify-center border border-osia-teal-500/20">
                            <Sparkles className="w-6 h-6 text-osia-teal-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">
                                Welcome back, {firstName}
                            </h1>
                            <p className="text-sm text-osia-neutral-400 font-medium">
                                {dashboard?.activeFocusAreas?.length
                                    ? `Focusing on ${dashboard.activeFocusAreas.map((a: any) => DOMAIN_META[a.domain]?.label || a.domain).join(', ')}`
                                    : 'Your life command center.'
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* ▷ Main Grid: Radar + Right Column */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left: Life Area Radar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="p-6 border-white/5 bg-[#0a1128]/40 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400">
                                    Life Area Radar
                                </h2>
                                <span className="text-[9px] font-bold text-white/20">
                                    Click to edit scores
                                </span>
                            </div>
                            <LifeAreaRadar
                                areas={radarAreas}
                                onScoreEdit={(domain, score) => {
                                    setScoreEditModal({ domain, score });
                                    setTempScore(score);
                                }}
                            />
                        </Card>
                    </motion.div>

                    {/* Right: Focus + Attention + One Thing Today */}
                    <div className="space-y-6">
                        {/* Active Focus Areas */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-400 mb-3 px-1">
                                Active Focus
                            </h2>
                            <ActiveFocusAreas
                                areas={dashboard?.activeFocusAreas || []}
                                onRemoveFocus={handleRemoveFocus}
                                onAddFocus={() => setFocusModal(true)}
                            />
                        </motion.div>

                        {/* One Thing Today */}
                        {dashboard?.oneToday && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <OneTodayCard
                                    domain={dashboard.oneToday.domain}
                                    text={dashboard.oneToday.text}
                                    completed={dashboard.oneToday.completed}
                                    onComplete={handleCompleteToday}
                                />
                            </motion.div>
                        )}

                        {/* Needs Attention */}
                        {dashboard?.needsAttention?.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                            >
                                <NeedsAttentionPanel
                                    items={dashboard.needsAttention}
                                    onAreaClick={(domain) => {
                                        setScoreEditModal({ domain, score: areas.find((a: any) => a.domain === domain)?.healthScore || 5 });
                                        setTempScore(areas.find((a: any) => a.domain === domain)?.healthScore || 5);
                                    }}
                                />
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* ▷ Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-3 gap-4"
                >
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className="group relative p-4 rounded-2xl border border-white/5 bg-[#0a1128]/40 backdrop-blur-xl hover:border-white/10 transition-all duration-300"
                        >
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <div className="relative flex flex-col items-center gap-3 py-1">
                                <action.icon className="w-5 h-5 text-osia-neutral-400 group-hover:text-white transition-colors" />
                                <span className="text-xs font-bold text-osia-neutral-400 group-hover:text-white transition-colors">{action.label}</span>
                            </div>
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* ──────────────────────────────────────────────
               Score Edit Modal
            ────────────────────────────────────────────── */}
            <AnimatePresence>
                {scoreEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                        onClick={() => setScoreEditModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a1128] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-bold text-white">
                                    {DOMAIN_META[scoreEditModal.domain]?.icon}{' '}
                                    {DOMAIN_META[scoreEditModal.domain]?.label || scoreEditModal.domain}
                                </h3>
                                <button onClick={() => setScoreEditModal(null)} className="text-white/30 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
                                How healthy is this area? (1-10)
                            </p>

                            {/* Score Slider */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min={1}
                                        max={10}
                                        value={tempScore}
                                        onChange={e => setTempScore(parseInt(e.target.value))}
                                        className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-osia-teal-500"
                                    />
                                    <span className={`text-2xl font-black min-w-[2ch] text-right ${tempScore >= 7 ? 'text-green-400' : tempScore >= 4 ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                        {tempScore}
                                    </span>
                                </div>

                                {/* Score labels */}
                                <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider px-1">
                                    <span className="text-red-400/50">Crisis</span>
                                    <span className="text-amber-400/50">Okay</span>
                                    <span className="text-green-400/50">Thriving</span>
                                </div>

                                <button
                                    onClick={handleScoreSave}
                                    disabled={actionLoading}
                                    className="w-full py-2.5 rounded-xl bg-osia-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-osia-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    Save Score
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ──────────────────────────────────────────────
               Add Focus Modal
            ────────────────────────────────────────────── */}
            <AnimatePresence>
                {focusModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                        onClick={() => setFocusModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a1128] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-osia-teal-500" />
                                    <h3 className="text-sm font-bold text-white">Set Active Focus</h3>
                                </div>
                                <button onClick={() => setFocusModal(false)} className="text-white/30 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-[10px] text-white/30 mb-4">
                                Choose an area to focus on. You can have up to 3 active focus areas.
                            </p>

                            <div className="space-y-2 mb-4 max-h-[250px] overflow-y-auto">
                                {availableFocusAreas.map((area: any) => {
                                    const meta = DOMAIN_META[area.domain] || { label: area.domain, icon: '📊' };
                                    return (
                                        <button
                                            key={area.domain}
                                            onClick={() => handleAddFocus(area.domain)}
                                            disabled={actionLoading}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left group disabled:opacity-50"
                                        >
                                            <span className="text-lg">{meta.icon}</span>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-white/70 group-hover:text-white">{meta.label}</p>
                                                <p className="text-[9px] text-white/25">Score: {area.healthScore}/10</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Optional goal input */}
                            <input
                                type="text"
                                value={focusGoal}
                                onChange={e => setFocusGoal(e.target.value)}
                                placeholder="Optional: What's your goal for this area?"
                                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-osia-teal-500/50 mb-3"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ToastComponent />
        </div>
    );
}
