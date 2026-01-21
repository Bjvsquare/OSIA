import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setIsVisible(false), 500);
                    return 100;
                }
                return prev + Math.random() * 15 + 5;
            });
        }, 120);
        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="osia-loading"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                    <div className="osia-loading-content">
                        <div className="osia-loading-orb">
                            <div className="osia-loading-orb-inner" />
                            <div className="osia-loading-orb-ring" />
                            <div className="osia-loading-orb-ring osia-loading-orb-ring-2" />
                        </div>
                        <h1 className="osia-loading-title">OSIA</h1>
                        <p className="osia-loading-subtitle">Dynamic Data Visualization</p>
                        <div className="osia-loading-bar">
                            <motion.div
                                className="osia-loading-bar-fill"
                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                        <p className="osia-loading-status">
                            {progress < 30 ? 'Loading graph data...' :
                                progress < 60 ? 'Computing layout...' :
                                    progress < 90 ? 'Rendering constellation...' :
                                        'Ready'}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
