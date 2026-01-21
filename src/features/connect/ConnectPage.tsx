import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Inbox } from 'lucide-react';
import { UserSearch } from './components/UserSearch';
import { IncomingRequests } from './components/IncomingRequests';
import { ConnectionList } from './components/ConnectionList';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { useAuth } from '../auth/AuthContext';

type Tab = 'circle' | 'discover' | 'requests';

export function ConnectPage() {
    const [activeTab, setActiveTab] = useState<Tab>('circle');
    const { auth } = useAuth();

    // Poll for request count
    const { data: requestCount = 0 } = useQuery({
        queryKey: ['connection-requests-count'],
        queryFn: async () => {
            const res = await axios.get('/api/connect/requests', {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            return res.data.length;
        },
        refetchInterval: 10000
    });

    return (
        <div className="min-h-full flex flex-col pb-12 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Inner Circle</h1>
                    <p className="text-osia-neutral-400 mt-1">
                        Your trusted connections. Deep relational intelligence awaits.
                    </p>
                </div>

                {/* Navigation Pills */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('circle')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'circle'
                            ? 'bg-osia-teal-500 text-white shadow-lg'
                            : 'text-osia-neutral-400 hover:text-white'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>My Circle</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'discover'
                            ? 'bg-osia-teal-500 text-white shadow-lg'
                            : 'text-osia-neutral-400 hover:text-white'
                            }`}
                    >
                        <Search className="w-4 h-4" />
                        <span>Discover</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'requests'
                            ? 'bg-osia-teal-500 text-white shadow-lg'
                            : 'text-osia-neutral-400 hover:text-white'
                            }`}
                    >
                        <Inbox className={`w-4 h-4 ${requestCount > 0 ? 'animate-text-pulse' : ''}`} />
                        <span className={requestCount > 0 ? 'animate-text-pulse' : ''}>Requests</span>
                        {requestCount > 0 && (
                            <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {requestCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div data-tour="connect-overview" className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'circle' && <ConnectionList />}
                        {activeTab === 'discover' && <UserSearch />}
                        {activeTab === 'requests' && <IncomingRequests />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
