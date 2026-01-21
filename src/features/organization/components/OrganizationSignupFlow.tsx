import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
    Building2, ArrowRight, ArrowLeft, CheckCircle,
    Sparkles, Users, Globe, Calendar, Briefcase
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../../services/api';

interface QuestionOption {
    value: number;
    label: string;
}

interface Question {
    id: string;
    category: string;
    text: string;
    trait: string;
    options: QuestionOption[];
}

type Step = 'basic' | 'admin' | 'questionnaire' | 'review';

const INDUSTRIES = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Professional Services', 'Media & Entertainment', 'Real Estate',
    'Non-Profit', 'Government', 'Other'
];

const ORG_TYPES = [
    { value: 'company', label: 'Company / Business' },
    { value: 'nonprofit', label: 'Non-Profit Organization' },
    { value: 'government', label: 'Government Agency' },
    { value: 'education', label: 'Educational Institution' },
    { value: 'other', label: 'Other' }
];

const ORG_SIZES = [
    { value: 'startup', label: '1-10 employees', desc: 'Startup' },
    { value: 'small', label: '11-50 employees', desc: 'Small Business' },
    { value: 'medium', label: '51-200 employees', desc: 'Medium Business' },
    { value: 'large', label: '201-1000 employees', desc: 'Large Business' },
    { value: 'enterprise', label: '1000+ employees', desc: 'Enterprise' }
];

