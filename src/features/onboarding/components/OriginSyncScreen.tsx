import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { MapPin, Clock, Calendar, Sparkles, Loader2, CheckCircle2, Shield, Lock } from 'lucide-react';
import { api } from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';

interface OriginSyncScreenProps {
    onComplete: () => void;
}

export const OriginSyncScreen: React.FC<OriginSyncScreenProps> = ({ onComplete }) => {
    const { userProfile, refreshProfile } = useAuth();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('12:00');
    const [location, setLocation] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    // Location search state
    const [searchTimeout, setSearchTimeout] = useState<any>(null);
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Pre-fill from user profile if data was already collected during signup
    useEffect(() => {
        if (userProfile) {
            const profile = userProfile as any;
            if (profile.birthDate) setDate(profile.birthDate);
            if (profile.birthTime) setTime(profile.birthTime);
            if (profile.birthLocation) {
                setLocation(profile.birthLocation);
                if (profile.latitude && profile.longitude) {
                    setSelectedLocation({ lat: profile.latitude, lng: profile.longitude });
                }
            }
        }
    }, [userProfile]);

    const handleLocationSearch = async (query: string) => {
        setLocation(query);

        if (searchTimeout) clearTimeout(searchTimeout);

        if (query.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const data = await response.json();
                setLocationSuggestions(data || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error fetching location:', error);
            }
        }, 300);

        setSearchTimeout(timeout);
    };

    const selectLocation = (loc: any) => {
        setSelectedLocation({
            lat: parseFloat(loc.lat),
            lng: parseFloat(loc.lon)
        });
        setLocation(loc.display_name);
        setShowSuggestions(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
            await api.saveAnswer({
                user_id: userProfile?.id || 'anonymous',
                question_id: 'ORIGIN_SYNC',
                answered_at: new Date().toISOString(),
                value: { date, time, location, latitude: selectedLocation?.lat, longitude: selectedLocation?.lng }
            });

            // Trigger blueprint generation on backend
            const authData = localStorage.getItem('OSIA_auth');
            const token = authData ? JSON.parse(authData).token : null;

            const response = await fetch('/api/origin-seed', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    birthDate: date,
                    birthTime: time,
                    birthLocation: location,
                    latitude: selectedLocation?.lat || 0,
                    longitude: selectedLocation?.lng || 0,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // If already seeded, treat as success and proceed
                if (errorData.error?.includes('already') || response.status === 409) {
                    console.log('[OriginSync] Data already seeded, proceeding...');
                } else {
                    throw new Error(errorData.error || 'Foundational sync failed');
                }
            }

            // Short delay for UX effect then proceed
            setTimeout(async () => {
                await refreshProfile();
                setIsSyncing(false);
                onComplete();
            }, 1000);
        } catch (err: any) {
            console.error("Sync failed:", err);
            setSyncError(err.message || "We encountered an issue during pattern initialization.");
            setIsSyncing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-osia-teal-500/10 border border-osia-teal-500/20 text-[10px] font-black text-osia-teal-500 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" />
                    Phase 1: Pattern Initialization
                </div>
                <h1 className="text-4xl font-extrabold tracking-tighter text-white leading-tight">
                    Synchronize your <br />
                    <span className="text-osia-teal-500">Origin Coordinates.</span>
                </h1>
                <p className="text-osia-neutral-400 text-sm max-w-md mx-auto">
                    To project your Digital Twin, we need the precise foundational alignment of your entry into the world.
                </p>
            </header>

            <Card className="p-8 bg-osia-deep-800/40 border-white/5 shadow-2xl backdrop-blur-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500 flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-osia-teal-500" />
                            Date of Birth
                        </Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-white/5 border-white/10 focus:border-osia-teal-500 transition-all text-white h-12"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-osia-teal-500" />
                            Time (Approx)
                        </Label>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="bg-white/5 border-white/10 focus:border-osia-teal-500 transition-all text-white h-12"
                        />
                    </div>
                </div>

                <div className="space-y-2 relative">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-osia-teal-500" />
                        Place of Birth
                    </Label>
                    <Input
                        type="text"
                        placeholder="City, Country"
                        value={location}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="bg-white/5 border-white/10 focus:border-osia-teal-500 transition-all text-white h-12"
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-osia-deep-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-3xl">
                            {locationSuggestions.map((loc, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => selectLocation(loc)}
                                    className="w-full text-left px-4 py-3 text-xs text-osia-neutral-300 hover:bg-osia-teal-500/10 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                >
                                    {loc.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error with recovery options */}
                {syncError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                        <p className="text-sm text-red-400">{syncError}</p>
                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSync}
                                className="text-xs"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSyncError(null);
                                    onComplete();
                                }}
                                className="text-xs text-osia-neutral-400 hover:text-white"
                            >
                                Skip for Now
                            </Button>
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSync}
                        disabled={!date || !location || isSyncing}
                        className="w-full py-8 text-lg font-black tracking-tight rounded-2xl shadow-[0_0_30px_rgba(56,163,165,0.3)] transition-all"
                    >
                        {isSyncing ? (
                            <span className="flex items-center gap-3">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                QUANTUM MAPPING...
                            </span>
                        ) : (
                            "INITIALIZE SYNC"
                        )}
                    </Button>
                </div>

                <p className="text-[9px] text-osia-neutral-600 font-bold text-center uppercase tracking-[0.2em]">
                    Data is processed locally for encryption purposes
                </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Foundational Precision", icon: Sparkles, tooltip: "Your birth data creates unique foundational patterns" },
                    { label: "Private & Encrypted", icon: Lock, tooltip: "Your personal details are encrypted — we store patterns, not personal information" },
                    { label: "High Fidelity Model", icon: MapPin, tooltip: "Location and time precision improves model accuracy" }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-4 space-y-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all" title={item.tooltip}>
                        <item.icon className="w-6 h-6 text-osia-teal-500" />
                        <span className="text-[9px] font-black uppercase text-white tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
