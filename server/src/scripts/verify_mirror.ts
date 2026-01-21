import { narrativeSynthesizer } from '../services/NarrativeSynthesizer';
import { holisticSynthesizer } from '../services/HolisticSynthesizer';
import { Blueprint } from '../services/AstrologyService';

const mockBlueprint: Blueprint = {
    planets: [
        { name: 'Sun', sign: 'Capricorn', house: 10, degree: 15, retrograde: false },
        { name: 'Moon', sign: 'Scorpio', house: 8, degree: 5, retrograde: false },
        { name: 'Mercury', sign: 'Capricorn', house: 10, degree: 18, retrograde: false },
        { name: 'Venus', sign: 'Aquarius', house: 11, degree: 22, retrograde: false },
        { name: 'Mars', sign: 'Aries', house: 1, degree: 10, retrograde: false },
        { name: 'Jupiter', sign: 'Taurus', house: 2, degree: 12, retrograde: true },
        { name: 'Saturn', sign: 'Capricorn', house: 10, degree: 28, retrograde: false },
        { name: 'Uranus', sign: 'Capricorn', house: 10, degree: 2, retrograde: false },
        { name: 'Neptune', sign: 'Pisces', house: 12, degree: 15, retrograde: false },
        { name: 'Pluto', sign: 'Scorpio', house: 8, degree: 12, retrograde: false }
    ],
    aspects: [
        { planet1: 'Sun', planet2: 'Moon', type: 'Sextile', orb: 2 },
        { planet1: 'Sun', planet2: 'Saturn', type: 'Conjunction', orb: 4 },
        { planet1: 'Mars', planet2: 'Pluto', type: 'Square', orb: 2 },
        { planet1: 'Mercury', planet2: 'Uranus', type: 'Conjunction', orb: 3 }
    ],
    houses: {
        ascendant: 'Aries',
        midheaven: 'Capricorn',
        distribution: {} as any
    },
    elements: { fire: 0.3, earth: 0.4, air: 0.1, water: 0.2 }
};

async function verify() {
    console.log("--- MIRROR-LEVEL ENGINE VERIFICATION ---");

    // 1. Holistic Modules
    console.log("\n[MODULE 1: THESIS]");
    const thesis = holisticSynthesizer.generateThesis(mockBlueprint);
    console.log(`Title: ${thesis.title}`);
    console.log(`Overview: ${thesis.overview}`);
    // console.log(`Cognitive: ${thesis.cognitiveBlueprint}`); // Optional

    console.log("\n[MODULE 2: INSIGHTS HUB]");
    const insights = holisticSynthesizer.generateInsights(mockBlueprint);
    console.log(JSON.stringify(insights, null, 2));

    console.log("\n[MODULE 3: RELATIONAL]");
    const relational = holisticSynthesizer.generateRelationalProfile(mockBlueprint);
    console.log(JSON.stringify(relational, null, 2));

    // 2. Deep Layers (Sample)
    console.log("\n[DEEP LAYER SAMPLE: Layer 1 (Core Identity)]");
    const l1 = narrativeSynthesizer.synthesizeNarrative(1, mockBlueprint);
    console.log(l1.narrative);

    console.log("\n[DEEP LAYER SAMPLE: Layer 2 (Energy/Mars)]");
    const l2 = narrativeSynthesizer.synthesizeNarrative(2, mockBlueprint);
    console.log(l2.narrative);

    // 3. Filler Check
    const fillerWords = ["This layer operates", "The fundamental impulse", "is expressed via"];
    const fullText = l1.narrative + l2.narrative + thesis.overview;
    let fail = false;
    fillerWords.forEach(w => {
        if (fullText.includes(w)) {
            console.log(`❌ FAILURE: Found filler phrase "${w}"`);
            fail = true;
        }
    });

    // 4. Jargon Check
    const jargonWords = ["Earth", "Fire", "Air", "Water"];
    jargonWords.forEach(w => {
        if (fullText.includes(w + " intensity") || fullText.includes(w + " depth") || fullText.includes(w + " logic")) {
            console.log(`❌ FAILURE: Found elemental jargon phrase "${w}"`);
            fail = true;
        }
    });

    if (!fail) console.log("\n✅ SUCCESS: No filler or jargon found. Tone is direct and substantive.");
}

verify();
