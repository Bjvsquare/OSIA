import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flag, CheckCircle, Clock, ChevronRight, Plus, Star, Target } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    status: 'planned' | 'in_progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high';
    category: string;
    quarter: string;
    progress?: number;
}

const STATUS_CONFIG = {
    planned: { label: 'Planned', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Flag },
    completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
    blocked: { label: 'Blocked', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Flag }
};

const SAMPLE_ROADMAP: RoadmapItem[] = [
    {
        id: '1',
        title: 'Voice Intelligence Integration',
        description: 'Full WebRTC voice agent with real-time conversation capabilities',
        status: 'in_progress',
        priority: 'high',
        category: 'Core Features',
        quarter: 'Q1 2026',
        progress: 65
    },
    {
        id: '2',
        title: 'Team Synergy Dashboard',
        description: 'Advanced team analytics with personality mesh visualization',
        status: 'planned',
        priority: 'medium',
        category: 'Team Features',
        quarter: 'Q1 2026'
    },
    {
        id: '3',
        title: 'Mobile App Beta',
        description: 'React Native app for iOS and Android platforms',
        status: 'planned',
        priority: 'high',
        category: 'Platform',
        quarter: 'Q2 2026'
    },
    {
        id: '4',
        title: 'Enterprise SSO',
        description: 'SAML/OAuth integration for enterprise customers',
        status: 'planned',
        priority: 'medium',
        category: 'Enterprise',
        quarter: 'Q2 2026'
    },
    {
        id: '5',
        title: 'Blueprint Export API',
        description: 'Developer API for exporting user insights and patterns',
        status: 'completed',
        priority: 'medium',
        category: 'Developer',
        quarter: 'Q4 2025',
        progress: 100
    },
    {
        id: '6',
        title: 'Founding Circle Perks',
        description: 'Exclusive features and benefits for founding members',
        status: 'completed',
        priority: 'high',
        category: 'Community',
        quarter: 'Q4 2025',
        progress: 100
    }
];

export function PlatformPlanning() {
    const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
    const [roadmap] = useState<RoadmapItem[]>(SAMPLE_ROADMAP);

    const quarters = ['all', ...new Set(roadmap.map(item => item.quarter))];
    const filteredItems = selectedQuarter === 'all'
        ? roadmap
        : roadmap.filter(item => item.quarter === selectedQuarter);

    const stats = {
        total: roadmap.length,
        completed: roadmap.filter(i => i.status === 'completed').length,
        inProgress: roadmap.filter(i => i.status === 'in_progress').length,
        planned: roadmap.filter(i => i.status === 'planned').length
    };

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-osia-neutral-500 mb-2">
                        <Target className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Total Items</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </Card>
                <Card className="p-4 bg-green-500/10 border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-green-300">{stats.completed}</p>
                </Card>
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                        <Flag className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">In Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-300">{stats.inProgress}</p>
                </Card>
                <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Planned</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-300">{stats.planned}</p>
                </Card>
            </div>

            {/* Quarter Filter */}
            <div className="flex flex-wrap gap-2">
                {quarters.map(quarter => (
                    <button
                        key={quarter}
                        onClick={() => setSelectedQuarter(quarter)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${selectedQuarter === quarter
                                ? 'bg-osia-teal-500 text-white'
                                : 'bg-white/5 text-osia-neutral-400 hover:bg-white/10'
                            }`}
                    >
                        {quarter === 'all' ? 'All Quarters' : quarter}
                    </button>
                ))}
            </div>

            {/* Roadmap Timeline */}
            <div className="space-y-4">
                {filteredItems.map((item, index) => {
                    const StatusIcon = STATUS_CONFIG[item.status].icon;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-5 hover:bg-white/[0.03] transition-colors group">
                                <div className="flex items-start gap-4">
                                    {/* Status Icon */}
                                    <div className={`p-2 rounded-lg ${STATUS_CONFIG[item.status].color.split(' ')[0]}`}>
                                        <StatusIcon className={`w-5 h-5 ${STATUS_CONFIG[item.status].color.split(' ')[1]}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h4 className="font-bold text-white">{item.title}</h4>
                                            <span className={`px-2 py-0.5 text-[10px] rounded-full border ${STATUS_CONFIG[item.status].color}`}>
                                                {STATUS_CONFIG[item.status].label}
                                            </span>
                                            {item.priority === 'high' && (
                                                <span className="flex items-center gap-1 text-[10px] text-orange-400">
                                                    <Star className="w-3 h-3" fill="currentColor" />
                                                    High Priority
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-osia-neutral-400 mt-1">{item.description}</p>

                                        {/* Meta */}
                                        <div className="flex items-center gap-4 mt-3 text-xs text-osia-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.quarter}
                                            </span>
                                            <span className="px-2 py-0.5 bg-white/5 rounded text-osia-neutral-400">
                                                {item.category}
                                            </span>
                                        </div>

                                        {/* Progress bar for in-progress items */}
                                        {item.status === 'in_progress' && item.progress !== undefined && (
                                            <div className="mt-3">
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.progress}%` }}
                                                        className="h-full bg-gradient-to-r from-osia-teal-500 to-purple-500"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-osia-neutral-500 mt-1">{item.progress}% complete</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="w-5 h-5 text-osia-neutral-600 group-hover:text-white transition-colors" />
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Add New Item Button */}
            <div className="flex justify-center pt-4">
                <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Roadmap Item
                </Button>
            </div>
        </div>
    );
}
