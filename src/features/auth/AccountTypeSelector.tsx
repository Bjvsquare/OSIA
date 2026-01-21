import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { User, Building2, ArrowRight, Sparkles, Users, BarChart3, Shield } from 'lucide-react';

export function AccountTypeSelector() {
    const navigate = useNavigate();

    const handleSelectIndividual = () => {
        navigate('/signup?type=individual');
    };

    const handleSelectOrganization = () => {
        navigate('/signup/organization');
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <img src="/logo.png" alt="OSIA" className="h-10 w-auto mx-auto mb-8 opacity-90" />
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                        How would you like to use OSIA?
                    </h1>
                    <p className="text-lg text-osia-neutral-400 max-w-xl mx-auto">
                        Choose the path that best describes your purpose
                    </p>
                </div>

                {/* Selection Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Individual Path */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="p-8 bg-gradient-to-br from-osia-teal-500/10 to-transparent border-osia-teal-500/20 hover:border-osia-teal-500/40 cursor-pointer h-full transition-colors group"
                            onClick={handleSelectIndividual}
                        >
                            <div className="flex flex-col h-full">
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-osia-teal-500 to-osia-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-osia-teal-500/20">
                                    <User className="w-8 h-8 text-white" />
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    Individual
                                </h2>

                                {/* Description */}
                                <p className="text-osia-neutral-400 mb-6 flex-1">
                                    Create your personal Blueprint for self-discovery,
                                    growth protocols, and connecting with like-minded individuals.
                                </p>

                                {/* Features */}
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-osia-neutral-300">
                                        <Sparkles className="w-4 h-4 text-osia-teal-400" />
                                        <span>Personal Blueprint generation</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-osia-neutral-300">
                                        <BarChart3 className="w-4 h-4 text-osia-teal-400" />
                                        <span>Growth protocols & recalibration</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-osia-neutral-300">
                                        <Users className="w-4 h-4 text-osia-teal-400" />
                                        <span>Team creation & collaboration</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="flex items-center justify-between">
                                    <span className="text-osia-teal-400 font-medium group-hover:text-osia-teal-300 transition-colors">
                                        Continue as Individual
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-osia-teal-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Organization Path */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Card
                            className="p-8 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 hover:border-purple-500/40 cursor-pointer h-full transition-colors group"
                            onClick={handleSelectOrganization}
                        >
                            <div className="flex flex-col h-full">
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    Organization
                                </h2>

                                {/* Description */}
                                <p className="text-osia-neutral-400 mb-6 flex-1">
                                    Register your company, business, or organization to unlock
                                    team insights, recruitment matching, and workforce analytics.
                                </p>

                                {/* Features */}
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-osia-neutral-300">
                                        <Building2 className="w-4 h-4 text-purple-400" />
                                        <span>Organization Blueprint</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-osia-neutral-300">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        <span>Employee management & insights</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-osia-neutral-300">
                                        <Shield className="w-4 h-4 text-purple-400" />
                                        <span>Recruitment & team matching</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="flex items-center justify-between">
                                    <span className="text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
                                        Continue as Organization
                                    </span>
                                    <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Already have account */}
                <div className="text-center mt-10">
                    <p className="text-osia-neutral-500">
                        Already have an account?{' '}
                        <a href="/login" className="text-osia-teal-400 hover:text-osia-teal-300 font-medium">
                            Sign in
                        </a>
                    </p>
                </div>

                {/* Join existing org hint */}
                <div className="text-center mt-4">
                    <p className="text-sm text-osia-neutral-600">
                        Want to join an existing organization?{' '}
                        <a href="/signup/join-organization" className="text-purple-400 hover:text-purple-300">
                            Search & join here
                        </a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
