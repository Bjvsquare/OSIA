import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '../../../components/ui/Button';
import { Loader2, Check, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../features/auth/AuthContext';

interface Request {
    requestId: string;
    fromUserId: string;
    fromUsername: string;
    fromName?: string;
    fromAvatar?: string;
    type: string;
    timestamp: string;
}

export function IncomingRequests() {
    const { auth } = useAuth();
    const token = auth.token;
    const queryClient = useQueryClient();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['connection-requests'],
        queryFn: async () => {
            const res = await axios.get('/api/connect/requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return res.data as Request[];
        }
    });

    const respondMutation = useMutation({
        mutationFn: async ({ requestId, action }: { requestId: string, action: 'accept' | 'reject' }) => {
            await axios.post('/api/connect/respond', { requestId, action }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
            queryClient.invalidateQueries({ queryKey: ['connection-requests-count'] });
        }
    });

    if (isLoading) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-osia-teal-500" /></div>;
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-20 text-osia-neutral-500 bg-white/5 rounded-2xl border border-white/10">
                <Clock className="w-10 h-10 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-white">No Pending Requests</h3>
                <p>Incoming connection requests connect will appear here.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence>
                {requests.map((req) => (
                    <motion.div
                        key={req.requestId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-osia-teal-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                                {req.fromAvatar ? (
                                    <img src={req.fromAvatar} alt={req.fromUsername} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-medium text-white">{req.fromUsername.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium text-white text-lg">{req.fromName || req.fromUsername}</h3>
                                <div className="flex items-center gap-2 text-sm text-osia-neutral-400">
                                    <span className="px-2 py-0.5 rounded bg-osia-teal-900/40 text-osia-teal-300 border border-osia-teal-500/20 text-xs">
                                        {req.type}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(req.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none border-red-500/20 hover:bg-red-500/10 text-red-400"
                                onClick={() => respondMutation.mutate({ requestId: req.requestId, action: 'reject' })}
                                disabled={respondMutation.isPending}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 sm:flex-none bg-osia-teal-600 hover:bg-osia-teal-500"
                                onClick={() => respondMutation.mutate({ requestId: req.requestId, action: 'accept' })}
                                disabled={respondMutation.isPending}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
