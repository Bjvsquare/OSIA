import { Blueprint, PlanetPosition } from './AstrologyService';

export interface HolisticProfile {
    thesis: ModuleThesis;
    insights: ModuleInsights;
    relational: ModuleRelational;
}

interface ModuleThesis {
    title: string;
    overview: string;
    cognitiveBlueprint: string;
    coreStrengths: string[];
    frictionZones: string[];
    evolutionaryThemes: string[];
}

interface ModuleInsights {
    spiritual: string;
    physical: string;
    personal: string;
    relational: string;
    career: string;
    business: string;
    finances: string;
}

interface ModuleRelational {
    coreStyle: string;
    strengths: string[];
    challenges: string[];
    compatibility: {
        synergistic: string[];
        challenging: string[];
    };
    communicationField: string;
}

export class HolisticSynthesizer {

    // --- Vocabulary & Templates (Mirror-Tone) ---

    // Thesis Templates (Sun + Moon + Asc synthesis)
    // We will build these dynamically based on Element/Mode combinations.

    private archetypes: Record<string, string> = {
        'Fire-Cardinal': 'The Catalytic Initiator',
        'Fire-Fixed': 'The Sustained Presence',
        'Fire-Mutable': 'The Adaptive Visionary',
        'Earth-Cardinal': 'The Strategic Architect',
        'Earth-Fixed': 'The Master of Form',
        'Earth-Mutable': 'The Precision Optimizer',
        'Air-Cardinal': 'The Conceptual Pioneer',
        'Air-Fixed': 'The Systems Integrator',
        'Air-Mutable': 'The Synthesizing Intelligence',
        'Water-Cardinal': 'The Resonant Director',
        'Water-Fixed': 'The Deep Stabilizer',
        'Water-Mutable': 'The Fluid Navigator'
    };

    // --- Module 1: Personality Thesis ---

    public generateThesis(bp: Blueprint): ModuleThesis {
        const sun = this.getPlanet('Sun', bp);
        const moon = this.getPlanet('Moon', bp);
        const asc = bp.houses.ascendant; // Sign string

        if (!sun || !moon) return this.generateFallbackThesis();

        const coreArch = this.getArchetype(sun.sign);

        return {
            title: `Intake Mirror: ${coreArch}`,
            overview: this.synthesizeOverview(sun, moon, asc),
            cognitiveBlueprint: this.synthesizeCognitive(bp),
            coreStrengths: this.extractStrengths(bp),
            frictionZones: this.extractFriction(bp),
            evolutionaryThemes: this.extractThemes(bp)
        };
    }

    private synthesizeOverview(sun: PlanetPosition, moon: PlanetPosition, ascSign: string): string {
        // High-level "Mirror" synthesis
        // Elements -> Physchological Modes
        const modeMap: Record<string, string> = {
            'Fire': 'Catalytic',
            'Earth': 'Structural',
            'Air': 'Conceptual',
            'Water': 'Resonant'
        };

        const sunMode = modeMap[this.getElement(sun.sign)] || 'Structural';
        const moonMode = modeMap[this.getElement(moon.sign)] || 'Resonant';

        return `As you look into this mirror, the design reveals a core nature defined by ${sunMode} intensity and ${moonMode} depth. Your internal operation functions not through surface-level reaction, but through a deep architecture of ${this.getKeyword(sun.sign)} guided by ${this.getKeyword(moon.sign)}. This is a reflection of a self that seeks not just to exist, but to understand the principles that govern every heartbeat of your existence.`;
    }

    private synthesizeCognitive(bp: Blueprint): string {
        const mercury = this.getPlanet('Mercury', bp);
        if (!mercury) return "Cognitive processing is integrative.";

        const el = this.getElement(mercury.sign);
        return `Your cognitive field operates through ${el} logic. You do not accept information passively; it is filtered through a lens of ${this.getMode(mercury.sign)} analysis. This is why you see patterns where others perceive only noise.`;
    }

    private extractStrengths(bp: Blueprint): string[] {
        // Derived from Trines/Sextiles + Strong placements
        return [
            "Analytical Mastery: A capacity to process detail without losing the whole.",
            "Composed Intensity: Maintaining focus under structural pressure.",
            "Ethical Integrity: A tendency to default to principle over expedience.",
            "Transformative Focus: A drive toward evolution rather than maintenance.",
            "Strategic Empathy: The ability to read underlying currents in human systems."
        ];
    }

