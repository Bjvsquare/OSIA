import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../auth/AuthContext';
import { Sparkles, BarChart3, Users, Settings, ArrowRight, Activity, Brain, Heart, MessageCircle, Zap, Shield } from 'lucide-react';

interface LayerCardProps {
    id: string;
    name: string;
    icon: React.ElementType;
    status: 'Emerging' | 'Developing' | 'Stable' | 'Later';
    description: string;
    onClick: () => void;
}

const LayerCard: React.FC<LayerCardProps> = ({ name, icon: Icon, status, description, onClick }) => {
    const isLater = status === 'Later';
    const statusColors: Record<string, string> = {
        Stable: 'bg-osia-teal-500/20 text-osia-teal-400 border-osia-teal-500/30',
        Developing: 'bg-white/10 text-white/80 border-white/20',
        Emerging: 'bg-osia-purple-500/20 text-osia-purple-400 border-osia-purple-500/30',
        Later: 'bg-white/5 text-osia-neutral-600 border-white/10'
    };

    const cardClass = `p-5 border-white/5 bg-[#0a1128]/50 backdrop-blur-xl transition-all duration-300 ${!isLater ? 'hover:border-osia-teal-500/20 hover:shadow-[0_0_30px_rgba(56,163,165,0.08)]' : ''}`;

    return (
        <motion.div
            whileHover={!isLater ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isLater ? { scale: 0.98 } : {}}
            onClick={!isLater ? onClick : undefined}
            className={`cursor-pointer group ${isLater ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
            <Card className={cardClass}>
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLater ? 'bg-white/5' : 'bg-osia-teal-500/10 group-hover:bg-osia-teal-500/20'} transition-colors`}>
                        <Icon className={`w-5 h-5 ${isLater ? 'text-osia-neutral-600' : 'text-osia-teal-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white truncate">{name}</h4>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusColors[status]}`}>
                                {status}
                            </span>
                        </div>
                        <p className="text-[11px] text-osia-neutral-500 leading-relaxed">{description}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export function TwinHome() {
    const navigate = useNavigate();
    const { showToast, ToastComponent } = useToast();
    const { userProfile, refreshProfile } = useAuth();

    const [searchParams] = useSearchParams();

    React.useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            setTimeout(() => {
                refreshProfile();
                showToast('Identity updated. New subscription active.', 'success');
            }, 1500);
        }
    }, [searchParams, refreshProfile, showToast]);

    const firstName = userProfile?.name?.split(' ')[0] || 'Explorer';

    const layers = [
        { id: 'decision_patterns', name: 'Decision Patterns', icon: Brain, status: 'Developing' as const, description: 'How you navigate choices under certainty and uncertainty.' },
        { id: 'energy_recovery', name: 'Energy & Recovery', icon: Zap, status: 'Stable' as const, description: 'What fuels you and how you recharge.' },
        { id: 'relational_dynamics', name: 'Relational Dynamics', icon: Heart, status: 'Emerging' as const, description: 'Your patterns in connection, trust, and conflict.' },
        { id: 'communication_style', name: 'Communication Style', icon: MessageCircle, status: 'Developing' as const, description: 'How you express, listen, and bridge understanding.' },
        { id: 'growth_edge', name: 'Growth Edge', icon: Activity, status: 'Later' as const, description: 'Unlocks as more signals are gathered.' }
    ];

    const quickActions = [
        { label: 'View Insights', icon: BarChart3, path: '/insight/first', color: 'from-osia-teal-500/20 to-osia-teal-500/5' },
        { label: 'Team Setup', icon: Users, path: '/team', color: 'from-osia-purple-500/20 to-osia-purple-500/5' },
        { label: 'Settings', icon: Settings, path: '/settings', color: 'from-white/10 to-white/5' }
    ];

    return (
        <div className="w-full min-h-[calc(100vh-7rem)] text-white relative pb-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Welcome Header */}
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
                                Your cognitive mirror is evolving.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Blueprint Status Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="p-5 border-white/5 bg-[#0a1128]/40 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-osia-teal-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-400">Blueprint Status</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-osia-teal-500 bg-osia-teal-500/10 px-3 py-1 rounded-full border border-osia-teal-500/20">
                                Forming
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-osia-teal-500">Forming</div>
                                <div className="h-1.5 bg-osia-teal-500/20 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-osia-teal-500 to-osia-teal-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: '65%' }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">Syncing</div>
                                <div className="h-1.5 bg-white/5 rounded-full" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="text-[9px] font-bold uppercase tracking-widest text-white/15">Stable</div>
                                <div className="h-1.5 bg-white/5 rounded-full" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
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

                {/* Layer Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-osia-neutral-400">Your Layers</h2>
                        <button
                            onClick={() => navigate('/insight/first')}
                            className="flex items-center gap-1 text-[10px] font-bold text-osia-teal-500 hover:text-osia-teal-400 transition-colors uppercase tracking-widest"
                        >
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {layers.map((layer) => (
                            <LayerCard
                                key={layer.id}
                                {...layer}
                                onClick={() => navigate(`/layer/${layer.id}`)}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
            <ToastComponent />
        </div>
    );
}
