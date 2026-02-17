import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { X, UserPlus } from 'lucide-react';

interface RequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: string) => Promise<void>;
    targetUsername: string;
}

export function RequestModal({ isOpen, onClose, onSubmit, targetUsername }: RequestModalProps) {
    const [selectedType, setSelectedType] = useState('Work'); // Default
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit(selectedType);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const types = [
        { id: 'Work', label: 'Work', desc: 'Professional collaboration & structured goals.' },
        { id: 'Friend', label: 'Friend', desc: 'Social connection & shared interests.' },
        { id: 'Family', label: 'Family', desc: 'Deep personal bond & kinship.' },
        { id: 'Partner', label: 'Partner', desc: 'Intimate relationship & shared life path.' },
        { id: 'Team', label: 'Team', desc: 'Group project or crew — shared mission & accountability.' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-xl"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Connect with {targetUsername}</h2>
                                <p className="text-sm text-osia-neutral-400">Select the nature of your relationship.</p>
                            </div>
                            <button onClick={onClose} className="text-osia-neutral-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-8">
                            {types.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedType === type.id
                                        ? 'bg-osia-teal-500/10 border-osia-teal-500 ring-1 ring-osia-teal-500'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`font-medium ${selectedType === type.id ? 'text-osia-teal-400' : 'text-white'}`}>
                                            {type.label}
                                        </span>
                                        {selectedType === type.id && <UserPlus className="w-4 h-4 text-osia-teal-500" />}
                                    </div>
                                    <p className="text-xs text-osia-neutral-400 mt-1">{type.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} isLoading={isSubmitting}>
                                Send Request
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
