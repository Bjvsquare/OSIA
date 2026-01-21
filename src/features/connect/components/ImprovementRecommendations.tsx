import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Brain, TrendingUp, Scale, Send, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../auth/AuthContext';

interface Recommendation {
    id: string;
    title: string;
    description: string;
    category: 'communication' | 'understanding' | 'growth' | 'balance';
    priority: number;
    affectedLayers: number[];
    shareable: boolean;
}

interface ImprovementRecommendationsProps {
    recommendations: Recommendation[];
    targetUserId: string;
    targetName: string;
}

export function ImprovementRecommendations({ recommendations, targetUserId, targetName }: ImprovementRecommendationsProps) {
    const { auth } = useAuth();
    const [sharingId, setSharingId] = useState<string | null>(null);
    const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'communication': return <MessageSquare className="w-5 h-5" />;
            case 'understanding': return <Brain className="w-5 h-5" />;
            case 'growth': return <TrendingUp className="w-5 h-5" />;
            case 'balance': return <Scale className="w-5 h-5" />;
            default: return <Brain className="w-5 h-5" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'communication': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'understanding': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            case 'growth': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'balance': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            default: return 'text-osia-teal-400 bg-osia-teal-500/10 border-osia-teal-500/20';
        }
    };

    const handleShare = async (rec: Recommendation) => {
        if (sharedIds.has(rec.id)) return;

        setSharingId(rec.id);
        try {
            await axios.post('/api/connect/share-insight', {
                toUserId: targetUserId,
                insightType: 'recommendation',
                title: rec.title,
                content: rec.description,
                affectedLayers: rec.affectedLayers,
                category: rec.category
            }, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });

            setSharedIds(prev => new Set(prev).add(rec.id));
        } catch (error) {
            console.error('Failed to share insight:', error);
        } finally {
            setSharingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-osia-teal-400" />
                <h3 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-[0.2em]">
                    Improvement Recommendations
                </h3>
            </div>

            {recommendations.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center">
                    <p className="text-sm text-osia-neutral-400">No specific recommendations at this time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, index) => (
                        <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-5 rounded-xl border transition-all ${getCategoryColor(rec.category)}`}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${getCategoryColor(rec.category)}`}>
                                    {getCategoryIcon(rec.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="font-bold text-white truncate">{rec.title}</h4>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-osia-neutral-400 uppercase flex-shrink-0">
                                            #{rec.priority}
                                        </span>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-osia-neutral-400">
                                        {rec.category}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-osia-neutral-200 mb-4">{rec.description}</p>

                            {/* Affected layers */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1">
                                    {rec.affectedLayers.slice(0, 5).map(l => (
                                        <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-osia-neutral-400 border border-white/10">
                                            L{l}
                                        </span>
                                    ))}
                                </div>

                                {/* Share button */}
                                {rec.shareable && (
                                    <button
                                        onClick={() => handleShare(rec)}
                                        disabled={sharingId === rec.id || sharedIds.has(rec.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sharedIds.has(rec.id)
                                                ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                                                : 'bg-osia-teal-500/20 text-osia-teal-400 hover:bg-osia-teal-500/30'
                                            }`}
                                    >
                                        {sharingId === rec.id ? (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Sending...
                                            </>
                                        ) : sharedIds.has(rec.id) ? (
                                            <>
                                                <Check className="w-3 h-3" />
                                                Shared
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-3 h-3" />
                                                Share with {targetName}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Share confirmation toast */}
            <AnimatePresence>
                {sharedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 px-4 py-3 bg-emerald-500/90 text-white rounded-xl shadow-lg flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">{targetName} will be notified</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
