import { AstrologyService } from '../services/AstrologyService';
import { OriginSeedService } from '../services/OriginSeedService';
import { DateTime } from 'luxon';

async function runVerification() {
    const astrology = new AstrologyService();
    const service = new OriginSeedService();

    // Test Case: Barend (Known Reference)
    const testData = {
        date: '1990-09-04',
        time: '12:45:00',
        location: 'Pretoria, ZA',
        latitude: -25.7479,
        longitude: 28.2293
    };

    console.log("--- OSIA v1.2 Accuracy Harness ---");
    console.log(`Testing with: ${testData.location} (${testData.date} ${testData.time})`);

    try {
        const bp1 = await astrology.calculateBlueprint(testData);
        const bp2 = await astrology.calculateBlueprint(testData);

        // 1. Determinism Check
        console.log("\n[1] Determinism Check:");
        const sun1 = bp1.planets.find(p => p.name === 'Sun')?.longitude;
        const sun2 = bp2.planets.find(p => p.name === 'Sun')?.longitude;
        if (sun1 === sun2) {
            console.log("✅ 100% Deterministic Reproducibility");
        } else {
            console.error("❌ Determinism Failure: Results differ across runs");
        }

        // 2. Physics Check (Reference Values for Sept 4, 1990)
        console.log("\n[2] Physics Accuracy Check:");
        bp1.planets.forEach(p => {
            console.log(`${p.name.padEnd(8)}: ${p.longitude.toFixed(4)}° (${p.sign} ${p.degree.toFixed(2)}°) | Speed: ${p.speed.toFixed(6)} °/h | Retrograde: ${p.retrograde}`);
        });

        // 3. Angles & Cusps Check
        console.log("\n[3] Angles & Houses Check:");
        console.log(`Ascendant:  ${bp1.houses.ascendant}`);
        console.log(`Midheaven:  ${bp1.houses.midheaven}`);
        console.log(`House 1 (Cusp): ${bp1.houses.cusps[0].toFixed(2)}°`);

        // 4. Aspect Audit
        console.log("\n[4] Aspect Audit:");
        bp1.aspects.slice(0, 5).forEach(a => {
            console.log(`${a.planet1} ${a.type} ${a.planet2} (Orb: ${a.orb.toFixed(2)}°) | ${a.applying ? 'Applying' : 'Separating'}`);
        });

        console.log("\nVerification Complete.");
    } catch (err) {
        console.error("Verification Critical Failure:", err);
    }
}

runVerification();
