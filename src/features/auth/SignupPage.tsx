import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { motion } from 'framer-motion';

import { useAuth } from './AuthContext';
import { TimeRocker } from './components/TimeRocker';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const LIBRARIES: any[] = ["places"];

export function SignupPage() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [step, setStep] = useState<'account' | 'blueprint'>('account');
    const [isLoading, setIsLoading] = useState(false);

    // Account Data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');

    // Blueprint Data
    const [date, setDate] = useState('');
    const [timeMode, setTimeMode] = useState<'EXACT' | 'WINDOW' | 'UNKNOWN'>('UNKNOWN');
    const [exactTime, setExactTime] = useState('');
    const [windowStart, setWindowStart] = useState('');
    const [windowEnd, setWindowEnd] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [autocomplete, setAutocomplete] = useState<any>(null);

    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey,
        libraries: LIBRARIES
    });

    const onLoad = (autoC: any) => {
        setAutocomplete(autoC);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place && place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setSelectedLocation({ lat, lng });
                setLocationQuery(place.formatted_address || place.name || '');
            }
        }
    };

    const [searchTimeout, setSearchTimeout] = useState<any>(null);

    const handleLocationSearchFallback = async (query: string) => {
        setLocationQuery(query);

        if (searchTimeout) clearTimeout(searchTimeout);

        if (query.length < 3) {
            setLocationSuggestions([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const data = await response.json();
                setLocationSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error fetching location:', error);
            }
        }, 300); // 300ms debounce

        setSearchTimeout(timeout);
    };

    const selectLocationFallback = (location: any) => {
        setSelectedLocation({
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lon)
        });
        setLocationQuery(location.display_name);
        setShowSuggestions(false);
    };

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate access code first
        try {
            const response = await fetch('/api/founding-circle/validate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode, email })
            });

            const data = await response.json();

            if (!response.ok || !data.valid) {
                setError(data.error || 'Invalid access code. Please check your email for your founding circle code.');
                return;
            }

            // Code is valid, proceed to blueprint
            setStep('blueprint');
        } catch (err: any) {
            setError(`Network error: ${err.message}. Please ensure the server is running on port 3001.`);
        }
    };

    const handleFinalSignup = async () => {
        setIsLoading(true);
        try {
            // 1. Resolve location coordinates
            let lat = selectedLocation?.lat || 0;
            let lng = selectedLocation?.lng || 0;

            // 2. Perform Integrated Signup
            const success = await signup(email, password, {
                name,
                birthDate: date,
                birthTime: timeMode === 'EXACT' ? exactTime : (timeMode === 'WINDOW' ? `${windowStart}-${windowEnd}` : '12:00:00'),
                birthLocation: locationQuery,
                birthTimeConfidence: timeMode,
                latitude: lat,
                longitude: lng,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                accessCode: accessCode
            });

            if (!success) {
                setError("Signup failed. If your access code was already validated, please try again or contact support.");
                setIsLoading(false);
                return;
            }

            navigate('/welcome');
        } catch (error) {
            console.error("Signup failed", error);
            setError("An unexpected error occurred during signup.");
        } finally {
            setIsLoading(false);
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
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {step === 'account' ? 'Begin your blueprint' : 'Map your origin'}
                    </h1>
                    <p className="text-osia-neutral-400 mt-2">
                        {step === 'account' ? 'Create an account to start.' : 'Enter your details to generate your baseline.'}
                    </p>
                </div>

                <Card className="p-10 border-white/5 bg-osia-deep-900/60 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    {step === 'account' ? (
                        <form onSubmit={handleAccountSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="accessCode">Founding Circle Access Code</Label>
                                <Input
                                    id="accessCode"
                                    type="text"
                                    placeholder="OSIA-FC-XXX-XXXX"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                    required
                                    className="bg-white/5 border-white/10 focus:border-osia-teal-500 font-mono"
                                />
                                <p className="text-xs text-osia-neutral-500">
                                    Check your email for your unique access code
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 focus:border-osia-teal-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 focus:border-osia-teal-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 focus:border-osia-teal-500"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" variant="primary" className="w-full">
                                Continue
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Birth Time</Label>
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setTimeMode('UNKNOWN')}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${timeMode === 'UNKNOWN'
                                            ? 'bg-osia-teal-500/20 border-osia-teal-500 text-white'
                                            : 'bg-white/5 border-white/10 text-osia-neutral-300 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="font-medium">Unknown / Not Sure</div>
                                        <div className="text-xs text-osia-neutral-400 mt-1">Profile will be broader, but still meaningful</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTimeMode('WINDOW')}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${timeMode === 'WINDOW'
                                            ? 'bg-osia-teal-500/20 border-osia-teal-500 text-white'
                                            : 'bg-white/5 border-white/10 text-osia-neutral-300 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="font-medium">I know a time range</div>
                                        <div className="text-xs text-osia-neutral-400 mt-1">Morning, afternoon, evening, etc.</div>
                                    </button>

                                    {timeMode === 'WINDOW' && (
                                        <div className="grid grid-cols-1 gap-4 pl-4 mt-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-osia-neutral-400">From</Label>
                                                <TimeRocker
                                                    value={windowStart || "09:00"}
                                                    onChange={setWindowStart}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs text-osia-neutral-400">To</Label>
                                                <TimeRocker
                                                    value={windowEnd || "17:00"}
                                                    onChange={setWindowEnd}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setTimeMode('EXACT')}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${timeMode === 'EXACT'
                                            ? 'bg-osia-teal-500/20 border-osia-teal-500 text-white'
                                            : 'bg-white/5 border-white/10 text-osia-neutral-300 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="font-medium">I know the exact time</div>
                                        <div className="text-xs text-osia-neutral-400 mt-1">Most precise profile</div>
                                    </button>

                                    {timeMode === 'EXACT' && (
                                        <div className="pl-4 mt-4 flex items-center justify-between">
                                            <Label className="text-xs text-osia-neutral-400">Exact Time</Label>
                                            <TimeRocker
                                                value={exactTime || "12:00"}
                                                onChange={setExactTime}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <Label>Place of Birth</Label>
                                {isLoaded && !loadError && googleMapsApiKey ? (
                                    <Autocomplete
                                        onLoad={onLoad}
                                        onPlaceChanged={onPlaceChanged}
                                    >
                                        <Input
                                            type="text"
                                            placeholder="City, Country"
                                            value={locationQuery}
                                            onChange={(e) => setLocationQuery(e.target.value)}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </Autocomplete>
                                ) : (
                                    <Input
                                        type="text"
                                        placeholder="City, Country"
                                        value={locationQuery}
                                        onChange={(e) => handleLocationSearchFallback(e.target.value)}
                                        onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className="bg-white/5 border-white/10"
                                    />
                                )}

                                {/* OSM Fallback Suggestions */}
                                {showSuggestions && locationSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-osia-deep-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                        {locationSuggestions.map((loc, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                                                onClick={() => selectLocationFallback(loc)}
                                                className="w-full text-left px-4 py-3 text-sm text-osia-neutral-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                            >
                                                {loc.display_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleFinalSignup}
                                variant="primary"
                                className="w-full"
                                disabled={!date || !locationQuery || isLoading}
                            >
                                {isLoading ? 'Generating Blueprint...' : 'Complete Signup'}
                            </Button>

                            <button
                                onClick={() => setStep('account')}
                                className="w-full text-sm text-osia-neutral-400 hover:text-white transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm text-osia-neutral-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-osia-teal-400 hover:text-osia-teal-300 font-medium">
                            Sign in
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
