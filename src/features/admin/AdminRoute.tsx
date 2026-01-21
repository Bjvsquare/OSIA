import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AdminRoute({ children }: { children: ReactNode }) {
    const { auth, isLoading, userProfile } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen bg-osia-deep-900 flex items-center justify-center text-white font-mono">Verifying Credentials...</div>;
    }

    // Role check: Is current user an Administrator?
    const isAdmin = auth.isAuthenticated && (auth.isAdmin || userProfile?.isAdmin);

    if (!isLoading) {
        if (!auth.isAuthenticated) {
            console.warn('[AdminGuard] Not authenticated, redirecting to login');
            return <Navigate to="/login" replace />;
        }
        if (!isAdmin) {
            console.warn(`[AdminGuard] Unauthorized access blocked for: ${auth.username}. isAdmin status: auth=${auth.isAdmin}, profile=${userProfile?.isAdmin}`);
            return <Navigate to="/home" replace />;
        }
    }

    return <>{children}</>;
}
