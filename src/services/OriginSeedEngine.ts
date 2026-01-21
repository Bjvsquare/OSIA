import { AstronomyService, type BirthChart } from '../features/blueprint/AstronomyService';

interface OriginSeedInput {
    dob: string; // YYYY-MM-DD
    birthplace: {
        label: string;
        lat: number;
        lon: number;
    };
    birth_time: {
        mode: 'EXACT' | 'WINDOW' | 'UNKNOWN';
        time?: string; // HH:MM
        window?: {
            start: string; // HH:MM
            end: string; // HH:MM
        };
    };
}

interface TraitScore {
    trait_id: string;
    score: number; // 0-100
    confidence: number; // 0-1
    stats?: {
        min: number;
        max: number;
        median: number;
        spread: number;
    };
}

interface OriginSeedProfile {
    user_id: string;
    precision: 'HIGH' | 'MEDIUM' | 'BROAD';
    trait_vector: TraitScore[];
    uncertainty: {
        time_mode: 'EXACT' | 'WINDOW' | 'UNKNOWN';
        mean_spread: number;
        sampling?: {
            samples: number;
            strategy: 'SINGLE' | 'WINDOW_SAMPLE' | 'FULL_DAY_SAMPLE';
        };
    };
    version: string;
    generated_at: string;
}

/**
 * Origin Seed Engine
 * Generates neutral trait profiles from birth data with time-mode support.
 * 
 * CONSTRAINTS:
 * - Never exposes raw celestial coordinates to user
 * - All output uses neutral trait language
 * - Deterministic: same inputs => same v0 profile
 */
