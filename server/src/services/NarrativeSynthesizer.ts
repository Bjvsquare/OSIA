import { Blueprint, PlanetPosition } from './AstrologyService';
import { db } from '../db/JsonDb';

interface PsychologicalProfile {
    archetype: string;
    drive: string;
    method: string;
    focus: string;
}

export class NarrativeSynthesizer {

    // --- Vocabulary Pools (Zero Astrological Terms) ---
    // --- Extended Vocabulary Pools (Deep Narrative) ---

    // Element Mappings (The "Why" / Energy Source)
    private elementDescriptors: Record<string, string[]> = {
        'fire': ['proactive', 'direct', 'active', 'expressive', 'initiative-taking', 'bold'],
        'earth': ['grounded', 'practical', 'steady', 'tangible', 'constructive', 'consistent'],
        'air': ['thoughtful', 'objective', 'communicative', 'logical', 'analytical', 'clear'],
        'water': ['intuitive', 'perceptive', 'fluid', 'empathic', 'observant', 'responsive']
    };

    // Modality Mappings (The "How" / Mode of Action)
    private modalityDescriptors: Record<string, string[]> = {
        'cardinal': ['initiating', 'starting', 'leading', 'driving', 'pioneering'],
        'fixed': ['sustaining', 'reliable', 'steadying', 'focused', 'resolute'],
        'mutable': ['adaptable', 'versatile', 'flexible', 'connecting', 'balancing']
    };

    // House/Domain Mappings (The "Where" / Focus of Attention)
    private domainDescriptors: Record<number, string[]> = {
        1: ['personal identity', 'self-assertion', 'autonomy', 'individual presence'],
        2: ['resource security', 'personal values', 'sensory experience', 'material stability'],
        3: ['information processing', 'immediate environment', 'practical logic', 'mental connections'],
        4: ['foundational security', 'inner integration', 'private life', 'emotional rooting'],
        5: ['creative expression', 'sovereign joy', 'vital demonstration', 'personal output'],
        6: ['systematic refinement', 'functional efficiency', 'skill mastery', 'daily order'],
        7: ['relational balance', 'partnership dynamics', 'collaborative exchange', 'mirroring'],
        8: ['transformative depth', 'shared resources', 'psychological excavation', 'intensity'],
        9: ['expansive meaning', 'philosophical scope', 'broad horizons', 'wisdom seeking'],
        10: ['public vocation', 'structural authority', 'long-term legacy', 'achievement'],
        11: ['collective vision', 'networked innovation', 'future ideals', 'group contribution'],
        12: ['transpersonal unity', 'subconscious currents', 'holistic merging', 'spiritual withdrawal']
    };

    private dynamicDescriptors: Record<string, string[]> = {
        'friction': ['encounters resistance through', 'notices tension in', 'works through a contrast between', 'navigates a challenge in'],
        'flow': ['finds a natural rhythm with', 'finds it easy to support', 'effortlessly works with', 'naturally integrates'],
        'intensification': ['strengthens the focus on', 'brings more attention to', 'concentrates effort on', 'is naturally drawn toward']
    };

    private evolutionaryDescriptors: Record<string, string[]> = {
        'retrograde': ['requires internal calibration', 'demands reflective mastery', 'involves revisiting past patterns', 'calls for a non-linear approach'],
        'direct': ['propels forward motion', 'encourages outward expression', 'facilitates direct engagement', 'accelerates developmental momentum'],
        'structural': ['focuses on long-term transformation', 'emphasizes profound mastery', 'highlights a trajectory of', 'points toward an essential evolution of']
    };

    private static readonly FORBIDDEN_TOKENS = [
        'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
        'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
        'astrology', 'astrological', 'zodiac', 'horoscope', 'planet', 'planetary', 'karmic', 'soul', 'fate', 'destiny', 'spiritual',
        'energy', 'vitality', 'resonance', 'catalytic', 'radiate', 'vibration'
    ];