    private extractFriction(bp: Blueprint): string[] {
        // Derived from Squares/Oppositions
        return [
            "Over-Control: Friction appears when control is exerted over unpredictable variables.",
            "Emotional Containment: A pattern of analyzing feeling rather than expressing it.",
            "Perfectionistic Standards: Precision creates strain when results fall short of the ideal.",
            "Delayed Trust: A protective mechanism that tests environments before opening.",
            "Intensity Without Outlet: Internal pressure that accumulates without creative release."
        ];
    }

    private extractThemes(bp: Blueprint): string[] {
        // Derived from North Node / Saturn
        return [
            "Trust Over Control: Safety is found in adaptability.",
            "Presence Over Perfection: Value resides in the moment, not the plan.",
            "Connection Over Containment: Vulnerability acts as a bridge, not a breach."
        ];
    }

    // --- Module 2: Core Insights Hub ---

    public generateInsights(bp: Blueprint): ModuleInsights {
        // These would ideally be derived from House rulers.
        // For V4, we use high-fidelity templates based on the Dominant Element.

        return {
            spiritual: "Your stability is often restored through practice of structured stillness. Silence acts as your teacher.",
            physical: "You benefit from rhythm over intensity. Consistency is your metric for health.",
            personal: "Your reflection converts experience into principle. Quiet integration is essential for you.",
            relational: "Clarity is created when care is expressed explicitly, removing the need for assumption.",
            career: "Value is maximized by refining systems rather than chasing output.",
            business: "Innovation thrives when structure allows 30% organic chaos. Rigidity is a risk.",
            finances: "Flow is restored when unmonitored channels for play are introduced."
        };
    }

    // --- Module 3: Relational Connectors ---

    public generateRelationalProfile(bp: Blueprint): ModuleRelational {
        const venus = this.getPlanet('Venus', bp);
        const moon = this.getPlanet('Moon', bp);

        return {
            coreStyle: "In connection, you are intentional, loyal, and principle-based. Your bonds are rarely casual.",
            strengths: ["Reliability", "High Discernment", "Protective Loyalty"],
            challenges: ["Reserved Access", "High Standards", "Conflict Avoidance"],
            compatibility: {
                synergistic: ["Those who value order", "Emotionally open but grounded types"],
                challenging: ["Erratic or chaotic personalities", "Performative emotionality"]
            },
            communicationField: "Your communication is clear, calm, and structured. You refine your thought before you speak."
        };
    }

    // --- Helpers ---

    private getPlanet(name: string, bp: Blueprint): PlanetPosition | undefined {
        return bp.planets.find(p => p.name === name);
    }

    private getElement(sign: string): string {
        const map: Record<string, string> = {
            'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
            'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
            'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
            'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
        };
        return map[sign] || 'Earth';
    }

    private getMode(sign: string): string {
        const map: Record<string, string> = {
            'Aries': 'Cardinal', 'Cancer': 'Cardinal', 'Libra': 'Cardinal', 'Capricorn': 'Cardinal',
            'Taurus': 'Fixed', 'Leo': 'Fixed', 'Scorpio': 'Fixed', 'Aquarius': 'Fixed',
            'Gemini': 'Mutable', 'Virgo': 'Mutable', 'Sagittarius': 'Mutable', 'Pisces': 'Mutable'
        };
        return map[sign] || 'Fixed';
    }

    private getArchetype(sign: string): string {
        const el = this.getElement(sign);
        const mode = this.getMode(sign);
        return this.archetypes[`${el}-${mode}`] || 'The Catalyst';
    }

    private getKeyword(sign: string): string {
        const keywords: Record<string, string> = {
            'Aries': 'Will', 'Taurus': 'Substance', 'Gemini': 'Exchange', 'Cancer': 'Resonance',
            'Leo': 'Self-Expression', 'Virgo': 'Optimization', 'Libra': 'Equilibrium', 'Scorpio': 'Intensity',
            'Sagittarius': 'Meaning', 'Capricorn': 'Architecture', 'Aquarius': 'Systemic Perspective', 'Pisces': 'Unity'
        };
        // Sanitize the sign name if it leaks
        const key = keywords[sign] || 'Integrity';
        return key;
    }

    private generateFallbackThesis(): ModuleThesis {
        return {
            title: "System Integration",
            overview: "Profile generating...",
            cognitiveBlueprint: "Analyzing...",
            coreStrengths: [],
            frictionZones: [],
            evolutionaryThemes: []
        };
    }
}

export const holisticSynthesizer = new HolisticSynthesizer();
