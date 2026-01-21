import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthState {
    isAuthenticated: boolean;
    username: string | null;
    token?: string;
    onboardingCompleted?: boolean;
    isAdmin?: boolean;
}

export interface OriginSeedTrait {
    layerId: string;
    label?: string;
    score?: number;
    confidence?: number;
    [key: string]: any;
}

export interface OriginSeedProfile {
    traits: OriginSeedTrait[];
    precision?: number;
    [key: string]: any;
}

export interface UserProfile {
    id: string;
    username: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    bio?: string;
    refreshKey?: number;
    isPlaceholder?: boolean;
    isAdmin?: boolean;
    isFoundingMember?: boolean;
    onboardingCompleted?: boolean;
    subscriptionTier?: 'free' | 'pro' | 'founding' | string;
    twoFactorEnabled?: boolean;
    status?: string;
    origin_seed_profile?: OriginSeedProfile;
    [key: string]: any; // Allow additional backend fields
}

interface AuthContextType {
    auth: AuthState;
    userProfile: UserProfile | null;
    isLoading: boolean;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    login: (username: string, password: string) => Promise<boolean>;
    signup: (username: string, password: string, birthData?: any) => Promise<boolean>;
    logout: () => void;
    refreshProfile: () => Promise<void>;
    completeAuth: (token: string, user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_API = '/api/auth';

console.log('[OSIA] API configured for relative paths (/api)');

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthState>(() => {
        const saved = localStorage.getItem('OSIA_auth');
        if (!saved) return { isAuthenticated: false, username: null };
        try {
            const parsed = JSON.parse(saved);
            return {
                ...parsed,
                isAuthenticated: !!parsed.token && !!parsed.username
            };
        } catch {
            return { isAuthenticated: false, username: null };
        }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
        const saved = localStorage.getItem('OSIA_auth');
        if (!saved) return null;
        try {
            const parsed = JSON.parse(saved);
            if (!parsed.username) return null;
            // Immediate placeholder to prevent hangs
            return {
                username: parsed.username,
                name: parsed.username.split('@')[0] || 'Explorer',
                bio: 'Attuning identity...',
                origin_seed_profile: null,
                isPlaceholder: true,
                refreshKey: Date.now()
            };
        } catch {
            return null;
        }
    });

    const navigate = useNavigate();

    // Force sync on mount or auth change
    useEffect(() => {
        if (auth.isAuthenticated) {
            refreshProfile();
        } else {
            console.log('[AuthContext] Guest session detected, release loading lock.');
            setIsLoading(false);
        }
    }, [auth.isAuthenticated]);

    const refreshProfile = async () => {
        const savedAuth = localStorage.getItem('OSIA_auth');
        if (!savedAuth) {
            console.warn('[AuthContext] No auth found in storage, skipping profile refresh');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const authObj = JSON.parse(savedAuth);
            const token = authObj?.token;

            if (!token) {
                console.error('[AuthContext] Token missing in auth data');
                setIsLoading(false);
                return;
            }

            console.log('[AuthContext] Starting Identity Buffer initialization...');
            let profileData = null;
            let seedData = null;

            // 1. Fetch Identity (Required for App UI)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const profileRes = await fetch('/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (profileRes.ok) {
                    const text = await profileRes.text();
                    profileData = text ? JSON.parse(text) : null;
                    console.log('[AuthContext] Identity fetch successful');
                } else {
                    console.error(`[AuthContext] Identity fetch failed with status: ${profileRes.status}`);
                }
            } catch (e: any) {
                console.error('[AuthContext] Identity fetch error:', e.message);
            }

            // 2. Fetch Origin Seed (Optional/Secondary)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const seedRes = await fetch('/api/origin-seed', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (seedRes.ok) {
                    const text = await seedRes.text();
                    seedData = text ? JSON.parse(text) : null;
                    console.log('[AuthContext] Origin Seed fetch successful');
                } else {
                    console.warn(`[AuthContext] Seed fetch returned status: ${seedRes.status}`);
                }
            } catch (e: any) {
                console.warn('[AuthContext] Seed fetch error:', e.message);
            }

            // Update with real data if we got it
            if (profileData) {
                console.log('[AuthContext] Syncing server identity into buffer');

                // Sync status to auth state and local storage for guards
                setAuth(prev => {
                    const next = {
                        ...prev,
                        onboardingCompleted: !!profileData.onboardingCompleted,
                        isAdmin: !!profileData.isAdmin
                    };
                    localStorage.setItem('OSIA_auth', JSON.stringify(next));
                    return next;
                });

                setUserProfile((prev: any) => ({
                    ...prev,
                    ...profileData,
                    origin_seed_profile: seedData, // Attach seed data
                    isPlaceholder: false,
                    refreshKey: Date.now()
                }));
            }
        } catch (error) {
            console.error('[AuthContext] Refresh failed', error);
        } finally {
            setIsLoading(false);
        }
    };


    const completeAuth = (token: string, user: any) => {
        const newAuth: AuthState = {
            isAuthenticated: true,
            username: user.username,
            token,
            onboardingCompleted: !!user.onboardingCompleted,
            isAdmin: !!user.isAdmin
        };
        setAuth(newAuth);
        localStorage.setItem('OSIA_auth', JSON.stringify(newAuth));
        setUserProfile(user);
        refreshProfile(); // Load full data in background
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await fetch(`${AUTH_API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) throw new Error('Login failed');

            const text = await res.text();
            if (!text) throw new Error('Empty response from server');
            const data = JSON.parse(text);
            completeAuth(data.token, data.user);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const signup = async (username: string, password: string, birthData?: any): Promise<boolean> => {
        console.log(`[AuthContext] Initiating signup fetch for: ${username}`, birthData);
        try {
            const res = await fetch(`${AUTH_API}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    ...birthData
                })
            });

            console.log(`[AuthContext] Signup fetch status: ${res.status}`);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error(`[AuthContext] Signup failed:`, errorData);
                throw new Error(errorData.error || 'Signup failed');
            }

            const text = await res.text();
            if (!text) throw new Error('Empty response from server');
            const data = JSON.parse(text);
            console.log(`[AuthContext] Signup successful, completing auth...`);
            completeAuth(data.token, data.user);
            return true;
        } catch (error) {
            console.error(`[AuthContext] Signup exception:`, error);
            return false;
        }
    };

    const persistCurrentState = async (isExiting = false) => {
        if (!auth.isAuthenticated || !auth.token) return;

        const traits = userProfile?.origin_seed_profile?.traits || [];
        if (traits.length === 0) {
            console.log(`[AuthPersistence] Skipping snapshot (No traits loaded).`);
            return;
        }

        console.log(`[AuthPersistence] Capturing snapshot (Source: ${isExiting ? 'exit' : 'logout'})...`);

        try {
            // Use keepalive for exit persistence
            await fetch('/api/users/snapshot', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: isExiting ? 'exit_persistence' : 'logout_persistence',
                    traits: userProfile?.origin_seed_profile?.traits || []
                }),
                keepalive: isExiting
            });
        } catch (e) {
            console.error('[AuthPersistence] Snapshot failed', e);
        }
    };

    useEffect(() => {
        const handleExit = () => persistCurrentState(true);
        window.addEventListener('beforeunload', handleExit);
        return () => window.removeEventListener('beforeunload', handleExit);
    }, [auth.isAuthenticated, auth.token, userProfile]);

    const logout = async () => {
        await persistCurrentState();
        setAuth({ isAuthenticated: false, username: null });
        setUserProfile(null);
        // Remove all OSIA-related keys (targeted, not localStorage.clear() which nukes everything)
        localStorage.removeItem('OSIA_auth');
        localStorage.removeItem('onboardingState');
        localStorage.removeItem('tourCompleted');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ auth, userProfile, isLoading, setUserProfile, login, signup, logout, refreshProfile, completeAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
