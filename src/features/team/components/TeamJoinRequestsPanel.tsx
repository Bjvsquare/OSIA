import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { UserPlus, Check, X, Clock, Users } from 'lucide-react';
import { api } from '../../../services/api';

interface TeamJoinRequestsPanelProps {
    teamId: string;
    isAdmin: boolean;
}

export function TeamJoinRequestsPanel({ teamId, isAdmin }: TeamJoinRequestsPanelProps) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (isAdmin) {
            loadRequests();
        }
    }, [teamId, isAdmin]);

    const loadRequests = async () => {
        try {
            const data = await api.getTeamJoinRequests(teamId);
            setRequests(data);
        } catch (error) {
            console.error('Failed to load join requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        setProcessing(requestId);
        try {
            await api.handleJoinRequest(teamId, requestId, action);
            await loadRequests();
        } catch (error) {
            console.error('Failed to handle request', error);
        } finally {
            setProcessing(null);
        }
    };

    if (!isAdmin) return null;

    if (loading) {
        return (
            <Card className="p-6 border-white/5 bg-white/[0.02]">
                <p className="text-osia-neutral-500 text-sm animate-pulse">Loading requests...</p>
            </Card>
        );
    }

    if (requests.length === 0) {
        return null; // Don't show anything if no pending requests
    }

    return (
        <Card className="p-6 border-purple-500/20 bg-purple-500/5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                    <UserPlus size={16} />
                    Pending Join Requests
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/20 text-xs">
                        {requests.length}
                    </span>
                </h3>
            </div>

            <div className="space-y-3">
                {requests.map(request => (
                    <div
                        key={request.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
                    >
                        <div className="flex items-center gap-4">
                            {request.userAvatar ? (
                                <img
                                    src={request.userAvatar}
                                    alt={request.userName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-osia-teal-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {request.userName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                            )}
                            <div>
                                <h4 className="font-semibold text-white">{request.userName}</h4>
                                <p className="text-xs text-osia-neutral-500">{request.userEmail}</p>
                                {request.message && (
                                    <p className="text-xs text-osia-neutral-400 mt-1 italic">"{request.message}"</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {processing === request.id ? (
                                <span className="text-xs text-osia-neutral-500 animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAction(request.id, 'reject')}
                                        className="text-red-400 border-red-400/30 hover:bg-red-500/10"
                                    >
                                        <X size={14} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleAction(request.id, 'approve')}
                                        className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    >
                                        <Check size={14} className="mr-1" />
                                        Approve
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
