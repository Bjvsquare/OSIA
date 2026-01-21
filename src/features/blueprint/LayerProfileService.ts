import { AstronomyService } from './AstronomyService';
import { TraitTranslator, type Trait } from './TraitTranslator';

export interface LayerProfile {
    core: Trait;       // Sun
    emotional: Trait;  // Moon
    mental: Trait;     // Mercury
    relational: Trait; // Venus
    drive: Trait;      // Mars
    growth: Trait;     // Jupiter
    structure: Trait;  // Saturn
    innovation: Trait; // Uranus
    intuition: Trait;  // Neptune
    transformation: Trait; // Pluto
    destiny: Trait;    // North Node
    karma: Trait;      // South Node
    persona: Trait;    // Ascendant
    inner: Trait;      // IC
    public: Trait;     // MC
}

export class LayerProfileService {
    static async generateProfile(date: Date, lat: number, lng: number): Promise<LayerProfile> {
        // 1. Calculate Coordinate Positions
        const chart = AstronomyService.calculateChart(date, lat, lng);

        // 2. Translate to Traits (15 Layers)
        // Note: We need to ensure TraitTranslator handles all these bodies/points
        const traits = TraitTranslator.translate(chart.positions);

        // 3. Map to Layer Profile Structure
        // This is a simplified mapping assuming the TraitTranslator returns traits with IDs or categories we can map.
        // For MVP, we might need to be more explicit in TraitTranslator about which body maps to which layer.

        // Helper to find trait by body name (case-insensitive)
        const findTrait = (body: string): Trait => {
            const t = traits.find(t => t.id.startsWith(body.toLowerCase()));
            return t || {
                id: `${body.toLowerCase()}_unknown`,
                name: `${body} Energy`,
                description: `Your ${body} placement represents a unique facet of your blueprint.`,
                category: 'Core', // Default
                intensity: 0.5
            };
        };

        return {
            core: findTrait('Sun'),
            emotional: findTrait('Moon'),
            mental: findTrait('Mercury'),
            relational: findTrait('Venus'),
            drive: findTrait('Mars'),
            growth: findTrait('Jupiter'),
            structure: findTrait('Saturn'),
            innovation: findTrait('Uranus'),
            intuition: findTrait('Neptune'),
            transformation: findTrait('Pluto'),
            destiny: findTrait('NorthNode'),
            karma: findTrait('SouthNode'),
            persona: findTrait('Ascendant'),
            inner: findTrait('IC'),
            public: findTrait('MC')
        };
    }
}
