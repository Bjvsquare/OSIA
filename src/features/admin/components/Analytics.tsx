import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { ArrowUpRight, ArrowDownRight, Users, Calendar, TrendingUp, Activity } from 'lucide-react';

export function Analytics({ data }: { data?: any }) {
    const stats = [
        { label: 'Verified Identities', value: data?.totalUsers?.toLocaleString() || '---', diff: '+0%', isUp: true },
        { label: 'Cognitive Sync', value: `${Math.round(data?.completionRate || 0)}%`, diff: 'Stable', isUp: true },
        { label: 'Active Signals', value: data?.activeUsers?.toLocaleString() || '---', diff: 'Live', isUp: true },
        { label: 'Stream Latency', value: '12ms', diff: 'Optimal', isUp: true },
    ];

    // User activity metrics
    const activityMetrics = [
        { label: 'DAU', value: data?.dau || 0, description: 'Daily Active Users', color: 'text-osia-teal-400', bg: 'bg-osia-teal-500/20', icon: Activity },
        { label: 'WAU', value: data?.wau || 0, description: 'Weekly Active Users', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Calendar },
        { label: 'MAU', value: data?.mau || 0, description: 'Monthly Active Users', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Users },
        { label: 'Retention', value: data?.retention ? `${data.retention}%` : '—', description: '30-Day Retention', color: 'text-green-400', bg: 'bg-green-500/20', icon: TrendingUp },
    ];

    return (
        <div className="space-y-8">
            {/* DAU/WAU/MAU Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activityMetrics.map((metric, i) => (
                    <Card key={i} className={`p-5 border-white/5 ${metric.bg} space-y-3`}>
                        <div className="flex items-center gap-2">
                            <metric.icon className={`w-4 h-4 ${metric.color}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider text-osia-neutral-400">{metric.label}</span>
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black ${metric.color}`}>{metric.value}</h3>
                            <p className="text-[9px] text-osia-neutral-500 mt-1">{metric.description}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Original Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="p-6 border-white/5 bg-[#0a1128]/40 space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-600">{stat.label}</span>
                            <div className={`flex items-center gap-1 text-[9px] font-bold ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.diff}
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 border-white/5 bg-[#0a1128]/40 space-y-8">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-white tracking-tight">Signal Activity (7d)</h4>
                        <div className="flex gap-2">
                            {['D', 'W', 'M'].map(p => (
                                <button key={p} className={`px-2 py-1 text-[9px] font-black rounded ${p === 'W' ? 'bg-osia-teal-500 text-white' : 'text-osia-neutral-600 hover:text-white'}`}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Mock Chart Area */}
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {[40, 65, 45, 90, 75, 55, 85].map((h, i) => (
                            <div key={i} className="flex-1 group relative">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 1 }}
                                    className="bg-gradient-to-t from-osia-teal-500/20 to-osia-teal-500 rounded-t-lg group-hover:to-osia-purple-500 transition-colors"
                                />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-osia-deep-900 text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h * 10}s
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-osia-neutral-700 uppercase tracking-[0.2em] px-2">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </Card>

                <Card className="p-8 border-white/5 bg-[#0a1128]/40 space-y-10">
                    <h4 className="text-lg font-bold text-white tracking-tight">Regional Distribution</h4>
                    <div className="space-y-6">
                        {(data?.regional_clusters || [
                            { name: 'Blueprint', count: 0, percent: 92 },
                            { name: 'Deepening', count: 0, percent: 68 },
                            { name: 'Connect', count: 0, percent: 45 },
                            { name: 'Team', count: 0, percent: 31 }
                        ].map((s, i) => ({ ...s, color: ['bg-osia-teal-400', 'bg-osia-purple-400', 'bg-blue-400', 'bg-amber-400'][i % 4] }))).map((s: any) => (
                            <div key={s.name} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500">
                                    <span>{s.name}</span>
                                    <span>{Math.round(s.percent || 0)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${s.percent || 0}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className={`h-full ${s.color || 'bg-osia-teal-400'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
