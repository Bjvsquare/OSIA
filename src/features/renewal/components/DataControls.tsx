import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ShieldAlert, Download, Trash2, Pause, Play, CheckCircle2 } from 'lucide-react';
import { api } from '../../../services/api';

export function DataControls() {
    const [isPaused, setIsPaused] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSuccess, setShowSuccess] = useState<string | null>(null);

    const handlePause = async () => {
        await api.pauseAcquisition(!isPaused);
        setIsPaused(!isPaused);
        setShowSuccess(isPaused ? 'Acquisition Resumed' : 'Acquisition Paused');
        setTimeout(() => setShowSuccess(null), 3000);
    };

    const handleExport = async () => {
        const data = await api.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `osia-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setShowSuccess('Data Exported Successfully');
        setTimeout(() => setShowSuccess(null), 3000);
    };

    const handleDelete = async () => {
        if (confirm('Are you absolutely sure? This will permanently delete your digital twin and all associated data. This action cannot be undone.')) {
            setIsDeleting(true);
            await api.deleteData();
            // In a real app, redirect to landing or logout
            alert('Data Deleted. Redirecting...');
            window.location.href = '/';
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-osia-teal-400" />
                    Data Governance & Agency
                </h2>
                <p className="text-osia-neutral-400">
                    You have total control over your digital twin. We believe in data sovereignty.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                {isPaused ? <Play className="w-4 h-4 text-osia-teal-400" /> : <Pause className="w-4 h-4 text-osia-teal-400" />}
                                Signal Acquisition
                            </h3>
                            <p className="text-xs text-osia-neutral-500">
                                Temporarily stop OSIA from collecting new insights.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePause}
                            className={isPaused ? 'border-osia-teal-500 text-osia-teal-400' : ''}
                        >
                            {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                    </div>
                </Card>

                <Card className="p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Download className="w-4 h-4 text-osia-teal-400" />
                                Data Portability
                            </h3>
                            <p className="text-xs text-osia-neutral-500">
                                Download a full, spec-compliant archive of your data.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            Export JSON
                        </Button>
                    </div>
                </Card>
            </div>

            <Card className="p-8 border-red-500/20 bg-red-500/5 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                            <Trash2 className="w-5 h-5 text-red-400" />
                            Permanent Deletion
                        </h3>
                        <p className="text-sm text-osia-neutral-400 max-w-md">
                            Permanently delete your account, your digital twin foundation, and all historical signals. This action is irreversible.
                        </p>
                    </div>
                    <Button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-500 text-white px-8"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete All Data'}
                    </Button>
                </div>
            </Card>

            {showSuccess && (
                <div className="fixed bottom-8 right-8 bg-osia-teal-600 text-white px-6 py-3 rounded-xl shadow-2xl border border-osia-teal-400 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                    <CheckCircle2 className="w-5 h-5" />
                    {showSuccess}
                </div>
            )}
        </div>
    );
}
