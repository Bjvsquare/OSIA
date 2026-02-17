import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChevronDown, Home, LogOut, Menu, Settings, Share2, Sparkles, User, Users, X, Zap, Shield, RefreshCw } from 'lucide-react';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import { useAuth } from '../../features/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { KYCBanner } from '../kyc/KYCBanner';

export function AppLayout() {
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { auth, userProfile, logout } = useAuth();

    // Fetch connection requests count for notification badge
    const { data: requestCount = 0 } = useQuery({
        queryKey: ['connection-requests-count'],
        queryFn: async () => {
            if (!auth.token) return 0;
            const res = await axios.get('/api/connect/requests', {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            });
            return res.data.length;
        },
        refetchInterval: 30000,
        enabled: !!auth.token
    });



    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Build nav items dynamically
    const navItems = [
        { name: 'Home', path: '/home', icon: Home, tourId: 'nav-home', matchPaths: ['/home'] },
        { name: 'Vision', path: '/vision', icon: Zap, tourId: 'nav-vision', matchPaths: ['/vision'] },
        { name: 'Insights', path: '/thesis', icon: Sparkles, tourId: 'nav-insights', matchPaths: ['/thesis', '/patterns'] },
        { name: 'Connect', path: '/connect', icon: Share2, tourId: 'nav-connect', matchPaths: ['/connect'] },
        { name: 'Circles', path: '/teams', icon: Users, tourId: 'nav-circles', matchPaths: ['/teams', '/team', '/organizations', '/organization'] },
        { name: 'Practice', path: '/practice', icon: RefreshCw, tourId: 'nav-practice', matchPaths: ['/practice'] },
        { name: 'Journey', path: '/journey', icon: Zap, tourId: 'nav-journey', matchPaths: ['/journey', '/history', '/readiness'] },
    ];

    const userDisplayName = userProfile?.name || auth?.username || 'User';
    const initials = (() => {
        const name = userDisplayName;
        if (!name || name === '??' || name.includes('Attuning')) return 'EX';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            const first = parts[0][0];
            const last = parts[parts.length - 1][0];
            return (first + (last || '')).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    })();

    return (
        <div className="min-h-screen bg-transparent text-white font-sans selection:bg-osia-teal-300/30">
            <header className="fixed top-0 left-0 right-0 h-20 bg-osia-deep-900/40 backdrop-blur-xl border-b border-white/5 z-50 flex items-center px-8 justify-between">
                <div className="flex items-center space-x-3">
                    <Link to="/home" className="flex items-center group">
                        <img
                            src="/logo.png"
                            alt="OSIA"
                            className="h-7 w-auto opacity-90 group-hover:opacity-100 transition-all duration-300 brightness-0 invert"
                        />
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav data-tour="sidebar" className="hidden md:flex items-center space-x-1 bg-white/[0.03] rounded-full px-2 py-1 border border-white/5 backdrop-blur-md">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            data-tour={item.tourId}
                            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all relative ${item.matchPaths.some(p => location.pathname.startsWith(p))
                                ? 'bg-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)]'
                                : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${item.name === 'Connect' && requestCount > 0 ? 'animate-text-pulse text-white' : ''}`} />
                            <span className={item.name === 'Connect' && requestCount > 0 ? 'animate-text-pulse text-white' : ''}>
                                {item.name}
                            </span>
                            {item.name === 'Connect' && requestCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-red-500 text-white rounded-full leading-none min-w-[14px] text-center">
                                    {requestCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Toggle navigation"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-osia-neutral-400" />}
                </button>

                <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className="w-6 h-6 rounded-full bg-osia-neutral-200 flex items-center justify-center text-osia-deep-900 text-xs font-bold overflow-hidden">
                            {userProfile?.avatarUrl ? (
                                <img
                                    key={userProfile.refreshKey || userProfile.avatarUrl}
                                    src={`${resolveAvatarUrl(userProfile.avatarUrl)}?t=${userProfile.refreshKey || 0}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                initials
                            )}
                        </div>
                        <ChevronDown className={`w-3 h-3 text-osia-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 py-2 bg-osia-deep-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[60] animate-in fade-in zoom-in duration-200">
                            <div className="px-4 py-3 border-b border-white/5 mb-2">
                                <p className="text-sm font-medium text-white truncate">
                                    {userDisplayName}
                                </p>
                                <p className="text-xs text-osia-neutral-500 truncate mt-0.5">
                                    {auth.username && auth.username.includes('@') ? auth.username : 'Seed Twin • Developing'}
                                </p>
                            </div>
                            <Link
                                to="/settings?tab=profile"
                                onClick={() => setIsDropdownOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${location.search.includes('tab=profile') ? 'text-osia-teal-400 bg-white/5' : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </Link>
                            <Link
                                to="/settings?tab=security"
                                onClick={() => setIsDropdownOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${location.search.includes('tab=security') ? 'text-osia-teal-400 bg-white/5' : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </Link>
                            {userProfile?.isAdmin && (
                                <Link
                                    to="/admin"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${location.pathname.startsWith('/admin') ? 'text-osia-teal-400 bg-white/5' : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Shield className="w-4 h-4" />
                                    <span>Admin Portal</span>
                                </Link>
                            )}
                            <div className="mt-2 pt-2 border-t border-white/5 px-2">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* KYC Verification Banner */}
            <KYCBanner />

            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-20 z-40 bg-osia-deep-900/95 backdrop-blur-xl border-t border-white/5 overflow-y-auto">
                    <nav className="flex flex-col p-6 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-5 py-4 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${item.matchPaths.some(p => location.pathname.startsWith(p))
                                    ? 'bg-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)]'
                                    : 'text-osia-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                                {item.name === 'Connect' && requestCount > 0 && (
                                    <span className="ml-auto px-2 py-0.5 text-[9px] bg-red-500 text-white rounded-full leading-none">
                                        {requestCount}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}

            <main className="relative z-10 pt-24 px-6 min-h-screen">
                <div className="max-w-7xl mx-auto pb-12">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
