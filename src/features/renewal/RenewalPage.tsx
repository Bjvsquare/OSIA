import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RenewalReview } from './components/RenewalReview';
import { DataControls } from './components/DataControls';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RefreshCw, ShieldAlert, History, FileText, ChevronRight, Lock } from 'lucide-react';

export function RenewalPage() {
    const [activeTab, setActiveTab] = useState<'hub' | 'review' | 'data'>('hub');

    const handleReviewComplete = () => {
        setActiveTab('hub');
    };

    if (activeTab === 'review') {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('hub')}>
                        Back to Hub
                    </Button>
                    <h1 className="text-2xl font-bold text-white">Renewal Review</h1>
                </div>
                <RenewalReview onComplete={handleReviewComplete} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Renewal & Agency</h1>
                    <p className="text-osia-neutral-400 mt-1">Manage your digital twin lifecycle and data sovereignty.</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('hub')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'hub' ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-osia-neutral-400 hover:text-white'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Hub</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'data' ? 'bg-osia-teal-500 text-white shadow-lg' : 'text-osia-neutral-400 hover:text-white'
                            }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Governance</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'hub' ? (
                    <motion.div
                        key="hub"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-6 space-y-4">
                                <div className="flex items-center gap-3 text-osia-teal-400">
                                    <FileText className="w-5 h-5" />
                                    <h3 className="font-bold text-white">Data Snapshot</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Total Answers</span>
                                        <span className="text-osia-neutral-200">142</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Audit Events</span>
                                        <span className="text-osia-neutral-200">856</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Last Updated</span>
                                        <span className="text-osia-neutral-200">2 hours ago</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 space-y-4">
                                <div className="flex items-center gap-3 text-osia-teal-400">
                                    <Lock className="w-5 h-5" />
                                    <h3 className="font-bold text-white">Consent Summary</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Active Domains</span>
                                        <span className="text-osia-neutral-200">4 / 7</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">PII Redaction</span>
                                        <span className="text-osia-teal-400 font-medium">Enabled</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Team Sharing</span>
                                        <span className="text-osia-neutral-200">Aggregate Only</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 space-y-4">
                                <div className="flex items-center gap-3 text-osia-teal-400">
                                    <RefreshCw className="w-5 h-5" />
                                    <h3 className="font-bold text-white">Renewal Status</h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Current Cycle</span>
                                        <span className="text-osia-neutral-200">Day 42 / 90</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Model Drift</span>
                                        <span className="text-green-400 font-medium">Low (2%)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-500">Next Review</span>
                                        <span className="text-osia-neutral-200">March 15, 2026</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card className="p-8 bg-osia-teal-500/5 border-osia-teal-500/20">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="p-4 rounded-2xl bg-osia-teal-500/10">
                                    <RefreshCw className="w-12 h-12 text-osia-teal-400" />
                                </div>
                                <div className="space-y-2 flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white">Initiate Manual Renewal</h3>
                                    <p className="text-osia-neutral-400">
                                        If you've experienced a significant life change or feel your digital twin no longer resonates, you can initiate a manual renewal review at any time.
                                    </p>
                                </div>
                                <Button
                                    className="bg-osia-teal-600 hover:bg-osia-teal-500"
                                    onClick={() => setActiveTab('review')}
                                >
                                    Start Review <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="data"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <DataControls />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
