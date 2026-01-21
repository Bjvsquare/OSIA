import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { ShieldAlert, Terminal, RefreshCw } from 'lucide-react';

export function ErrorLog() {
    const logs = [
        { id: 1, level: 'CRITICAL', service: 'Pattern Engine', msg: 'Neural sync rejection on node #842', time: '12s ago', code: 'SYNC_REJECT_0x42' },
        { id: 2, level: 'WARNING', service: 'Identity Provider', msg: 'Rate limit threshold approaching for /auth/link', time: '8m ago', code: 'AUTH_RATE_LIMIT' },
        { id: 3, level: 'INFO', service: 'Admin Console', msg: 'System integrity check completed successfully', time: '1h ago', code: 'INT_CHECK_200' },
        { id: 4, level: 'ERROR', service: 'Persistence Vault', msg: 'Shard replication delayed: 4 nodes unresponsive', time: '3h ago', code: 'REPL_DELAY_500' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">System Events & Latency</h3>
                    <p className="text-[10px] text-red-500 uppercase tracking-[0.3em] font-black">Security Audit Level: High-Fidelity</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-osia-neutral-400 hover:text-white transition-all">
                    <RefreshCw size={14} /> Clear Buffer
                </button>
            </div>

            <div className="grid gap-3">
                {logs.map((log, i) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className={`p-6 border-white/10 bg-[#0a1128]/60 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-white/20 transition-all ${log.level === 'CRITICAL' ? 'border-l-4 border-l-red-500' :
                            log.level === 'ERROR' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-blue-500'
                            }`}>
                            <div className="flex items-center gap-6">
                                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${log.level === 'CRITICAL' ? 'text-red-500' :
                                    log.level === 'ERROR' ? 'text-amber-500' : 'text-blue-500'
                                    }`}>
                                    <Terminal size={18} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${log.level === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            log.level === 'ERROR' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {log.level}
                                        </span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{log.service}</span>
                                    </div>
                                    <div className="text-sm font-bold text-osia-neutral-400 group-hover:text-white transition-colors truncate max-w-md">{log.msg}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-[10px] font-black text-osia-neutral-700 tracking-[0.2em]">{log.code}</div>
                                <div className="text-[9px] font-bold text-osia-neutral-600 uppercase">{log.time}</div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card className="p-10 border-white/5 bg-osia-teal-500/[0.03] space-y-6">
                <div className="flex items-center gap-4 text-osia-teal-500">
                    <ShieldAlert size={24} />
                    <h4 className="text-lg font-bold tracking-tight">Advanced Threat Detection</h4>
                </div>
                <p className="text-sm text-osia-neutral-500 leading-relaxed">OSIA is actively monitoring cognitive signal anomalies. No adversarial patterns detected in the last 24,000 requests. Integrity is baseline high.</p>
                <button className="text-[10px] font-black text-osia-teal-500 uppercase tracking-widest underline underline-offset-4 decoration-osia-teal-500/30">View Security Policy</button>
            </Card>
        </div>
    );
}
