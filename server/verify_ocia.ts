
import { originSeedService } from './src/services/OriginSeedService';
import { astrologyService } from './src/services/AstrologyService';

async function runVerification() {
    console.log("=== OSIA v1.2 VERIFICATION HARNESS ===");

    const testBirth = {
        date: "1990-05-15",
        time: "10:30",
        location: "London, UK",
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: "Europe/London"
    };

    // 1. DETERMINISM TEST
    console.log("\n[1/3] Testing Determinism...");
    const blueprint1 = await astrologyService.calculateBlueprint(testBirth);
    const traits1 = (originSeedService as any).translateBlueprintToTraits(blueprint1, "test_user");

    const blueprint2 = await astrologyService.calculateBlueprint(testBirth);
    const traits2 = (originSeedService as any).translateBlueprintToTraits(blueprint2, "test_user");

    const match = JSON.stringify(traits1) === JSON.stringify(traits2);
    console.log(`> Determinism Result: ${match ? "PASSED (100% Match)" : "FAILED (Mismatch detected)"}`);

    // 2. LEAKAGE TEST (1k User Sweep)
    console.log("\n[2/3] Performing 1,000-User Leakage Sweep...");
    let forbiddenCount = 0;
    const forbidden = [
        'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
        'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
        'astrology', 'astrological', 'zodiac', 'horoscope'
    ];

    for (let i = 0; i < 1000; i++) {
        const fakeUserId = `user_${i}`;
        const traits = (originSeedService as any).translateBlueprintToTraits(blueprint1, fakeUserId);
        traits.forEach((t: any) => {
            const lowText = (t.description || "").toLowerCase();
            forbidden.forEach(f => {
                if (new RegExp(`\\b${f}\\b`).test(lowText)) {
                    forbiddenCount++;
                    if (forbiddenCount < 10) console.warn(`  ! Leakage found in Layer ${t.layerId}: "${f}"`);
                }
            });
        });
    }
    console.log(`> Leakage Sweep Result: ${forbiddenCount === 0 ? "PASSED (Zero Leakage)" : `FAILED (${forbiddenCount} hits found)`}`);

    // 3. DEDUPLICATION AUDIT
    console.log("\n[3/4] Testing Intra-Profile Deduplication...");
    const traits = (originSeedService as any).translateBlueprintToTraits(blueprint1, "dedup_test_user");
    const seenParagraphs = new Set<string>();
    let duplicates = 0;

    traits.forEach((t: any) => {
        const paragraphs = t.description.split('\n\n');
        paragraphs.forEach((p: string) => {
            if (seenParagraphs.has(p)) {
                duplicates++;
                console.warn(`  ! Duplicate found in Layer ${t.layerId}: "${p.substring(0, 50)}..."`);
            }
            seenParagraphs.add(p);
        });
    });
    console.log(`> Deduplication Result: ${duplicates === 0 ? "PASSED (No Repetition)" : `FAILED (${duplicates} collisions found)`}`);

    // 4. SCORE DISTRIBUTION AUDIT
    console.log("\n[4/4] Checking Score Distribution...");
    const scores = traits.map((t: any) => t.score);
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    console.log(`> Min Score: ${Math.min(...scores)}`);
    console.log(`> Max Score: ${Math.max(...scores)}`);
    console.log(`> Avg Score: ${avgScore.toFixed(3)}`);

    console.log("\nVerification Complete.");
    process.exit(0);
}

runVerification().catch(err => {
    console.error(err);
    process.exit(1);
});
