import { narrativeSynthesizer } from '../services/NarrativeSynthesizer';
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
        { planet1: 'Sun', planet2: 'Saturn', type: 'Conjunction', orb: 4 }, // Tension/Structure
        { planet1: 'Mars', planet2: 'Pluto', type: 'Square', orb: 2 }, // Tension
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
    console.log("--- IDENTITY GRAVITY (V6) VERIFICATION ---");

    // Sample Layer 1 (Sun/Capricorn/Earth -> Stance)
    console.log("\n[LAYER 1: CORE IDENTITY]");
    const l1 = narrativeSynthesizer.synthesizeNarrative(1, mockBlueprint); // Sun
    console.log(l1.narrative);

    // Sample Layer 2 (Mars/Aries/Fire -> Stance)
    console.log("\n[LAYER 2: ENERGY ORIENTATION]");
    const l2 = narrativeSynthesizer.synthesizeNarrative(2, mockBlueprint); // Mars
    console.log(l2.narrative);

    // Checks
    const mechanisticPhrases = [
        "The impulse here operates",
        "You operate with",
        "The trajectory is forward-moving",
        "Internal resistance is visible"
    ];

    const livedPhrases = [
        "sense",
        "stance",
        "presence",
        "orientation",
        "It acts not as a flaw"
    ];

    const fullText = l1.narrative + l2.narrative;
    let fail = false;

    console.log("\n[MECHANISM CHECK]");
    mechanisticPhrases.forEach(w => {
        if (fullText.includes(w)) {
            console.log(`❌ FAILURE: Found v5 mechanistic phrase "${w}"`);
            fail = true;
        }
    });

    if (!fail) console.log("✅ CLEAN: No mechanistic primitives found.");

    console.log("\n[GRAVITY CHECK]");
    // We just check if it feels right by looking at the text
    console.log("Review verify output above. Does it answer 'What does it feel like?'");
}

verify();
