import * as Astronomy from 'astronomy-engine';
import { DateTime } from 'luxon';
// @ts-ignore
import tzlookup from 'tz-lookup';

export interface BirthData {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm:ss
    location: string;
    latitude: number;
    longitude: number;
    timezone?: string; // Optional: will be resolved from coordinates if missing
}

export interface PlanetPosition {
    name: string;
    sign: string;
    house: number;
    degree: number;
    retrograde: boolean;
    longitude: number; // Raw 0-360 value
    speed: number;     // Degrees per hour
}

export interface Blueprint {
    planets: PlanetPosition[];
    aspects: { planet1: string; planet2: string; type: string; orb: number; applying: boolean }[];
    houses: {
        ascendant: string;
        midheaven: string;
        cusps: number[];
        distribution: Record<string, number>;
    };
    elements: { fire: number; earth: number; air: number; water: number };
}

export class AstrologyService {
    private SIGNS = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    private getSign(longitude: number): string {
        const index = Math.floor(longitude / 30) % 12;
        return this.SIGNS[index];
    }

    public async calculateBlueprint(data: BirthData): Promise<Blueprint> {
        // 0. Resolve Timezone from Coordinates (User may be away from birth location)
        let resolvedTimezone = data.timezone;
        if (!resolvedTimezone) {
            // Robust check for CommonJS/ESM interop
            const lookupFunc = typeof tzlookup === 'function' ? tzlookup : (tzlookup as any).default;
            if (typeof lookupFunc !== 'function') {
                resolvedTimezone = 'UTC'; // Fallback
            } else {
                resolvedTimezone = lookupFunc(data.latitude, data.longitude);
            }
        }

        try {
            // 1. Precise UTC Conversion
            const dt = DateTime.fromISO(`${data.date}T${data.time}`, { zone: resolvedTimezone });
            if (!dt.isValid) {
                throw new Error(`Invalid birth time or timezone: ${dt.invalidExplanation}`);
            }

            const utcDate = dt.toJSDate();
            const astroTime = Astronomy.MakeTime(utcDate);
            const deltaT = 1.0;
            const futureTime = Astronomy.MakeTime(new Date(utcDate.getTime() + (deltaT * 3600000)));

            const bodies = [
                'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
                'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
            ];

            // 2. Body Positions
            const planets: PlanetPosition[] = bodies.map(body => {
                const l = this.getBodyLongitude(body, astroTime);
                const lNext = this.getBodyLongitude(body, futureTime);

                // Normalizing 360 wrap
                let diff = lNext - l;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;

                const speed = diff / deltaT;
                const retrograde = speed < 0;
                const sign = this.getSign(l);
                const degree = l % 30;

                return {
                    name: body,
                    sign,
                    house: 0, // Will be updated after cusps
                    degree,
                    retrograde,
                    longitude: l,
                    speed
                };
            });

            // 3. Real Angles (ASC/MC) & House Cusps
            const siderealTime = this.calculateLocalSiderealTime(utcDate, data.longitude);
            const obliquity = 23.43929; // Approx, could be dynamic

            // Real Formulas for ASC/MC (Simplistic but triggered by LST/Lat)
            // ASC = atan(cos(LST) / (-sin(LST)*cos(e) - tan(lat)*sin(e)))
            const ascLon = this.calculateAscendant(siderealTime, data.latitude, obliquity);
            const mcLon = this.calculateMidheaven(siderealTime, obliquity);

            // House Cusps (Placidus approximation or Whole Sign based on ASC)
            const cusps = this.calculateHouseCusps(ascLon);

            // Update planet houses based on cusps
            planets.forEach(p => {
                p.house = this.determineHouse(p.longitude, cusps);
            });

            const elements = { fire: 0, earth: 0, air: 0, water: 0 };
            const elementMap: Record<string, keyof typeof elements> = {
                'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
                'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
                'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
                'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
            };

            // House Distribution (Real density-derived weight)
            const distribution: Record<string, number> = {};
            for (let i = 1; i <= 12; i++) distribution[`h${i}`] = 0;

            planets.forEach(p => {
                elements[elementMap[p.sign]]++;
                distribution[`h${p.house}`]++;
            });

            // Normalize distribution
            const totalBodies = planets.length;
            if (totalBodies > 0) {
                Object.keys(distribution).forEach(key => {
                    distribution[key] = parseFloat((distribution[key] / totalBodies).toFixed(3));
                });
            }

            const aspects = this.calculateAspects(planets, astroTime);

            return {
                planets,
                aspects,
                houses: {
                    ascendant: this.getSign(ascLon),
                    midheaven: this.getSign(mcLon),
                    cusps,
                    distribution
                },
                elements,
                // @ts-ignore
                calcModel: "baseline_v1"
            };
        } catch (err) {
            console.error("[AstrologyService] Fatal Calculation Error:", err);
            throw err;
        }
    }

