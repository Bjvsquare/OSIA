import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { CameraCapture } from '../../components/kyc/CameraCapture';
import axios from 'axios';
import {
    User, Building2, Upload, Camera, FileText,
    CheckCircle, ArrowRight, ArrowLeft, Shield,
    AlertTriangle, Loader2, ImageIcon, X
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   KYCSubmissionFlow — Multi-step Identity Verification

   Individual flow:
     Step 1: Upload portrait selfie
     Step 2: Capture/upload ID or passport next to face
     Step 3: Review & submit
     Step 4: Confirmation

   Organization flow:
     Step 1: Upload organization logo
     Step 2: Upload business registration doc
     Step 3: Enter business details (name, tax ID, email)
     Step 4: Review & submit
     Step 5: Confirmation (pending admin review)
   ═══════════════════════════════════════════════════════════ */

type AccountType = 'individual' | 'organization';
type IndividualStep = 'select-type' | 'portrait' | 'id-document' | 'review' | 'submitting' | 'success' | 'error';
type OrgStep = 'select-type' | 'logo' | 'business-doc' | 'business-details' | 'review' | 'submitting' | 'success' | 'error';

export function KYCSubmissionFlow() {
    const navigate = useNavigate();
    const { auth } = useAuth();

    const [accountType, setAccountType] = useState<AccountType | null>(null);
    const [step, setStep] = useState<IndividualStep | OrgStep>('select-type');
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Individual files
    const [portraitFile, setPortraitFile] = useState<File | null>(null);
    const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
    const [idDocFile, setIdDocFile] = useState<File | null>(null);
    const [idDocPreview, setIdDocPreview] = useState<string | null>(null);
    const [useCamera, setUseCamera] = useState(false);

    // Organization files & details
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [businessDocFile, setBusinessDocFile] = useState<File | null>(null);
    const [businessDocName, setBusinessDocName] = useState<string>('');
    const [businessName, setBusinessName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    // Cleanup previews
    useEffect(() => {
        return () => {
            if (portraitPreview) URL.revokeObjectURL(portraitPreview);
            if (idDocPreview) URL.revokeObjectURL(idDocPreview);
            if (logoPreview) URL.revokeObjectURL(logoPreview);
        };
    }, []);

    const handleFileSelect = useCallback((type: 'portrait' | 'idDoc' | 'logo' | 'businessDoc') =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            switch (type) {
                case 'portrait':
                    setPortraitFile(file);
                    setPortraitPreview(URL.createObjectURL(file));
                    break;
                case 'idDoc':
                    setIdDocFile(file);
                    setIdDocPreview(URL.createObjectURL(file));
                    break;
                case 'logo':
                    setLogoFile(file);
                    setLogoPreview(URL.createObjectURL(file));
                    break;
                case 'businessDoc':
                    setBusinessDocFile(file);
                    setBusinessDocName(file.name);
                    break;
            }
        }, []);

    const handleCameraCapture = useCallback((file: File) => {
        setIdDocFile(file);
        setIdDocPreview(URL.createObjectURL(file));
        setUseCamera(false);
    }, []);

    const handleSubmitIndividual = async () => {
        if (!portraitFile || !auth.token) return;
        setStep('submitting');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('portrait', portraitFile);
            if (idDocFile) formData.append('idDocument', idDocFile);

            await axios.post('/api/kyc/submit', formData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setStep('success');
        } catch (err: any) {
            const data = err.response?.data;
            setError(data?.error || 'Submission failed. Please try again.');
            setValidationErrors(data?.validationErrors || []);
            setStep('error');
        }
    };

    const handleSubmitOrg = async () => {
        if (!logoFile || !businessName || !auth.token) return;
        setStep('submitting');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('logo', logoFile);
            if (businessDocFile) formData.append('businessDoc', businessDocFile);
            formData.append('businessName', businessName);
            if (taxId) formData.append('taxId', taxId);
            if (contactEmail) formData.append('contactEmail', contactEmail);

            await axios.post('/api/kyc/submit-org', formData, {
                headers: {
                    Authorization: `Bearer ${auth.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setStep('success');
        } catch (err: any) {
            const data = err.response?.data;
            setError(data?.error || 'Submission failed. Please try again.');
            setValidationErrors(data?.validationErrors || []);
            setStep('error');
        }
    };

    // ─── Step indicator ────────────────────────────────────
    const getSteps = () => {
        if (!accountType) return ['Choose Type'];
        if (accountType === 'individual') return ['Portrait', 'ID Document', 'Review'];
        return ['Logo', 'Business Doc', 'Details', 'Review'];
    };

    const getCurrentStepIndex = () => {
        if (step === 'select-type') return 0;
        if (accountType === 'individual') {
            return { portrait: 0, 'id-document': 1, review: 2 }[step as string] ?? 0;
        }
        return { logo: 0, 'business-doc': 1, 'business-details': 2, review: 3 }[step as string] ?? 0;
    };

    const steps = getSteps();
    const currentIndex = getCurrentStepIndex();

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-osia-teal-500/20 to-blue-500/20 border border-osia-teal-500/30 mb-2">
                    <Shield className="w-7 h-7 text-osia-teal-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Identity Verification</h1>
                <p className="text-sm text-osia-neutral-400">Secure your account with verified identity</p>
            </div>

            {/* Step indicator — only show after type selection */}
            {accountType && !['submitting', 'success', 'error'].includes(step) && (
                <div className="flex items-center justify-center gap-2">
                    {steps.map((label, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${i === currentIndex
                                    ? 'bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/30'
                                    : i < currentIndex
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'bg-white/5 text-osia-neutral-500 border border-white/5'
                                }`}>
                                {i < currentIndex ? <CheckCircle className="w-3 h-3" /> : null}
                                {label}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-6 h-px ${i < currentIndex ? 'bg-green-500/40' : 'bg-white/10'}`} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ─── SELECT TYPE ─────────────────────────────── */}
            {step === 'select-type' && (
                <div className="space-y-4">
                    <p className="text-center text-sm text-osia-neutral-400">
                        Select your account type to begin verification
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { setAccountType('individual'); setStep('portrait'); }}
                            className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 hover:bg-osia-teal-500/10 border border-white/10 hover:border-osia-teal-500/30 transition-all duration-200"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                                <User className="w-6 h-6 text-blue-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">Individual</span>
                            <span className="text-xs text-osia-neutral-500 text-center">
                                Selfie portrait + Government ID
                            </span>
                        </button>
                        <button
                            onClick={() => { setAccountType('organization'); setStep('logo'); }}
                            className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 transition-all duration-200"
                        >
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                                <Building2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">Organization</span>
                            <span className="text-xs text-osia-neutral-500 text-center">
                                Logo + Business registration docs
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* ─── INDIVIDUAL: PORTRAIT ───────────────────── */}
            {step === 'portrait' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-white">Upload Your Portrait</h2>
                        <p className="text-sm text-osia-neutral-400 mt-1">
                            A clear photo of your face. This will become your profile picture.
                        </p>
                    </div>

                    {portraitPreview ? (
                        <div className="relative max-w-xs mx-auto">
                            <img
                                src={portraitPreview}
                                alt="Portrait preview"
                                className="w-full aspect-square object-cover rounded-2xl border-2 border-osia-teal-500/30"
                            />
                            <button
                                onClick={() => { setPortraitFile(null); setPortraitPreview(null); }}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="block cursor-pointer">
                            <div className="flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed border-white/10 hover:border-osia-teal-500/30 bg-white/[0.02] hover:bg-osia-teal-500/5 transition-all">
                                <ImageIcon className="w-10 h-10 text-osia-neutral-500" />
                                <div className="text-center">
                                    <span className="text-sm font-medium text-osia-neutral-300">Click to upload</span>
                                    <p className="text-xs text-osia-neutral-500 mt-1">JPG, PNG or WebP · Max 10MB</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleFileSelect('portrait')}
                                className="hidden"
                            />
                        </label>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setStep('select-type'); setAccountType(null); }}
                            className="px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setStep('id-document')}
                            disabled={!portraitFile}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-osia-teal-500 to-osia-teal-600 rounded-xl shadow-lg shadow-osia-teal-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next: ID Document
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── INDIVIDUAL: ID DOCUMENT ────────────────── */}
            {step === 'id-document' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-white">ID / Passport Verification</h2>
                        <p className="text-sm text-osia-neutral-400 mt-1">
                            Take a photo of your government ID or passport held next to your face.
                        </p>
                    </div>

                    {useCamera ? (
                        <CameraCapture
                            onCapture={handleCameraCapture}
                            onCancel={() => setUseCamera(false)}
                            instructions="Hold your ID or passport next to your face. Make sure both your face and the document are clearly visible."
                            captureLabel="Capture ID Photo"
                        />
                    ) : idDocPreview ? (
                        <div className="relative max-w-xs mx-auto">
                            <img
                                src={idDocPreview}
                                alt="ID document preview"
                                className="w-full aspect-[4/3] object-cover rounded-2xl border-2 border-blue-500/30"
                            />
                            <button
                                onClick={() => { setIdDocFile(null); setIdDocPreview(null); }}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setUseCamera(true)}
                                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 transition-all"
                            >
                                <Camera className="w-8 h-8 text-blue-400" />
                                <span className="text-sm font-medium text-osia-neutral-300">Use Camera</span>
                            </button>
                            <label className="cursor-pointer">
                                <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 transition-all">
                                    <Upload className="w-8 h-8 text-purple-400" />
                                    <span className="text-sm font-medium text-osia-neutral-300">Upload Photo</span>
                                </div>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={handleFileSelect('idDoc')}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {!useCamera && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('portrait')}
                                className="px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setStep('review')}
                                disabled={!idDocFile}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-osia-teal-500 to-osia-teal-600 rounded-xl shadow-lg shadow-osia-teal-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next: Review
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <p className="text-xs text-osia-neutral-500 text-center">
                        Your ID document is only used for verification and will not be displayed publicly.
                    </p>
                </div>
            )}

            {/* ─── INDIVIDUAL: REVIEW ─────────────────────── */}
            {step === 'review' && accountType === 'individual' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-white">Review Your Submission</h2>
                        <p className="text-sm text-osia-neutral-400 mt-1">
                            Confirm everything looks good before submitting.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-osia-neutral-400 uppercase tracking-wider">Portrait</span>
                            {portraitPreview && (
                                <img src={portraitPreview} alt="Portrait" className="w-full aspect-square object-cover rounded-xl border border-white/10" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-osia-neutral-400 uppercase tracking-wider">ID Document</span>
                            {idDocPreview ? (
                                <img src={idDocPreview} alt="ID" className="w-full aspect-[4/3] object-cover rounded-xl border border-white/10" />
                            ) : (
                                <div className="flex items-center justify-center h-full rounded-xl border border-dashed border-white/10 text-osia-neutral-500 text-xs">
                                    Skipped
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-osia-teal-500/5 border border-osia-teal-500/20 rounded-xl p-4 text-xs text-osia-teal-300">
                        <p className="font-medium mb-1">What happens next:</p>
                        <p>Your portrait will be verified and set as your profile picture. Your ID document is used for verification only and will not be publicly displayed.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('id-document')}
                            className="px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSubmitIndividual}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/20 transition-all hover:brightness-110"
                        >
                            <Shield className="w-4 h-4" />
                            Submit for Verification
                        </button>
                    </div>
                </div>
            )}

            {/* ─── ORG: LOGO ─────────────────────────────── */}
            {step === 'logo' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-white">Organization Logo</h2>
                        <p className="text-sm text-osia-neutral-400 mt-1">
                            Upload your organization's official logo. This will become your profile picture.
                        </p>
                    </div>

                    {logoPreview ? (
                        <div className="relative max-w-xs mx-auto">
                            <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-full aspect-square object-contain rounded-2xl border-2 border-purple-500/30 bg-white/5 p-2"
                            />
                            <button
                                onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="block cursor-pointer">
                            <div className="flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/30 bg-white/[0.02] hover:bg-purple-500/5 transition-all">
                                <Building2 className="w-10 h-10 text-osia-neutral-500" />
                                <div className="text-center">
                                    <span className="text-sm font-medium text-osia-neutral-300">Upload organization logo</span>
                                    <p className="text-xs text-osia-neutral-500 mt-1">JPG, PNG or WebP · Max 10MB</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleFileSelect('logo')}
                                className="hidden"
                            />
                        </label>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setStep('select-type'); setAccountType(null); }}
                            className="px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setStep('business-doc')}
                            disabled={!logoFile}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next: Business Documents
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── ORG: BUSINESS DOCUMENT ─────────────────── */}
            {step === 'business-doc' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-white">Business Registration Document</h2>
                        <p className="text-sm text-osia-neutral-400 mt-1">
                            Upload your business registration certificate, articles of incorporation, or equivalent official document.
                        </p>
                    </div>

                    {businessDocFile ? (
                        <div className="relative flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-purple-500/20">
                            <FileText className="w-8 h-8 text-purple-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{businessDocName}</div>
                                <div className="text-xs text-osia-neutral-500">{(businessDocFile.size / 1024 / 1024).toFixed(1)} MB</div>
                            </div>
                            <button
                                onClick={() => { setBusinessDocFile(null); setBusinessDocName(''); }}
                                className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="block cursor-pointer">
                            <div className="flex flex-col items-center gap-4 p-10 rounded-2xl border-2 border-dashed border-white/10 hover:border-purple-500/30 bg-white/[0.02] hover:bg-purple-500/5 transition-all">
                                <FileText className="w-10 h-10 text-osia-neutral-500" />
                                <div className="text-center">
                                    <span className="text-sm font-medium text-osia-neutral-300">Upload document</span>
                                    <p className="text-xs text-osia-neutral-500 mt-1">PDF, JPG, PNG or WebP · Max 10MB</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                onChange={handleFileSelect('businessDoc')}
                                className="hidden"
                            />
                        </label>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('logo')}
                            className="px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setStep('business-details')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 transition-all"
                        >
                            Next: Business Details
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── ORG: BUSINESS DETAILS ──────────────────── */}
            {step === 'business-details' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-white">Business Details</h2>
                        <p className="text-sm text-osia-neutral-400 mt-1">
                            Provide your organization's official details for verification.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-osia-neutral-400 uppercase tracking-wider mb-1.5">
                                Business Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                placeholder="Legal business name"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-osia-neutral-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-osia-neutral-400 uppercase tracking-wider mb-1.5">
                                Tax ID / Registration Number
                            </label>
                            <input
                                type="text"
                                value={taxId}
                                onChange={e => setTaxId(e.target.value)}
                                placeholder="e.g., EIN, VAT number, CIPC number"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-osia-neutral-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-osia-neutral-400 uppercase tracking-wider mb-1.5">
                                Business Contact Email
                            </label>
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={e => setContactEmail(e.target.value)}
                                placeholder="admin@company.com"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-osia-neutral-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('business-doc')}
                            className="px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setStep('review')}
                            disabled={!businessName.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next: Review
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── ORG: REVIEW ────────────────────────────── */}
            {step === 'review' && accountType === 'organization' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-white">Review Organization Submission</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Logo preview */}
                        {logoPreview && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-lg bg-white/5 p-1" />
                                <div>
                                    <div className="text-xs text-osia-neutral-400 uppercase tracking-wider">Organization Logo</div>
                                    <div className="text-sm text-white font-medium mt-0.5">{businessName || 'No name'}</div>
                                </div>
                            </div>
                        )}

                        {/* Business details */}
                        <div className="grid grid-cols-2 gap-3">
                            {taxId && (
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-xs text-osia-neutral-500">Tax ID</div>
                                    <div className="text-sm text-white mt-0.5">{taxId}</div>
                                </div>
                            )}
                            {contactEmail && (
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-xs text-osia-neutral-500">Contact</div>
                                    <div className="text-sm text-white mt-0.5">{contactEmail}</div>
                                </div>
                            )}
                            {businessDocFile && (
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 col-span-2">
                                    <div className="text-xs text-osia-neutral-500">Business Document</div>
                                    <div className="text-sm text-white mt-0.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                                        {businessDocName}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium mb-1">Organization verification requires admin review</p>
                                <p>Your submission will be reviewed by our team. This typically takes 1-2 business days. Your logo will become your profile picture upon approval.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('business-details')}
                            className="px-4 py-3 text-sm text-osia-neutral-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSubmitOrg}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:brightness-110"
                        >
                            <Shield className="w-4 h-4" />
                            Submit for Review
                        </button>
                    </div>
                </div>
            )}

            {/* ─── SUBMITTING ─────────────────────────────── */}
            {step === 'submitting' && (
                <div className="flex flex-col items-center gap-4 py-12">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-osia-teal-400 animate-spin" />
                    </div>
                    <p className="text-sm text-osia-neutral-400">Verifying your identity...</p>
                </div>
            )}

            {/* ─── SUCCESS ────────────────────────────────── */}
            {step === 'success' && (
                <div className="flex flex-col items-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        {accountType === 'organization' ? 'Submitted for Review' : 'Identity Verified!'}
                    </h2>
                    <p className="text-sm text-osia-neutral-400 text-center max-w-sm">
                        {accountType === 'organization'
                            ? 'Your organization verification has been submitted. An admin will review your documents shortly.'
                            : 'Your identity has been verified and your portrait is now your profile picture.'
                        }
                    </p>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => navigate('/kyc/status')}
                            className="px-6 py-3 text-sm text-osia-neutral-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                        >
                            View Status
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-osia-teal-500 to-osia-teal-600 rounded-xl shadow-lg shadow-osia-teal-500/20 transition-all"
                        >
                            Continue to Home
                        </button>
                    </div>
                </div>
            )}

            {/* ─── ERROR ──────────────────────────────────── */}
            {step === 'error' && (
                <div className="flex flex-col items-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                    <p className="text-sm text-red-400 text-center max-w-sm">{error}</p>

                    {validationErrors.length > 0 && (
                        <ul className="text-xs text-osia-neutral-400 space-y-1">
                            {validationErrors.map((err, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-red-400" />
                                    {err}
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        onClick={() => setStep(accountType === 'individual' ? 'portrait' : 'logo')}
                        className="mt-4 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-osia-teal-500 to-osia-teal-600 rounded-xl shadow-lg shadow-osia-teal-500/20 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
