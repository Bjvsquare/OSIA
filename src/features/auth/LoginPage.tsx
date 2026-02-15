import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { CheckEmailScreen } from './components/CheckEmailScreen';
import { ExpiredLinkScreen } from './components/ExpiredLinkScreen';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Apple } from 'lucide-react';

type AuthState = 'WELCOME' | 'CHECK_EMAIL' | 'SIGNING_IN' | 'MFA_REQUIRED' | 'EXPIRED';

export function LoginPage() {
    const navigate = useNavigate();
    const { completeAuth } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [authState, setAuthState] = useState<AuthState>('WELCOME');
    const [mfaUserId, setMfaUserId] = useState<string>('');
    const [mfaCode, setMfaCode] = useState<string>('');

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError('Google sign-in failed: No credential received');
            return;
        }

        setAuthState('SIGNING_IN');
        try {
            const response = await fetch('/api/auth/google/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: credentialResponse.credential })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.needsSignup) {
                    setError('Account not found. Redirecting you to complete your Founding Circle questionnaire...');
                    setTimeout(() => navigate('/signup'), 3000);
                    setAuthState('WELCOME');
                    return;
                }
                throw new Error(data.error || 'Google login failed');
            }

            if (data.mfaRequired) {
                setMfaUserId(data.userId);
                setAuthState('MFA_REQUIRED');
                return;
            }

            completeAuth(data.token, data.user);
            navigate('/welcome');
        } catch (err: any) {
            setError(err.message || 'Google authentication failed');
            setAuthState('WELCOME');
        }
    };

    const handleAppleSignIn = async () => {
        setAuthState('SIGNING_IN');
        setError('');
        try {
            // Apple Sign-In uses a redirect-based flow
            const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
            if (!clientId) {
                throw new Error('Apple Sign-In is not configured yet. Please check back soon.');
            }
            const redirectUri = `${window.location.origin}/api/auth/apple/callback`;
            const state = crypto.randomUUID();
            sessionStorage.setItem('apple_auth_state', state);

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code id_token',
                scope: 'name email',
                response_mode: 'form_post',
                state
            });

            window.location.href = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
        } catch (err: any) {
            setError(err.message || 'Apple Sign-In failed');
            setAuthState('WELCOME');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAuthState('SIGNING_IN');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Check if 2FA is required
            if (data.mfaRequired) {
                setMfaUserId(data.userId);
                setAuthState('MFA_REQUIRED');
                return;
            }

            // Normal login without 2FA
            completeAuth(data.token, data.user);
            navigate('/welcome');
        } catch (err: any) {
            const msg = err.message === 'Failed to fetch'
                ? 'Network error: Could not reach authentication server (port 3001).'
                : err.message || 'Login failed';
            setError(msg);
            setAuthState('WELCOME');
        }
    };

    const confirmMagicLink = async () => {
        setError('');
        try {
            const response = await fetch('/api/auth/magic-link/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send magic link');
            }

            setError(''); // Clear any previous errors — link sent successfully
        } catch (err: any) {
            setError(err.message || 'Could not resend verification link');
        }
    };

    const handleMfaVerification = async () => {
        if (mfaCode.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        try {
            const response = await fetch('/api/auth/login/2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: mfaUserId, code: mfaCode })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '2FA verification failed');
            }

            completeAuth(data.token, data.user);
            navigate('/welcome');
        } catch (err: any) {
            setError(err.message || 'Invalid code');
            setMfaCode('');
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <img src="/logo.png" alt="OSIA" className="h-8 w-auto mx-auto mb-6 opacity-90" />
                    <div className="text-[10px] text-osia-neutral-500 uppercase tracking-widest font-bold flex justify-center gap-6">
                        <span>Data & Ethics</span>
                        <span>Help</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {authState === 'WELCOME' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="p-10 border-white/5 bg-[#0a1128]/60 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] space-y-8 relative min-h-[480px] flex flex-col justify-center overflow-hidden">
                                <div className="text-center space-y-2">
                                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
                                    <p className="text-sm text-osia-neutral-400">Enter your credentials to access your workspace.</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-[10px] uppercase tracking-widest text-osia-neutral-500 font-bold">Email address</Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="you@example.com"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            className="bg-black/40 border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-osia-neutral-500 font-bold">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="bg-black/40 border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <Button type="submit" variant="primary" className="w-full">
                                            Sign In
                                        </Button>
                                        <p className="text-[10px] text-osia-neutral-500 text-center leading-relaxed">
                                            Enter your credentials to access your Digital Twin.
                                        </p>
                                    </div>
                                </form>

                                <div className="space-y-4 pt-4">
                                    <div className="relative flex items-center gap-4 py-2">
                                        <div className="h-px bg-white/5 flex-1" />
                                        <span className="text-[9px] font-black text-osia-neutral-600 uppercase tracking-widest px-2">or continue with</span>
                                        <div className="h-px bg-white/5 flex-1" />
                                    </div>

                                    <div className="flex justify-center w-full">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => setError('Google sign-in failed')}
                                            theme="filled_black"
                                            shape="pill"
                                            width="100%"
                                            text="signin_with"
                                        />
                                    </div>

                                    <button
                                        onClick={handleAppleSignIn}
                                        className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
                                    >
                                        <Apple size={18} fill="black" />
                                        <span>Sign in with Apple</span>
                                    </button>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-white/5 text-center">
                                    <button className="text-[10px] font-bold text-osia-teal-500 hover:text-osia-teal-400 underline underline-offset-4 decoration-osia-teal-500/30 uppercase tracking-widest">
                                        Having trouble? See help
                                    </button>

                                    <div className="space-y-1">
                                        <p className="text-[9px] text-osia-neutral-600 font-bold uppercase tracking-widest">
                                            We never sell your data.<br />
                                            You control what you share.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {authState === 'CHECK_EMAIL' && (
                        <motion.div
                            key="check-email"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <CheckEmailScreen
                                email={username}
                                onResend={confirmMagicLink}
                                onBack={() => setAuthState('WELCOME')}
                            />
                        </motion.div>
                    )}

                    {authState === 'MFA_REQUIRED' && (
                        <motion.div
                            key="mfa-required"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="p-10 border-white/5 bg-[#0a1128]/60 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] space-y-8 relative min-h-[480px] flex flex-col justify-center overflow-hidden">
                                <motion.div
                                    className="flex flex-col items-center justify-center space-y-6 py-12 text-center"
                                >
                                    <h2 className="text-2xl font-bold text-white tracking-tight text-glow">Verification Required</h2>
                                    <p className="text-sm text-osia-neutral-400">Enter the 6-digit code from your authenticator app.</p>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-4 w-full max-w-xs">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={mfaCode}
                                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-3xl font-mono tracking-widest focus:outline-none focus:border-osia-teal-500/50"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-4 pt-4 w-full">
                                        <Button
                                            onClick={handleMfaVerification}
                                            variant="primary"
                                            className="w-full"
                                            disabled={mfaCode.length !== 6}
                                        >
                                            Verify Identity
                                        </Button>
                                        <button
                                            onClick={() => setAuthState('WELCOME')}
                                            className="text-[10px] font-black uppercase tracking-widest text-osia-neutral-600 hover:text-white transition-colors"
                                        >
                                            Back to login
                                        </button>
                                    </div>
                                </motion.div>
                            </Card>
                        </motion.div>
                    )}

                    {authState === 'SIGNING_IN' && (
                        <motion.div
                            key="signing-in"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="p-10 border-white/5 bg-[#0a1128]/60 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] space-y-8 relative min-h-[480px] flex flex-col justify-center overflow-hidden">
                                <motion.div
                                    className="flex flex-col items-center justify-center space-y-6 py-12 text-center"
                                >
                                    <h2 className="text-2xl font-bold text-white tracking-tight text-glow">Signing you in...</h2>
                                    <p className="text-sm text-osia-neutral-400">Please wait while we verify your credentials.</p>

                                    <div className="flex gap-2 justify-center py-4">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="w-10 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </Card>
                        </motion.div>
                    )}

                    {authState === 'EXPIRED' && (
                        <motion.div
                            key="expired"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <ExpiredLinkScreen
                                onRetry={() => setAuthState('WELCOME')}
                                onBack={() => setAuthState('WELCOME')}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <footer className="mt-12 text-center text-[9px] text-osia-neutral-600 font-bold uppercase tracking-widest space-y-4">
                    <div className="flex justify-center gap-4">
                        <span>Terms</span>
                        <span>Privacy Policy</span>
                        <span>Data & Ethics</span>
                    </div>
                    <p className="max-w-xs mx-auto leading-loose opacity-60">
                        You can change permissions, revoke consent, and delete your data from your dashboard.
                    </p>
                </footer>
            </motion.div>
        </div>
    );
}
