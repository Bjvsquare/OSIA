import { narrativeSynthesizer } from '../services/NarrativeSynthesizer';
import { Blueprint } from '../services/AstrologyService';

const mockBlueprint: Blueprint = {
    planets: [
        { name: 'Sun', sign: 'Aries', house: 1, degree: 10, retrograde: false },
        { name: 'Moon', sign: 'Scorpio', house: 8, degree: 20, retrograde: false },
        { name: 'Mercury', sign: 'Pisces', house: 12, degree: 5, retrograde: true },
        { name: 'Venus', sign: 'Taurus', house: 2, degree: 15, retrograde: false },
        { name: 'Mars', sign: 'Leo', house: 5, degree: 1, retrograde: false },
        { name: 'Jupiter', sign: 'Sagittarius', house: 9, degree: 25, retrograde: false },
        { name: 'Saturn', sign: 'Capricorn', house: 10, degree: 12, retrograde: false },
        { name: 'Uranus', sign: 'Aquarius', house: 11, degree: 3, retrograde: false },
        { name: 'Neptune', sign: 'Pisces', house: 12, degree: 18, retrograde: false },
        { name: 'Pluto', sign: 'Scorpio', house: 8, degree: 9, retrograde: false }
    ],
    aspects: [
        { planet1: 'Sun', planet2: 'Mars', type: 'Square', orb: 2 }, // Tension
        { planet1: 'Moon', planet2: 'Venus', type: 'Trine', orb: 4 }, // Flow
        { planet1: 'Mercury', planet2: 'Saturn', type: 'Conjunction', orb: 1 }, // Intensity
        { planet1: 'Jupiter', planet2: 'Pluto', type: 'Sextile', orb: 3 } // Flow
    ],
    houses: {
        ascendant: 'Aries',
        midheaven: 'Capricorn',
        distribution: {}
    },
    elements: { fire: 0, earth: 0, air: 0, water: 0 }
};

console.log("--- NARRATIVE ENGINE V2 VERIFICATION ---");
console.log("Checking for Forbidden Terms (Sun, Moon, Aries, etc.)...\n");

const forbidden = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
    'House', 'Retrograde'
];

let failureCount = 0;

for (let i = 1; i <= 15; i++) {
    const { narrative, profile } = narrativeSynthesizer.synthesizeNarrative(i, mockBlueprint);

    console.log(`Layer ${i} [${profile.archetype}]:`);
    console.log(`  "${narrative}"`);

    // Check for specific forbidden terms
    const foundForbidden = forbidden.filter(term => narrative.includes(term));
    if (foundForbidden.length > 0) {
        console.error(`  ❌ FAILED: Found forbidden terms: ${foundForbidden.join(', ')}`);
        failureCount++;
    } else {
        console.log(`  ✅ Clean`);
    }
    console.log("");
}

if (failureCount === 0) {
    console.log("🌟 SUCCESS: All narratives are psychologically grounded and free of astrological jargon.");
} else {
    console.error(`💀 FAILURE: ${failureCount} layers contained astrological terms.`);
    process.exit(1);
}