export function OrganizationSignupFlow() {
    const navigate = useNavigate();
    const { auth, signup } = useAuth();
    const [step, setStep] = useState<Step>('basic');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Basic Info
    const [orgName, setOrgName] = useState('');
    const [orgType, setOrgType] = useState('company');
    const [industry, setIndustry] = useState('');
    const [size, setSize] = useState('small');
    const [description, setDescription] = useState('');
    const [website, setWebsite] = useState('');
    const [headquarters, setHeadquarters] = useState('');
    const [foundedYear, setFoundedYear] = useState(new Date().getFullYear().toString());

    // Admin Account
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    // Questionnaire
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Record<string, number>>({});

    useEffect(() => {
        loadQuestionnaire();
    }, []);

    const loadQuestionnaire = async () => {
        try {
            const data = await api.getOrgQuestionnaire();
            setQuestions(data);
        } catch (err) {
            console.error('Failed to load questionnaire', err);
        }
    };

    const handleBasicNext = () => {
        if (!orgName || !industry) {
            setError('Please fill in organization name and industry');
            return;
        }
        setError('');

        // If already authenticated, skip admin step
        if (auth.isAuthenticated) {
            setStep('questionnaire');
        } else {
            setStep('admin');
        }
    };

    const handleAdminNext = () => {
        if (!adminName || !adminEmail || !adminPassword) {
            setError('Please fill in all admin account fields');
            return;
        }
        if (adminPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setError('');
        setStep('questionnaire');
    };

    const handleQuestionAnswer = (value: number) => {
        const question = questions[currentQuestionIndex];
        setResponses(prev => ({ ...prev, [question.id]: value }));

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setStep('review');
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            let token = null;

            // Create admin account if not authenticated
            if (!auth.isAuthenticated) {
                const signupSuccess = await signup(adminEmail, adminPassword, { name: adminName });
                if (!signupSuccess) {
                    throw new Error('Failed to create admin account');
                }
                const authData = localStorage.getItem('OSIA_auth');
                token = authData ? JSON.parse(authData).token : null;
            } else {
                const authData = localStorage.getItem('OSIA_auth');
                token = authData ? JSON.parse(authData).token : null;
            }

            // Create organization
            const orgRes = await api.createOrganization({
                name: orgName,
                type: orgType,
                industry,
                size,
                description,
                website,
                headquarters,
                foundedYear: foundedYear ? parseInt(foundedYear) : undefined
            });

            if (!orgRes.ok) {
                const data = await orgRes.json();
                throw new Error(data.error || 'Failed to create organization');
            }

            const org = await orgRes.json();

            // Generate Blueprint
            await api.setOrgBlueprint(org.id, responses);

            // Navigate to org dashboard
            navigate(`/organization/${org.id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const progress = step === 'basic' ? 25 : step === 'admin' ? 50 : step === 'questionnaire' ? 75 : 100;
    const currentQuestion = questions[currentQuestionIndex];
    const questionProgress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                        Register Your Organization
                    </h1>
                    <p className="text-osia-neutral-400">
                        Create a Blueprint for your team and unlock workforce insights
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-osia-neutral-500 mb-2">
                        <span className={step === 'basic' ? 'text-purple-400' : ''}>Details</span>
                        <span className={step === 'admin' ? 'text-purple-400' : ''}>Account</span>
                        <span className={step === 'questionnaire' ? 'text-purple-400' : ''}>Culture</span>
                        <span className={step === 'review' ? 'text-purple-400' : ''}>Review</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <Card className="p-8 border-white/5 bg-osia-deep-900/60 backdrop-blur-3xl">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Basic Info */}
                        {step === 'basic' && (
                            <motion.div
                                key="basic"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name *</Label>
                                    <Input
                                        id="orgName"
                                        placeholder="Acme Corporation"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Organization Type *</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ORG_TYPES.map(type => (
                                            <button
                                                key={type.value}
                                                onClick={() => setOrgType(type.value)}
                                                className={`p-3 rounded-xl border text-left text-sm transition-colors ${orgType === type.value
                                                    ? 'bg-purple-500/20 border-purple-500 text-white'
                                                    : 'bg-white/5 border-white/10 text-osia-neutral-300 hover:border-white/20'
                                                    }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="industry">Industry *</Label>
                                    <select
                                        id="industry"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-osia-deep-900 border border-white/10 text-white focus:border-purple-500 outline-none appearance-none cursor-pointer"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="" className="bg-osia-deep-900 text-osia-neutral-400">Select industry...</option>
                                        {INDUSTRIES.map(ind => (
                                            <option key={ind} value={ind} className="bg-osia-deep-900 text-white">{ind}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Organization Size *</Label>
                                    <div className="space-y-2">
                                        {ORG_SIZES.map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => setSize(s.value)}
                                                className={`w-full p-3 rounded-xl border text-left transition-colors ${size === s.value
                                                    ? 'bg-purple-500/20 border-purple-500 text-white'
                                                    : 'bg-white/5 border-white/10 text-osia-neutral-300 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex justify-between">
                                                    <span>{s.desc}</span>
                                                    <span className="text-osia-neutral-500">{s.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label><Globe className="w-4 h-4 inline mr-1" />Website</Label>
                                        <Input
                                            placeholder="https://..."
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label><Calendar className="w-4 h-4 inline mr-1" />Founded</Label>
                                        <select
                                            value={foundedYear}
                                            onChange={(e) => setFoundedYear(e.target.value)}
                                            className="w-full p-3 rounded-xl bg-osia-deep-900 border border-white/10 text-white focus:border-purple-500 outline-none appearance-none cursor-pointer"
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                <option key={year} value={year} className="bg-osia-deep-900 text-white">{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={() => navigate('/get-started')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                    <Button onClick={handleBasicNext} className="bg-gradient-to-r from-purple-600 to-purple-700">
                                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Admin Account */}
                        {step === 'admin' && (
                            <motion.div
                                key="admin"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold text-white">Create Admin Account</h2>
                                    <p className="text-sm text-osia-neutral-400">You'll be the primary administrator</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adminName">Your Name</Label>
                                    <Input
                                        id="adminName"
                                        placeholder="Jane Doe"
                                        value={adminName}
                                        onChange={(e) => setAdminName(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Email</Label>
                                    <Input
                                        id="adminEmail"
                                        type="email"
                                        placeholder="admin@company.com"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adminPassword">Password</Label>
                                    <Input
                                        id="adminPassword"
                                        type="password"
                                        placeholder="Create a strong password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={() => setStep('basic')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                    <Button onClick={handleAdminNext} className="bg-gradient-to-r from-purple-600 to-purple-700">
                                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Questionnaire */}
                        {step === 'questionnaire' && currentQuestion && (
                            <motion.div
                                key="questionnaire"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs mb-4">
                                        <Sparkles className="w-3 h-3" />
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                    </div>
                                    <h2 className="text-xl font-semibold text-white mb-2">{currentQuestion.text}</h2>
                                    <p className="text-sm text-osia-neutral-500 capitalize">Category: {currentQuestion.category}</p>
                                </div>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, idx) => (
                                        <motion.button
                                            key={idx}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleQuestionAnswer(option.value)}
                                            className={`w-full p-4 rounded-xl border text-left transition-colors ${responses[currentQuestion.id] === option.value
                                                ? 'bg-purple-500/20 border-purple-500 text-white'
                                                : 'bg-white/5 border-white/10 text-osia-neutral-300 hover:border-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            {option.label}
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-purple-500"
                                        animate={{ width: `${questionProgress}%` }}
                                    />
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => currentQuestionIndex > 0 ? setCurrentQuestionIndex(prev => prev - 1) : setStep(auth.isAuthenticated ? 'basic' : 'admin')}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Review */}
                        {step === 'review' && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-white">Review & Create</h2>
                                    <p className="text-sm text-osia-neutral-400">Confirm your organization details</p>
                                </div>

                                <div className="space-y-4 bg-white/5 rounded-xl p-6">
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-400">Organization</span>
                                        <span className="text-white font-medium">{orgName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-400">Type</span>
                                        <span className="text-white capitalize">{orgType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-400">Industry</span>
                                        <span className="text-white">{industry}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-400">Size</span>
                                        <span className="text-white capitalize">{size}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-osia-neutral-400">Questions Answered</span>
                                        <span className="text-white">{Object.keys(responses).length}</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={() => setStep('questionnaire')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-purple-600 to-purple-700"
                                    >
                                        {isLoading ? 'Creating...' : 'Create Organization'}
                                        <Sparkles className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </motion.div>
        </div>
    );
}
