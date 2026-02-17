import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Inbox, Orbit } from 'lucide-react';
import { UserSearch } from './components/UserSearch';
import { IncomingRequests } from './components/IncomingRequests';
import { ConnectionList } from './components/ConnectionList';
import { GalaxyScene } from '../osia/canvas/GalaxyScene';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { useAuth } from '../auth/AuthContext';
import type { RelationshipCluster } from '../osia/types';

type Tab = 'galaxy' | 'circle' | 'discover' | 'requests';

// Map backend connectionType to RelationshipCluster
function mapConnectionType(type?: string): RelationshipCluster {
    switch (type?.toLowerCase()) {
        case 'family':
        case 'parent':
        case 'sibling':
            return 'family';
        case 'colleague':
        case 'work':
        case 'professional':
            return 'colleagues';
        case 'team':
            return 'team';
        case 'org':
        case 'organization':
            return 'org';
        default:
            return 'friends';
    }
}

export function ConnectPage() {
    const [activeTab, setActiveTab] = useState<Tab>('galaxy');
    const { auth } = useAuth();

    // Fetch connections for both list and galaxy view
    const { data: connectionsRaw = [] } = useQuery({
        queryKey: ['connections'],
        queryFn: async () => {
            const res = await axios.get('/api/connect/list', {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            return res.data;
        },
    });

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

    // Fetch user portrait for galaxy core orb
    const { data: profileData } = useQuery({
        queryKey: ['user-profile-connect'],
        queryFn: async () => {
            const res = await axios.get('/api/users/profile', {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            return res.data;
        },
        enabled: !!auth.token,
        staleTime: 60000,
    });

    const portraitUrl = profileData?.avatarUrl || null;

    // Transform connections for GalaxyScene
    const galaxyConnections = useMemo(() => {
        return connectionsRaw.map((conn: any) => ({
            userId: conn.userId,
            name: conn.name || conn.username || 'Unknown',
            avatarUrl: conn.avatarUrl,
            cluster: mapConnectionType(conn.connectionType),
            strength: conn.compatibilityScore ? conn.compatibilityScore / 100 : 0.5,
            subType: conn.connectionType,
        }));
    }, [connectionsRaw]);

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'galaxy', label: 'Galaxy', icon: Orbit },
        { key: 'circle', label: 'My Circle', icon: Users },
        { key: 'discover', label: 'Discover', icon: Search },
        { key: 'requests', label: 'Requests', icon: Inbox },
    ];

    return (
        <div className="min-h-full flex flex-col pb-12 space-y-6">
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
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-all ${isActive
                                    ? 'bg-osia-teal-500 text-white shadow-lg'
                                    : 'text-osia-neutral-400 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${tab.key === 'requests' && requestCount > 0 ? 'animate-text-pulse' : ''}`} />
                                <span className={tab.key === 'requests' && requestCount > 0 ? 'animate-text-pulse' : ''}>{tab.label}</span>
                                {tab.key === 'requests' && requestCount > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {requestCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div data-tour="connect-overview" className={activeTab === 'galaxy' ? 'min-h-[600px]' : 'min-h-[300px]'}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className={activeTab === 'galaxy' ? 'h-[600px] rounded-2xl overflow-hidden border border-white/5 bg-black/30' : ''}
                    >
                        {activeTab === 'galaxy' && (
                            <GalaxyScene
                                connections={galaxyConnections}
                                centralOrbColor="#00ffff"
                                centralOrbSize={1.5}
                                className="h-full"
                                portraitUrl={portraitUrl}
                            />
                        )}
                        {activeTab === 'circle' && <ConnectionList />}
                        {activeTab === 'discover' && <UserSearch />}
                        {activeTab === 'requests' && <IncomingRequests />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