    private getBodyLongitude(body: string, time: any): number {
        try {
            if (body === 'Sun') {
                return (Astronomy as any).SunPosition(time).elon;
            } else if (body === 'Moon') {
                return Astronomy.EclipticLongitude(body as any, time);
            } else {
                return Astronomy.EclipticLongitude(body as any, time);
            }
        } catch (e) {
            console.error(`[AstrologyService] Physics Error for ${body}:`, e);
            throw new Error(`Signal Leak: Physics calculation failed for ${body}`);
        }
    }

    private calculateLocalSiderealTime(date: Date, lon: number): number {
        // GST = 6.6460656 + 2400.0513 * T + 0.00002581 * T^2
        // T is Julian centuries from J2000
        const julianDay = (date.getTime() / 86400000) + 2440587.5;
        const T = (julianDay - 2451545.0) / 36525;
        let gst = 280.46061837 + 360.98564736629 * (julianDay - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
        gst = gst % 360;
        if (gst < 0) gst += 360;

        let lst = gst + lon;
        lst = lst % 360;
        if (lst < 0) lst += 360;
        return lst;
    }

    private calculateAscendant(lst: number, lat: number, obl: number): number {
        const lstRad = lst * (Math.PI / 180);
        const latRad = lat * (Math.PI / 180);
        const oblRad = obl * (Math.PI / 180);

        const ascRad = Math.atan2(Math.cos(lstRad), -(Math.sin(lstRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad)));
        let asc = ascRad * (180 / Math.PI);
        asc = (asc + 360) % 360;
        return asc;
    }

    private calculateMidheaven(lst: number, obl: number): number {
        const lstRad = lst * (Math.PI / 180);
        const oblRad = obl * (Math.PI / 180);

        const mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(oblRad));
        let mc = mcRad * (180 / Math.PI);
        mc = (mc + 360) % 360;
        return mc;
    }

    private calculateHouseCusps(ascLon: number): number[] {
        // Implementing "Whole Sign" as the deterministic OSIA v1.2 baseline
        const firstCusp = Math.floor(ascLon / 30) * 30;
        const cusps = [];
        for (let i = 0; i < 12; i++) {
            cusps.push((firstCusp + i * 30) % 360);
        }
        return cusps;
    }

    private determineHouse(lon: number, cusps: number[]): number {
        for (let i = 0; i < 12; i++) {
            const start = cusps[i];
            const end = cusps[(i + 1) % 12];

            if (start <= end) {
                if (lon >= start && lon < end) return i + 1;
            } else {
                // Wrap interval (e.g., 330 -> 0)
                if (lon >= start || lon < end) return i + 1;
            }
        }
        return 12;
    }

    private calculateAspects(planets: PlanetPosition[], time: any): { planet1: string; planet2: string; type: string; orb: number; applying: boolean }[] {
        const aspects: { planet1: string; planet2: string; type: string; orb: number; applying: boolean }[] = [];
        const validAspects = [
            { name: 'Conjunction', angle: 0, orb: 10 },
            { name: 'Opposition', angle: 180, orb: 10 },
            { name: 'Trine', angle: 120, orb: 8 },
            { name: 'Square', angle: 90, orb: 8 },
            { name: 'Sextile', angle: 60, orb: 6 }
        ];

        // For applying/separating derivative
        const delta = 0.01; // hour
        const futureTime = (Astronomy as any).MakeTime(new Date(time.date.getTime() + (delta * 3600000)));

        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const p1 = planets[i];
                const p2 = planets[j];

                const getAngleDiff = (lon1: number, lon2: number, target: number) => {
                    let d = Math.abs(lon1 - lon2);
                    if (d > 180) d = 360 - d;
                    return Math.abs(d - target);
                };

                const currentDiff = getAngleDiff(p1.longitude, p2.longitude, 0); // Raw separation

                for (const aspect of validAspects) {
                    let d = Math.abs(p1.longitude - p2.longitude);
                    if (d > 180) d = 360 - d;

                    if (Math.abs(d - aspect.angle) <= aspect.orb) {
                        // Derivative-based applying/separating
                        const p1Next = this.getBodyLongitude(p1.name, futureTime);
                        const p2Next = this.getBodyLongitude(p2.name, futureTime);

                        const currentOrb = Math.abs(d - aspect.angle);

                        let dNext = Math.abs(p1Next - p2Next);
                        if (dNext > 180) dNext = 360 - dNext;
                        const futureOrb = Math.abs(dNext - aspect.angle);

                        const applying = futureOrb < currentOrb;

                        aspects.push({
                            planet1: p1.name,
                            planet2: p2.name,
                            type: aspect.name,
                            orb: currentOrb,
                            applying
                        });
                    }
                }
            }
        }
        return aspects;
    }
}

export const astrologyService = new AstrologyService();
