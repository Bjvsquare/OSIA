import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Camera, Bug, Lightbulb, AlertTriangle, Send, Paperclip } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other';
type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

interface FeedbackFormData {
    category: FeedbackCategory;
    priority: FeedbackPriority;
    title: string;
    description: string;
    screenshot?: File;
    pageUrl: string;
}

const CATEGORY_CONFIG: Record<FeedbackCategory, { icon: typeof Bug; label: string; color: string }> = {
    bug: { icon: Bug, label: 'Bug Report', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
    feature: { icon: Lightbulb, label: 'Feature Request', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
    improvement: { icon: AlertTriangle, label: 'Improvement', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    other: { icon: MessageSquare, label: 'Other', color: 'text-slate-400 bg-white/10 border-white/20' }
};

const PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; color: string }> = {
    low: { label: 'Low', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    high: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

export function FeedbackButton() {
    const { userProfile } = useAuth();
    const { showToast, ToastComponent } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<FeedbackFormData>({
        category: 'bug',
        priority: 'medium',
        title: '',
        description: '',
        pageUrl: window.location.href
    });
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

    // Only show for founding circle members or admins
    const isFoundingMember =
        userProfile?.isFoundingMember === true ||
        userProfile?.accessTier === 'founding' ||
        userProfile?.subscription?.tier === 'founding' ||
        userProfile?.subscriptionTier === 'founding' ||
        userProfile?.isAdmin === true;

    if (!isFoundingMember) return null;

    const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, screenshot: file }));
            const reader = new FileReader();
            reader.onload = () => setScreenshotPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.description.trim()) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('category', formData.category);
            submitData.append('priority', formData.priority);
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('pageUrl', formData.pageUrl);
            if (formData.screenshot) {
                submitData.append('screenshot', formData.screenshot);
            }

            const response = await api.submitFeedback(submitData);

            if (!response.ok) throw new Error('Failed to submit feedback');

            showToast('Thank you for your feedback!', 'success');
            setIsOpen(false);
            setFormData({
                category: 'bug',
                priority: 'medium',
                title: '',
                description: '',
                pageUrl: window.location.href
            });
            setScreenshotPreview(null);
        } catch (error) {
            console.error('Feedback submission error:', error);
            showToast('Failed to submit feedback. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Feedback Button - Sleek Glass Design */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-50 group"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {/* Outer glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                />

                {/* Main button */}
                <motion.div
                    className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 flex items-center justify-center backdrop-blur-sm"
                    whileHover={{
                        scale: 1.05,
                        borderColor: 'rgba(6, 182, 212, 0.5)',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
                    }}
                    whileTap={{ scale: 0.95 }}
                >
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                </motion.div>

                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 border border-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
                    <span className="text-xs font-medium text-white">Share Feedback</span>
                </div>
            </motion.button>

            {/* Feedback Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/20 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-cyan-500/5 max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Share Feedback</h2>
                                        <p className="text-xs text-slate-500">Help us improve the platform</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Category Selection */}
                            <div className="mb-4">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                                    Category
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(Object.entries(CATEGORY_CONFIG) as [FeedbackCategory, typeof CATEGORY_CONFIG.bug][]).map(([key, config]) => {
                                        const IconComponent = config.icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setFormData(prev => ({ ...prev, category: key }))}
                                                className={`p-3 rounded-xl border text-center transition-all ${formData.category === key
                                                    ? config.color
                                                    : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                                    }`}
                                            >
                                                <IconComponent className="w-5 h-5 mx-auto mb-1" />
                                                <span className="text-[10px] font-medium">{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Priority Selection */}
                            <div className="mb-4">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                                    Priority
                                </label>
                                <div className="flex gap-2">
                                    {(Object.entries(PRIORITY_CONFIG) as [FeedbackPriority, typeof PRIORITY_CONFIG.low][]).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${formData.priority === key
                                                ? config.color
                                                : 'border-slate-700 text-slate-500 hover:border-slate-600'
                                                }`}
                                        >
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="mb-4">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Brief summary of your feedback"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                                />
                            </div>

                            {/* Description */}
                            <div className="mb-4">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Provide details about your feedback, steps to reproduce (for bugs), or your vision (for features)"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 resize-none"
                                />
                            </div>

                            {/* Screenshot Upload */}
                            <div className="mb-6">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
                                    Screenshot (Optional)
                                </label>
                                <div className="relative">
                                    {screenshotPreview ? (
                                        <div className="relative rounded-xl overflow-hidden border border-slate-700">
                                            <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-40 object-cover" />
                                            <button
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, screenshot: undefined }));
                                                    setScreenshotPreview(null);
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-slate-900/80 rounded-lg hover:bg-slate-900 transition-colors"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center justify-center gap-3 px-4 py-6 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 cursor-pointer hover:border-cyan-500/50 transition-colors">
                                            <Camera className="w-5 h-5 text-slate-500" />
                                            <span className="text-sm text-slate-500">Click or drag to upload a screenshot</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleScreenshotUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Current Page */}
                            <div className="mb-6 p-3 rounded-xl bg-slate-800/30 border border-slate-700">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Paperclip className="w-3 h-3" />
                                    <span className="truncate">Current page: {formData.pageUrl}</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 border-0"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Send className="w-4 h-4" />
                                        Submit Feedback
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ToastComponent />
        </>
    );
}
