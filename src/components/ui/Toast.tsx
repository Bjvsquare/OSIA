import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 4000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: <CheckCircle className="text-osia-teal-500" size={18} />,
        error: <XCircle className="text-red-500" size={18} />,
        info: <Info className="text-blue-400" size={18} />,
        warning: <AlertTriangle className="text-amber-500" size={18} />
    };

    const borders = {
        success: 'border-osia-teal-500/30 bg-osia-teal-500/5',
        error: 'border-red-500/30 bg-red-500/5',
        info: 'border-blue-500/30 bg-blue-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${borders[type]}`}
        >
            {icons[type]}
            <span className="text-sm font-bold text-white tracking-tight">{message}</span>
            <button
                onClick={onClose}
                className="ml-4 text-osia-neutral-500 hover:text-white transition-colors"
            >
                ✕
            </button>
        </motion.div>
    );
}

export function useToast() {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };

    const hideToast = () => setToast(null);

    const ToastComponent = () => (
        <AnimatePresence>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </AnimatePresence>
    );

    return { showToast, ToastComponent };
}