export class OriginSeedEngine {
    /**
     * Generate Origin Seed Profile v0
     */
    static async generate(input: OriginSeedInput, userId: string): Promise<OriginSeedProfile> {
        const { dob, birthplace, birth_time } = input;

        // Parse date
        const birthDate = new Date(dob);

        let charts: BirthChart[];
        let precision: 'HIGH' | 'MEDIUM' | 'BROAD';
        let sampling: OriginSeedProfile['uncertainty']['sampling'];

        // Time mode handling
        switch (birth_time.mode) {
            case 'EXACT':
                if (!birth_time.time) {
                    throw new Error('EXACT mode requires time');
                }
                charts = [this.calculateSingleChart(birthDate, birth_time.time, birthplace)];
                precision = 'HIGH';
                sampling = { samples: 1, strategy: 'SINGLE' };
                break;

            case 'WINDOW':
                if (!birth_time.window) {
                    throw new Error('WINDOW mode requires window');
                }
                charts = this.sampleTimeWindow(
                    birthDate,
                    birth_time.window.start,
                    birth_time.window.end,
                    birthplace,
                    10 // 10 samples for window
                );
                precision = 'MEDIUM';
                sampling = { samples: charts.length, strategy: 'WINDOW_SAMPLE' };
                break;

            case 'UNKNOWN':
                charts = this.sampleFullDay(birthDate, birthplace, 24); // 24 samples for full day
                precision = 'BROAD';
                sampling = { samples: charts.length, strategy: 'FULL_DAY_SAMPLE' };
                break;

            default:
                throw new Error(`Unsupported time mode: ${birth_time.mode}`);
        }

        // Convert charts to trait scores
        const traitScores = this.chartsToTraits(charts);

        // Calculate uncertainty metrics
        const meanSpread = this.calculateMeanSpread(traitScores);

        return {
            user_id: userId,
            precision,
            trait_vector: traitScores,
            uncertainty: {
                time_mode: birth_time.mode,
                mean_spread: meanSpread,
                sampling
            },
            version: 'v0',
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Calculate a single birth chart for exact time
     */
    private static calculateSingleChart(
        date: Date,
        time: string,
        location: { lat: number; lon: number }
    ): BirthChart {
        const [hours, minutes] = time.split(':').map(Number);
        const birthMoment = new Date(date);
        birthMoment.setHours(hours, minutes, 0, 0);

        return AstronomyService.calculateChart(birthMoment, location.lat, location.lon);
    }

    /**
     * Sample charts across a time window
     */
    private static sampleTimeWindow(
        date: Date,
        startTime: string,
        endTime: string,
        location: { lat: number; lon: number },
        samples: number
    ): BirthChart[] {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const startMinutesTotal = startHours * 60 + startMinutes;
        const endMinutesTotal = endHours * 60 + endMinutes;
        const intervalMinutes = (endMinutesTotal - startMinutesTotal) / (samples - 1);

        const charts: BirthChart[] = [];
        for (let i = 0; i < samples; i++) {
            const minutesFromStart = startMinutesTotal + (intervalMinutes * i);
            const hours = Math.floor(minutesFromStart / 60);
            const minutes = Math.floor(minutesFromStart % 60);
            const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            charts.push(this.calculateSingleChart(date, time, location));
        }

        return charts;
    }

    /**
     * Sample charts across full 24-hour day
     */
    private static sampleFullDay(
        date: Date,
        location: { lat: number; lon: number },
        samples: number
    ): BirthChart[] {
        const intervalHours = 24 / samples;
        const charts: BirthChart[] = [];

        for (let i = 0; i < samples; i++) {
            const hours = Math.floor(intervalHours * i);
            const minutes = Math.floor((intervalHours * i - hours) * 60);
            const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            charts.push(this.calculateSingleChart(date, time, location));
        }

        return charts;
    }

    /**
     * Convert birth charts to aggregated trait scores
     * Uses symbolic-to-neutral translation (no astrological terms exposed)
     */
    private static chartsToTraits(charts: BirthChart[]): TraitScore[] {
        // Load trait catalog (in real impl, load from file)
        const traitIds = [
            'COG_TEMPO', 'COG_ABSTRACTION', 'STRUCTURE_NEED', 'NOVELTY_APPETITE',
            'DEPTH_ORIENT', 'EMO_SIGNAL_GAIN', 'BOUNDARY_STYLE', 'TRUST_THRESHOLD',
            'CONTROL_POSTURE', 'RISK_TOLERANCE', 'CONFLICT_STYLE', 'SOCIAL_ENERGY',
            'INFLUENCE_STYLE', 'WORK_MODE', 'QUALITY_BAR', 'STRESS_ACTIVATION',
            'STRESS_DIRECTION', 'DISCIPLINE_STYLE', 'VALUE_SECURITY', 'VALUE_GROWTH',
            'VALUE_CONNECTION', 'DECISION_STYLE', 'LEARNING_STYLE', 'TIME_HORIZON'
        ];

        const traitScores: TraitScore[] = [];

        for (const traitId of traitIds) {
            const scores = charts.map(chart => this.chartToTraitScore(chart, traitId));

            const sorted = scores.sort((a, b) => a - b);
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const median = sorted[Math.floor(sorted.length / 2)];
            const spread = max - min;

            // Confidence inversely proportional to spread
            const confidence = Math.max(0.3, 1 - (spread / 100));

            traitScores.push({
                trait_id: traitId,
                score: median,
                confidence,
                stats: charts.length > 1 ? { min, max, median, spread } : undefined
            });
        }

        return traitScores;
    }

    /**
     * Map a single chart to a trait score (0-100)
     * This is a placeholder - real implementation would use sophisticated mapping
     */
    private static chartToTraitScore(chart: BirthChart, traitId: string): number {
        // PROTOTYPE: Simple deterministic mapping based on chart data
        // Real implementation would use domain expertise and validated mappings

        const sun = chart.positions.find((p: any) => p.body === 'Sun');
        const moon = chart.positions.find((p: any) => p.body === 'Moon');
        const mercury = chart.positions.find((p: any) => p.body === 'Mercury');

        if (!sun || !moon || !mercury) {
            return 50; // Default midpoint
        }

        // Deterministic pseudo-mapping (for prototype)
        const hash = (sun.longitude + moon.longitude + mercury.longitude + traitId.length) % 100;
        return Math.max(10, Math.min(90, hash)); // Constrain to 10-90 range
    }

    /**
     * Calculate mean spread across all traits
     */
    private static calculateMeanSpread(traits: TraitScore[]): number {
        const spreads = traits
            .filter(t => t.stats)
            .map(t => t.stats!.spread);

        if (spreads.length === 0) return 0;

        return spreads.reduce((sum, s) => sum + s, 0) / spreads.length;
    }
}