    // --- Signal Interpretation Logic ---

    private mulberry32(seed: number) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    private getElement(sign: string): string {
        const map: Record<string, string> = {
            'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
            'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
            'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
            'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water'
        };
        return map[sign] || 'earth';
    }

    private getModality(sign: string): string {
        const map: Record<string, string> = {
            'Aries': 'cardinal', 'Cancer': 'cardinal', 'Libra': 'cardinal', 'Capricorn': 'cardinal',
            'Taurus': 'fixed', 'Leo': 'fixed', 'Scorpio': 'fixed', 'Aquarius': 'fixed',
            'Gemini': 'mutable', 'Virgo': 'mutable', 'Sagittarius': 'mutable', 'Pisces': 'mutable'
        };
        return map[sign] || 'fixed';
    }

    private getRandom(pool: string[], rng: () => number, buffer?: Set<string>, prefix: string = ''): string {
        // Deterministic Shuffle
        const candidates = [...pool].sort(() => 0.5 - rng());

        for (const c of candidates) {
            const finalString = prefix ? `${prefix} ${c.charAt(0).toLowerCase() + c.slice(1)}` : c;
            const hash = this.hashString(finalString).toString();

            if (buffer && !buffer.has(hash)) {
                buffer.add(hash);
                return finalString;
            }
        }

        // Soft Fallback: If all collide, use the FIRST one but apply a variation if possible
        const fallback = candidates[0];
        const result = prefix ? `${prefix} ${fallback.charAt(0).toLowerCase() + fallback.slice(1)}` : fallback;
        if (buffer) buffer.add(this.hashString(result).toString()); // Re-add just in case
        return result;
    }

    // --- Synthesis Core (v6 Identity Gravity) ---

    public synthesizeNarrative(layerId: number, blueprint: Blueprint, userId: string = 'unknown', usedHashes?: Set<string>, iteration: number = 0): { narrative: string, profile: PsychologicalProfile } {
        const primaryPlanet = this.getPlanetForLayer(layerId, blueprint);

        // Ensure buffer exists
        if (!usedHashes) usedHashes = new Set<string>();

        if (!primaryPlanet) {
            return {
                narrative: "Integration pending.",
                profile: { archetype: "Emergent", drive: "Integration", method: "Observation", focus: "Internal" }
            };
        }

        // Initialize Deterministic RNG for this layer
        // Seed = Hash(userId + layerId + engineVersion + iteration)
        const engineVersion = 'v1.2';
        const seedStr = iteration > 0
            ? `${userId}-${layerId}-${engineVersion}-refine-${iteration}`
            : `${userId}-${layerId}-${engineVersion}`;
        const seed = this.hashString(seedStr);
        const rng = this.mulberry32(seed);

        const element = this.getElement(primaryPlanet.sign);
        const modality = this.getModality(primaryPlanet.sign);
        const house = primaryPlanet.house;
        const aspects = this.getAspectsForPlanet(primaryPlanet.name, blueprint);

        // 1. The Stance (Opening) - Driven by Element/Modality
        const context = this.getLayerContext(layerId);
        const stance = this.generateStance(layerId, element, modality, house, rng, usedHashes, context);

        // 2. The Anchor (Middle) - Driven by Aspects/Tension
        const anchor = this.generateAnchor(layerId, element, aspects, rng, usedHashes);

        // 3. The Presence (Closing) - Driven by overall Tone/Impact
        const presence = this.generatePresence(layerId, element, modality, rng, usedHashes);

        let fullNarrative = `${stance}\n\n${anchor}\n\n${presence}`;

        // 4. Sanitize (Purge Leakage)
        fullNarrative = this.sanitize(fullNarrative);

        return {
            narrative: fullNarrative,
            profile: {
                archetype: `${this.capitalize(element)} ${this.capitalize(modality)}`, // Internal metadata only
                drive: "Coherence",
                method: "Lived Experience",
                focus: "Presence"
            }
        };
    }

    /**
     * AI-Powered Narrative Synthesis via Claude
     * Generates unique, contextual hypotheses that feel personal rather than templated.
     * Falls back to rule-based generation if Claude fails.
     */
    public async synthesizeWithAI(
        layerId: number,
        blueprint: Blueprint,
        userId: string = 'unknown',
        iteration: number = 0
    ): Promise<{ narrative: string, profile: PsychologicalProfile }> {
        // Check cache first
        const cacheKey = `${userId}-L${layerId}-i${iteration}`;
        try {
            const cache = await db.getCollection<any>('ai_narrative_cache') || [];
            const cached = cache.find((c: any) => c.key === cacheKey);
            if (cached) {
                console.log(`[NarrativeSynthesizer] Cache HIT: ${cacheKey}`);
                return cached.result;
            }
        } catch (e) {
            // Cache miss, continue
        }

        // Check if Anthropic API key is available
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.log('[NarrativeSynthesizer] No ANTHROPIC_API_KEY, falling back to rule-based');
            return this.synthesizeNarrative(layerId, blueprint, userId, new Set(), iteration);
        }

        try {
            const Anthropic = (await import('@anthropic-ai/sdk')).default;
            const client = new Anthropic({ apiKey });

            const primaryPlanet = this.getPlanetForLayer(layerId, blueprint);
            if (!primaryPlanet) {
                return this.synthesizeNarrative(layerId, blueprint, userId, new Set(), iteration);
            }

            const element = this.getElement(primaryPlanet.sign);
            const modality = this.getModality(primaryPlanet.sign);
            const layerContext = this.getLayerContext(layerId);
            const aspects = this.getAspectsForPlanet(primaryPlanet.name, blueprint);
            const tensionCount = aspects.filter(a => ['Square', 'Opposition'].includes(a.type)).length;
            const flowCount = aspects.filter(a => ['Trine', 'Sextile'].includes(a.type)).length;

            const prompt = `You are a psychological profile writer for a personality intelligence platform called OSIA. You generate deeply personal, insightful personality hypotheses based on behavioral pattern data.

IMPORTANT RULES:
- NEVER use astrological terms (planets, signs, houses, zodiac, horoscope, etc.)
- NEVER use spiritual/mystical language (soul, karma, destiny, vibration, energy, etc.)
- Write in second person ("you"), conversational but thoughtful tone
- Be specific and psychologically grounded
- Each paragraph should feel unique and personally relevant
- Total length: 3 short paragraphs (opening stance, anchor insight, closing presence)

CONTEXT:
- Layer ${layerId} of 15: This layer relates to ${layerContext}
- Core element: ${element} (${this.elementDescriptors[element]?.join(', ')})
- Mode: ${modality} (${this.modalityDescriptors[modality]?.join(', ')})
- Domain focus: ${this.domainDescriptors[primaryPlanet.house]?.join(', ') || 'general processing'}
- Tension signals: ${tensionCount} (indicating internal friction/growth edges)
- Flow signals: ${flowCount} (indicating natural ease/strengths)
- Iteration: ${iteration} (${iteration === 0 ? 'initial assessment' : 'refined perspective — offer a deeper, more nuanced take'})

Generate a 3-paragraph personality hypothesis for this layer. The first paragraph should describe how this person naturally operates in this domain. The second should describe the tensions or ease they experience. The third should describe how others experience them in this domain.`;

            const response = await client.messages.create({
                model: 'claude-3-5-haiku-latest',
                max_tokens: 400,
                messages: [{ role: 'user', content: prompt }]
            });

            const narrativeText = response.content
                .filter((block: any) => block.type === 'text')
                .map((block: any) => block.text)
                .join('\n\n');

            // Sanitize the AI output
            const sanitized = this.sanitize(narrativeText);

            const result = {
                narrative: sanitized,
                profile: {
                    archetype: `${this.capitalize(element)} ${this.capitalize(modality)}`,
                    drive: "Coherence",
                    method: "Lived Experience",
                    focus: "Presence"
                }
            };

            // Cache the result
            try {
                const cache = await db.getCollection<any>('ai_narrative_cache') || [];
                cache.push({ key: cacheKey, result, createdAt: new Date().toISOString() });
                await db.saveCollection('ai_narrative_cache', cache);
                console.log(`[NarrativeSynthesizer] Cached AI narrative: ${cacheKey}`);
            } catch (e) {
                // Non-critical, continue
            }

            return result;
        } catch (err: any) {
            console.error(`[NarrativeSynthesizer] AI synthesis failed, falling back to rule-based:`, err.message);
            return this.synthesizeNarrative(layerId, blueprint, userId, new Set(), iteration);
        }
    }

    private generateStance(layerId: number, element: string, modality: string, house: number, rng: () => number, buffer: Set<string>, context: string): string {
        const key = `${element}-${modality}`;
        const descriptions: Record<string, string[]> = {
            'earth-cardinal': [
                "You tend to move forward with a focus on what is possible and practical. Your actions aren't impulsive but are guided by a clear sense of what works in the real world. You learn best by doing and seeing immediate results from your efforts.",
                "You have a natural ability to start projects by laying a solid foundation. You don't just start things for the sake of it; you build things that are meant to last. There's a deliberate quality to your choices that others find reliable."
            ],
            'earth-fixed': [
                "You find strength in consistency and focus. When you face resistance, you don't push back with force; you simply keep going with steady persistence. You rely on what has been proven to work and you take the time to master whatever you're working on.",
                "Steady progress is your natural pace. You don't feel the need to rush. You build your life through small, consistent steps, preferring a reliable path over sudden, unpredictable changes."
            ],
            'earth-mutable': [
                "You have a keen eye for detail and efficiency. You're often looking for ways to improve things and make them work better for everyone. Your approach is helpful and grounded, focused on fixing what's broken and refining what's already there.",
                "You're quietly adaptable. You don't try to force order onto a situation; instead, you find the most practical way to navigate it. You provide a stabilizing influence by being the one who makes things actually function."
            ],
            'water-cardinal': [
                "You're guided by a strong sense of what feels right, and you act on those instincts with confidence. Your intuition isn't passive; it's how you decide which way to move next. You're often focused on creating a sense of safety and belonging.",
                "You start things by making a personal connection. You want to create environments where people feel supported and looked after. Your strength is quiet but steady, moving things forward in a way that respects everyone's needs."
            ],
            'water-fixed': [
                "You're drawn to understanding the deeper aspects of a situation. You're not one for superficial interactions; you want to know what's really going on beneath the surface. You're incredibly loyal and you hold onto the things that matter to you with great intensity.",
                "You have a way of noticing what isn't being said. You observe the mood and the underlying feelings before you make a move. You build trust slowly, but once it's there, it's very deep and lasting."
            ],
            'water-mutable': [
                "You're very sensitive to the atmosphere around you. You tend to pick up on the feelings of others and find ways to harmonize with them. You're at your best when you can bridge different viewpoints and create a sense of shared understanding.",
                "You have a flexible way of dealing with people and problems. You don't like direct confrontation and would rather find a path that works for everyone. Your adaptability comes from a genuine desire for things to flow smoothly."
            ],
            'fire-cardinal': [
                "You have a direct and proactive way of engaging with life. When you see something that needs to be done, you don't wait for permission—you just start. You have a lot of personal initiative and you enjoy the challenge of starting something new.",
                "You're a natural at getting things moving. You thrive on the excitement of a new idea and you have the confidence to put yourself out there. Your enthusiasm is contagious and it often encourages those around you to take action too."
            ],
            'fire-fixed': [
                "You have a very consistent and reliable sense of self. You stay true to what you believe, no matter what's happening around you. This makes you a very stabilizing presence—others know exactly where you stand and find confidence in your steady commitment.",
                "You hold your ground with a quiet confidence. You don't need to shout to be heard; your consistency speaks for itself. You're the one people look to when they need someone who won't be easily swayed."
            ],
            'fire-mutable': [
                "You're naturally curious and always looking for the broader meaning in your experiences.",
                "You interact with the world by trying to understand how everything fits into a bigger picture.",
                "You're not satisfied with just the facts; you want to know the 'why' behind them.",
                "You have a generally optimistic and enthusiastic outlook on life.",
                "You learn by exploring new ideas and testing your beliefs against what you find in the world.",
                "You're constantly growing and changing as you gain new insights."
            ],
            'air-cardinal': [
                "Your approach is defined by how you connect with people and ideas. You're often the one bringing others together and trying to find a balanced way forward. You have a diplomatic way of handling different perspectives.",
                "For you, thinking and acting go hand-in-hand. You use your ideas to make connections and to build the ways that people can work together more effectively."
            ],
            'air-fixed': [
                "You tend to focus on the long-term principles behind things rather than just the immediate details. You're interested in how systems work and how they can be improved for the future. You have a very clear and objective way of looking at situations.",
                "You have a bit of a 'big picture' perspective. This allows you to stay calm and see things clearly, even when things get complicated. You value logic and consistency in your thoughts and actions."
            ],
            'air-mutable': [
                "Your mind is quick and you're good at seeing the links between different pieces of information.",
                "You enjoy conversation and the exchange of ideas with others.",
                "You're naturally curious about almost everything.",
                "You're often the one asking questions to keep things from getting stuck in one way of thinking.",
                "You're very adaptable in how you process information.",
                "You make connections between ideas with a lot of mental flexibility."
            ]
        };

        const layerKey = `L${layerId.toString().padStart(2, '0')}-${element}-${modality}`;
        const layerPool = (this as any).layerSpecificStances?.[layerKey];

        if (layerPool && layerPool.length > 0) {
            return this.getRandom(layerPool, rng, buffer);
        }

        const pool = descriptions[key] || descriptions['earth-cardinal'];

        // Reflective Mirror Starters (20+ varieties to ensure uniqueness across 15 layers)
        const starters = [
            `In the way you navigate ${context},`,
            `Observing how you handle ${context},`,
            `There is a distinct pattern in your ${context}:`,
            `As you look into the mirror of your ${context},`,
            `The architecture of your ${context} reveals that`,
            `When you engage with ${context},`,
            `In your approach to ${context},`,
            `Looking at the rhythm of your ${context},`,
            `Exploring the structure of your ${context},`,
            `Within the domain of your ${context},`,
            `Regarding the flow of your ${context},`,
            `Notice how you respond to ${context}:`,
            `Your relationship with ${context} indicates that`,
            `In the landscape of your ${context},`,
            `Tracing the lines of your ${context},`,
            `As you interface with ${context},`,
            `The way you orient toward ${context} suggests`,
            `In your unique expression of ${context},`,
            `Looking deeply at your ${context},`,
            `Reflecting on how you encounter ${context},`
        ];

        // Find a first available starter that hasn't been used in this profile
        // We use the same buffer to track phrasing templates
        let prefix = '';
        const shuffledStarters = [...starters].sort(() => 0.5 - rng());

        for (const s of shuffledStarters) {
            // Hash the template structure (first 15 chars) to track the "type" of starter
            const starterType = s.split(' ')[0] + s.split(' ')[1] + s.split(' ')[2];
            const starterHash = `STARTER-${this.hashString(starterType)}`;

            if (!buffer.has(starterHash)) {
                buffer.add(starterHash);
                prefix = s;
                break;
            }
        }

        // Fallback if somehow exhausted
        if (!prefix) prefix = shuffledStarters[0];

        return this.getRandom(pool, rng, buffer, prefix);
    }

    // Layer-specific overrides to prevent repetition
    private layerSpecificStances: Record<string, string[]> = {
        'L01-earth-cardinal': [
            "You tend to focus on building things that have real-world value and integrity. You see life as a series of practical challenges that can be solved with steady, focused effort. Your approach is disciplined and the results you produce often provide a solid foundation for others."
        ],
        'L02-earth-cardinal': [
            "You apply your effort where it will have the most practical impact. You don't spend time on things that don't have a clear outcome; instead, you invest your attention in achieving specific goals. You're at your best when you're mastering the details of a project through direct, high-impact action."
        ],
        'L07-water-fixed': [
            "You have a very deep and steady way of processing your feelings. You find your balance by staying true to your own internal values and understanding. There is a weight and a reliability to your inner world that provides a sense of safety for you and for those around you."
        ]
        // More will be added as the engine scales...
    };

    private sanitize(text: string): string {
        let cleaned = text;
        NarrativeSynthesizer.FORBIDDEN_TOKENS.forEach(token => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            cleaned = cleaned.replace(regex, '[redacted]');
        });
        return cleaned;
    }

    private generateAnchor(layerId: number, element: string, aspects: any[], rng: () => number, buffer: Set<string>): string {
        const tensionCount = aspects.filter(a => ['Square', 'Opposition'].includes(a.type)).length;

        // Expanded Anchor Pools
        const tensionTemplates = [
            "This leads to an underlying sense of resilience.",
            "Steady progress helps you find your balance.",
            "Taking action builds your confidence.",
            "Over time, this effort becomes a reliable part of who you are.",
            "You use internal pressure as a motivator to get things done.",
            "You find your footing more easily by dealing with difficulties directly.",
            "You often find your rhythm when you're working through a challenge.",
            "There is a steady balance at work in how you handle contrast.",
            "Your ability to see both sides of a situation grounds you.",
            "You find strength in how you successfully navigate different demands.",
            "Challenges act as a way to sharpen your focus and your thinking.",
            "Resilience is built into how you handle these situations.",
            "You use resistance as a way to find your own steady pace.",
            "You achieve balance by mastering the more complex parts of your life.",
            "Handling intensity becomes a catalyst for how you grow and change.",
            "Your foundation is strengthened by the responsibilities you manage.",
            "A rugged kind of stability comes from how you work through these forces.",
            "Staying persistent in the face of tension builds your own unique authority."
        ];

        const flowTemplates = [
            "This leads to an underlying sense of safety.",
            "The natural ease you have in this area helps you stay calm.",
            "This part of your life remains steady and reliable.",
            "Finding it easy to handle things here is a core part of your approach.",
            "You tend to navigate around obstacles with a natural sort of grace.",
            "You find your balance through being adaptable.",
            "There is a quiet confidence in how you handle this.",
            "It gives you a reliable baseline of what you're capable of.",
            "This area works with a smooth and simple efficiency.",
            "You stay steady through being consistent in your actions.",
            "Your approach allows for a seamless way to deal with new experiences.",
            "Complexity is often resolved through keeping things simple.",
            "Your default state here is one of straightforward clarity.",
            "You navigate through finding the things that naturally align.",
            "You save your effort through the precision of how you work.",
            "There is a noticeable sense of harmony in how you handle this domain."
        ];

        return this.getRandom(tensionCount > 1 ? tensionTemplates : flowTemplates, rng, buffer);
    }

    private generatePresence(layerId: number, element: string, modality: string, rng: () => number, buffer: Set<string>): string {
        const fire = [
            "The presence you project is warm and proactive.",
            "It encourages others to find their own direct way of acting.",
            "You don't push people; you lead by your own example.",
            "You create an environment where taking action feels possible.",
            "The atmosphere around you feels full of potential.",
            "There is a brightening effect when you are truly engaged.",
            "You project a sense of bold and direct intentionality.",
            "Your impact is felt as a surge of new and proactive ideas."
        ];

        const earth = [
            "The presence you project is quiet but firm.",
            "You tend to avoid wasted effort.",
            "You move forward with a clear and steady intention.",
            "You help shape what's happening around you while staying consistent.",
            "A sense of being grounded follows you.",
            "Others feel like they can rely on your steady presence.",
            "The atmosphere is defined by a tangible and reliable focus.",
            "Your impact is one of enduring and consistent effort."
        ];

        const air = [
            "The presence you project is clear and spacious.",
            "It offers a kind of mental clarity to those around you.",
            "You help untangle confusion by offering a new perspective.",
            "The environment feels lighter and more open with you there.",
            "You help create a sense of possibility and connection.",
            "There is a refreshing objectivity in how you approach things.",
            "You project a sense of agile and analytical insight.",
            "Your impact is felt as a bridge of practical understanding."
        ];

        const water = [
            "The presence you project is observant and deep.",
            "You often pick up on the emotional tone of a room.",
            "You create a space where people feel they can be themselves.",
            "You work in the background to help bring a group together.",
            "There is a sense of being truly heard when you're present.",
            "The atmosphere becomes more thoughtful and connected with you.",
            "Your impact is one of personal and sensitive attention.",
            "You project a deep sense of internal alignment."
        ];

        let pool = earth;
        if (element === 'fire') pool = fire;
        if (element === 'air') pool = air;
        if (element === 'water') pool = water;

        return this.getRandom(pool, rng, buffer);
    }

    private getAspectsForPlanet(planetName: string, bp: Blueprint): any[] {
        return bp.aspects.filter(a => a.planet1 === planetName || a.planet2 === planetName);
    }

    private getPlanetForLayer(layerId: number, bp: Blueprint): PlanetPosition | undefined {
        const p = (n: string) => bp.planets.find(x => x.name === n);

        // Mapping Layers to Planetary Functions (Psychological equivalents)
        switch (layerId) {
            case 1: return p('Sun'); // Core Disposition -> Ego/Will
            case 2: return p('Mars'); // Energy Orientation -> Drive/Action
            case 3: return p('Mercury'); // Perception -> Intellect
            case 4: return p('Saturn'); // Decision Logic -> Structure/Authority
            case 5: return p('Jupiter'); // Motivation -> Growth/Meaning
            case 6: return p('Saturn'); // Stress -> Containment
            case 7: return p('Moon'); // Emotional Reg -> Feeling/Safety
            case 8: return p('Mars'); // Behavioural Rhythm -> Pacing
            case 9: return p('Mercury'); // Communication -> Exchange
            case 10: return p('Venus'); // Relational Energy -> Value/Connection
            case 11: return p('Saturn'); // Relational Patterning -> Commitment
            case 12: return p('Sun'); // Social Role -> Visibility
            case 13: return p('Moon'); // Identity Coherence -> Inner Self
            case 14: return p('Jupiter'); // Growth Arc -> Expansion
            case 15: return p('Pluto'); // Life Navigation -> Transformation
            default: return p('Sun');
        }
    }

    private getLayerContext(layerId: number): string {
        const map: Record<number, string> = {
            1: "your fundamental self-concept and the way you assert yourself",
            2: "your effort and your natural pace of getting things done",
            3: "how you take in data and process information",
            4: "your critical decision-making and your sense of personal authority",
            5: "your search for meaning and how you choose to grow",
            6: "how you respond to pressure and deal with limits",
            7: "your internal thoughts and how you handle your emotions",
            8: "how you execute tasks and your style of leading",
            9: "how you exchange ideas and communicate with others",
            10: "how you relate to people and your own values",
            11: "how you build trust and handle long-term commitments",
            12: "your public presence and how you connect with groups",
            13: "how you integrate your private life with your public self",
            14: "how you learn from experience and adapt over time",
            15: "how you navigate significant changes in your life"
        };
        return map[layerId] || "internal processing";
    }

    private capitalize(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}

export const narrativeSynthesizer = new NarrativeSynthesizer();
