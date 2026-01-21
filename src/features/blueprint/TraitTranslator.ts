import type { CelestialPosition } from './AstronomyService';

export interface Trait {
    id: string;
    name: string;
    description: string;
    category: 'Core' | 'Emotional' | 'Intellectual' | 'Drive' | 'Social' | 'Expansion' | 'Structure';
    intensity: number; // 0-1
}

const TRAIT_MAPPING: Record<string, Record<string, Trait>> = {
    'Sun': {
        'Aries': { id: 'sun_aries', name: 'Initiating Force', description: 'You possess a natural drive to start new ventures and lead with action.', category: 'Core', intensity: 0.9 },
        'Taurus': { id: 'sun_taurus', name: 'Grounded Stability', description: 'You build enduring structures and value tangible results.', category: 'Core', intensity: 0.8 },
        'Gemini': { id: 'sun_gemini', name: 'Adaptive Intellect', description: 'Your core nature is defined by curiosity and rapid information processing.', category: 'Core', intensity: 0.85 },
        'Cancer': { id: 'sun_cancer', name: 'Protective Depth', description: 'You navigate the world through emotional resonance and creating safety.', category: 'Core', intensity: 0.9 },
        'Leo': { id: 'sun_leo', name: 'Radiant Expression', description: 'You have a fundamental need to express your unique identity visibly.', category: 'Core', intensity: 0.95 },
        'Virgo': { id: 'sun_virgo', name: 'Analytical Precision', description: 'You find purpose in refining systems and improving details.', category: 'Core', intensity: 0.8 },
        'Libra': { id: 'sun_libra', name: 'Harmonic Balance', description: 'Your essence is oriented towards creating equilibrium and connection.', category: 'Core', intensity: 0.85 },
        'Scorpio': { id: 'sun_scorpio', name: 'Transformative Intensity', description: 'You seek the core truth beneath the surface of things.', category: 'Core', intensity: 0.95 },
        'Sagittarius': { id: 'sun_sagittarius', name: 'Expansive Vision', description: 'You are driven by the search for meaning and broader horizons.', category: 'Core', intensity: 0.9 },
        'Capricorn': { id: 'sun_capricorn', name: 'Strategic Mastery', description: 'You are motivated by building lasting achievements and structures.', category: 'Core', intensity: 0.9 },
        'Aquarius': { id: 'sun_aquarius', name: 'Innovative Systems', description: 'You view the world through the lens of future possibilities and networks.', category: 'Core', intensity: 0.85 },
        'Pisces': { id: 'sun_pisces', name: 'Fluid Intuition', description: 'Your reality is permeable, allowing for deep empathy and imagination.', category: 'Core', intensity: 0.8 }
    },
    'Moon': {
        'Aries': { id: 'moon_aries', name: 'Reactive Instinct', description: 'Your emotional responses are immediate and fiery.', category: 'Emotional', intensity: 0.85 },
        'Taurus': { id: 'moon_taurus', name: 'Sensory Comfort', description: 'You find emotional security in stability and physical comfort.', category: 'Emotional', intensity: 0.8 },
        'Gemini': { id: 'moon_gemini', name: 'Verbal Processing', description: 'You process emotions by analyzing and discussing them.', category: 'Emotional', intensity: 0.75 },
        'Cancer': { id: 'moon_cancer', name: 'Deep Resonance', description: 'Your emotional world is vast, protective, and highly sensitive.', category: 'Emotional', intensity: 0.95 },
        'Leo': { id: 'moon_leo', name: 'Expressive Heart', description: 'You need to feel seen and appreciated to feel emotionally safe.', category: 'Emotional', intensity: 0.9 },
        'Virgo': { id: 'moon_virgo', name: 'Practical Care', description: 'You show and process emotion through helpful acts and organization.', category: 'Emotional', intensity: 0.75 },
        'Libra': { id: 'moon_libra', name: 'Relational Mirroring', description: 'Your emotional state is often attuned to the harmony of your environment.', category: 'Emotional', intensity: 0.8 },
        'Scorpio': { id: 'moon_scorpio', name: 'Intense Bonding', description: 'You crave deep, absolute emotional merging and truth.', category: 'Emotional', intensity: 1.0 },
        'Sagittarius': { id: 'moon_sagittarius', name: 'Optimistic Freedom', description: 'You need emotional space and philosophical meaning to feel secure.', category: 'Emotional', intensity: 0.8 },
        'Capricorn': { id: 'moon_capricorn', name: 'Reserved Control', description: 'You manage emotions with discipline and a focus on responsibility.', category: 'Emotional', intensity: 0.7 },
        'Aquarius': { id: 'moon_aquarius', name: 'Detached Observation', description: 'You can step back from emotions to view them objectively.', category: 'Emotional', intensity: 0.75 },
        'Pisces': { id: 'moon_pisces', name: 'Oceanic Empathy', description: 'You absorb the emotional currents of your surroundings.', category: 'Emotional', intensity: 0.95 }
    },
    'Mercury': {
        'Aries': { id: 'mercury_aries', name: 'Direct Cognition', description: 'Your mind moves fast, favoring directness and quick decisions.', category: 'Intellectual', intensity: 0.85 },
        'Taurus': { id: 'mercury_taurus', name: 'Deliberate Thought', description: 'You think methodically and value practical, tangible ideas.', category: 'Intellectual', intensity: 0.8 },
        'Gemini': { id: 'mercury_gemini', name: 'Versatile Intelligence', description: 'Your mind is agile, curious, and capable of handling multiple streams of information.', category: 'Intellectual', intensity: 0.9 },
        'Cancer': { id: 'mercury_cancer', name: 'Intuitive Logic', description: 'Your thinking is deeply influenced by your feelings and memory.', category: 'Intellectual', intensity: 0.8 },
        'Leo': { id: 'mercury_leo', name: 'Creative Expression', description: 'You communicate with warmth, authority, and a flair for the dramatic.', category: 'Intellectual', intensity: 0.85 },
        'Virgo': { id: 'mercury_virgo', name: 'Analytical Detail', description: 'You have a sharp eye for detail and a talent for critical analysis.', category: 'Intellectual', intensity: 0.9 },
        'Libra': { id: 'mercury_libra', name: 'Diplomatic Mind', description: 'You weigh all sides of an issue and seek consensus in your thinking.', category: 'Intellectual', intensity: 0.8 },
        'Scorpio': { id: 'mercury_scorpio', name: 'Investigative Mind', description: 'Your communication style penetrates to the hidden core of matters.', category: 'Intellectual', intensity: 0.9 },
        'Sagittarius': { id: 'mercury_sagittarius', name: 'Philosophical Scope', description: 'You are interested in the big picture, ethics, and broad concepts.', category: 'Intellectual', intensity: 0.85 },
        'Capricorn': { id: 'mercury_capricorn', name: 'Structured Planning', description: 'Your mind is organized, disciplined, and focused on long-term goals.', category: 'Intellectual', intensity: 0.85 },
        'Aquarius': { id: 'mercury_aquarius', name: 'Progressive Intellect', description: 'You think outside the box and are drawn to unconventional ideas.', category: 'Intellectual', intensity: 0.9 },
        'Pisces': { id: 'mercury_pisces', name: 'Poetic Imagination', description: 'Your thinking is non-linear, imaginative, and highly intuitive.', category: 'Intellectual', intensity: 0.85 }
    },
    'Venus': {
        'Aries': { id: 'venus_aries', name: 'Passionate Pursuit', description: 'In relationships, you are direct, ardent, and enjoy the thrill of the chase.', category: 'Social', intensity: 0.9 },
        'Taurus': { id: 'venus_taurus', name: 'Sensual Loyalty', description: 'You value stability, physical touch, and enduring affection.', category: 'Social', intensity: 0.85 },
        'Gemini': { id: 'venus_gemini', name: 'Social Variety', description: 'You need mental stimulation and variety to stay interested in connections.', category: 'Social', intensity: 0.8 },
        'Cancer': { id: 'venus_cancer', name: 'Nurturing Bond', description: 'You express love through caring, protection, and emotional closeness.', category: 'Social', intensity: 0.9 },
        'Leo': { id: 'venus_leo', name: 'Grand Romance', description: 'You love generously and want your relationships to be a source of pride.', category: 'Social', intensity: 0.95 },
        'Virgo': { id: 'venus_virgo', name: 'Devoted Service', description: 'You show affection through practical help and attention to detail.', category: 'Social', intensity: 0.75 },
        'Libra': { id: 'venus_libra', name: 'Ideal Partnership', description: 'You have a natural talent for creating harmony and beauty in relationships.', category: 'Social', intensity: 0.9 },
        'Scorpio': { id: 'venus_scorpio', name: 'Soulful Fusion', description: 'You seek intense, transformative, and all-consuming connections.', category: 'Social', intensity: 1.0 },
        'Sagittarius': { id: 'venus_sagittarius', name: 'Adventurous Love', description: 'You value freedom and shared exploration in your partnerships.', category: 'Social', intensity: 0.85 },
        'Capricorn': { id: 'venus_capricorn', name: 'Committed Integrity', description: 'You take relationships seriously and value reliability and status.', category: 'Social', intensity: 0.8 },
        'Aquarius': { id: 'venus_aquarius', name: 'Friendly Detachment', description: 'You value intellectual connection and freedom within relationships.', category: 'Social', intensity: 0.8 },
        'Pisces': { id: 'venus_pisces', name: 'Romantic Idealism', description: 'You are capable of unconditional love and deep spiritual connection.', category: 'Social', intensity: 0.95 }
    },
    'Mars': {
        'Aries': { id: 'mars_aries', name: 'Warrior Spirit', description: 'Your drive is assertive, competitive, and highly energetic.', category: 'Drive', intensity: 0.95 },
        'Taurus': { id: 'mars_taurus', name: 'Enduring Strength', description: 'Your energy is steady, persistent, and focused on tangible results.', category: 'Drive', intensity: 0.85 },
        'Gemini': { id: 'mars_gemini', name: 'Restless Activity', description: 'You are driven by ideas and often pursue multiple goals simultaneously.', category: 'Drive', intensity: 0.8 },
        'Cancer': { id: 'mars_cancer', name: 'Protective Drive', description: 'You fight fiercely for those you love and your emotional security.', category: 'Drive', intensity: 0.85 },
        'Leo': { id: 'mars_leo', name: 'Creative Will', description: 'You are motivated by the desire to create and be recognized.', category: 'Drive', intensity: 0.9 },
        'Virgo': { id: 'mars_virgo', name: 'Efficient Action', description: 'You direct your energy towards perfection, service, and skill mastery.', category: 'Drive', intensity: 0.8 },
        'Libra': { id: 'mars_libra', name: 'Strategic Diplomacy', description: 'You prefer to achieve your goals through cooperation and charm.', category: 'Drive', intensity: 0.75 },
        'Scorpio': { id: 'mars_scorpio', name: 'Focused Power', description: 'Your will is intense, strategic, and capable of great endurance.', category: 'Drive', intensity: 1.0 },
        'Sagittarius': { id: 'mars_sagittarius', name: 'Idealistic Crusade', description: 'You are driven by your beliefs and a desire for expansion.', category: 'Drive', intensity: 0.9 },
        'Capricorn': { id: 'mars_capricorn', name: 'Ambitious Discipline', description: 'You are motivated by long-term success and professional achievement.', category: 'Drive', intensity: 0.9 },
        'Aquarius': { id: 'mars_aquarius', name: 'Reformist Zeal', description: 'You fight for innovation, freedom, and collective progress.', category: 'Drive', intensity: 0.85 },
        'Pisces': { id: 'mars_pisces', name: 'Inspired Flow', description: 'Your energy fluctuates but can be channeled into artistic or spiritual pursuits.', category: 'Drive', intensity: 0.8 }
    },
    'Jupiter': {
        'Aries': { id: 'jupiter_aries', name: 'Bold Expansion', description: 'You grow through taking initiative and leading the way.', category: 'Expansion', intensity: 0.9 },
        'Taurus': { id: 'jupiter_taurus', name: 'Material Abundance', description: 'You find growth in building wealth and enjoying the senses.', category: 'Expansion', intensity: 0.85 },
        'Gemini': { id: 'jupiter_gemini', name: 'Intellectual Reach', description: 'You expand your horizons through learning, communication, and networking.', category: 'Expansion', intensity: 0.85 },
        'Cancer': { id: 'jupiter_cancer', name: 'Emotional Wisdom', description: 'You grow through nurturing others and deepening your roots.', category: 'Expansion', intensity: 0.9 },
        'Leo': { id: 'jupiter_leo', name: 'Creative Confidence', description: 'You find luck when you express yourself authentically and generously.', category: 'Expansion', intensity: 0.9 },
        'Virgo': { id: 'jupiter_virgo', name: 'Practical Improvement', description: 'You expand through service, work, and refining details.', category: 'Expansion', intensity: 0.8 },
        'Libra': { id: 'jupiter_libra', name: 'Relational Harmony', description: 'You grow through partnership, fairness, and artistic appreciation.', category: 'Expansion', intensity: 0.85 },
        'Scorpio': { id: 'jupiter_scorpio', name: 'Deep Transformation', description: 'You find meaning in exploring the mysteries of life and regeneration.', category: 'Expansion', intensity: 0.95 },
        'Sagittarius': { id: 'jupiter_sagittarius', name: 'Philosophical Quest', description: 'You are a natural seeker of truth, wisdom, and adventure.', category: 'Expansion', intensity: 0.95 },
        'Capricorn': { id: 'jupiter_capricorn', name: 'Structured Success', description: 'You grow through discipline, responsibility, and career achievement.', category: 'Expansion', intensity: 0.9 },
        'Aquarius': { id: 'jupiter_aquarius', name: 'Collective Vision', description: 'You expand through social reform, groups, and future-oriented ideas.', category: 'Expansion', intensity: 0.9 },
        'Pisces': { id: 'jupiter_pisces', name: 'Spiritual Compassion', description: 'You find growth in empathy, spirituality, and artistic imagination.', category: 'Expansion', intensity: 0.95 }
    },
    'Saturn': {
        'Aries': { id: 'saturn_aries', name: 'Self-Discipline', description: 'You learn responsibility through self-assertion and courage.', category: 'Structure', intensity: 0.85 },
        'Taurus': { id: 'saturn_taurus', name: 'Resource Management', description: 'You build structure through financial stability and patience.', category: 'Structure', intensity: 0.9 },
        'Gemini': { id: 'saturn_gemini', name: 'Mental Discipline', description: 'You structure your life through communication and serious study.', category: 'Structure', intensity: 0.8 },
        'Cancer': { id: 'saturn_cancer', name: 'Emotional Security', description: 'You work hard to build a secure home and protect your family.', category: 'Structure', intensity: 0.85 },
        'Leo': { id: 'saturn_leo', name: 'Creative Authority', description: 'You take your creative expression and leadership role seriously.', category: 'Structure', intensity: 0.9 },
        'Virgo': { id: 'saturn_virgo', name: 'Systematic Order', description: 'You find structure in work, health routines, and service.', category: 'Structure', intensity: 0.85 },
        'Libra': { id: 'saturn_libra', name: 'Relational Responsibility', description: 'You take partnerships seriously and work for justice.', category: 'Structure', intensity: 0.85 },
        'Scorpio': { id: 'saturn_scorpio', name: 'Deep Control', description: 'You structure your life through mastering your own depths and resources.', category: 'Structure', intensity: 0.95 },
        'Sagittarius': { id: 'saturn_sagittarius', name: 'Belief Structure', description: 'You work hard to define your philosophy and ethical code.', category: 'Structure', intensity: 0.85 },
        'Capricorn': { id: 'saturn_capricorn', name: 'Master Builder', description: 'You are the architect of your own life, valuing ambition and authority.', category: 'Structure', intensity: 1.0 },
        'Aquarius': { id: 'saturn_aquarius', name: 'Social Structure', description: 'You work to build structures that benefit the group or society.', category: 'Structure', intensity: 0.9 },
        'Pisces': { id: 'saturn_pisces', name: 'Spiritual Discipline', description: 'You give form to the formless through art or spiritual practice.', category: 'Structure', intensity: 0.8 }
    },
    'Uranus': {
        'Aries': { id: 'uranus_aries', name: 'Radical Action', description: 'You innovate through bold, independent action.', category: 'Expansion', intensity: 0.9 },
        'Taurus': { id: 'uranus_taurus', name: 'Material Revolution', description: 'You bring change to values, resources, and the earth.', category: 'Expansion', intensity: 0.85 },
        'Gemini': { id: 'uranus_gemini', name: 'Mental Awakening', description: 'You revolutionize communication and information exchange.', category: 'Expansion', intensity: 0.9 },
        'Cancer': { id: 'uranus_cancer', name: 'Emotional Freedom', description: 'You seek to liberate yourself from traditional family patterns.', category: 'Expansion', intensity: 0.85 },
        'Leo': { id: 'uranus_leo', name: 'Creative Liberation', description: 'You express your uniqueness in shocking or brilliant ways.', category: 'Expansion', intensity: 0.9 },
        'Virgo': { id: 'uranus_virgo', name: 'Systemic Update', description: 'You innovate in health, work, and daily routines.', category: 'Expansion', intensity: 0.85 },
        'Libra': { id: 'uranus_libra', name: 'Relational Change', description: 'You bring new, unconventional approaches to partnership.', category: 'Expansion', intensity: 0.85 },
        'Scorpio': { id: 'uranus_scorpio', name: 'Deep Awakening', description: 'You undergo sudden, intense psychological transformations.', category: 'Expansion', intensity: 0.95 },
        'Sagittarius': { id: 'uranus_sagittarius', name: 'Philosophical Shift', description: 'You revolutionize beliefs, education, and travel.', category: 'Expansion', intensity: 0.9 },
        'Capricorn': { id: 'uranus_capricorn', name: 'Structural Reform', description: 'You change established hierarchies and government structures.', category: 'Expansion', intensity: 0.9 },
        'Aquarius': { id: 'uranus_aquarius', name: 'Collective Progress', description: 'You are a true visionary, working for the future of humanity.', category: 'Expansion', intensity: 1.0 },
        'Pisces': { id: 'uranus_pisces', name: 'Spiritual Awakening', description: 'You bring sudden flashes of intuition and spiritual insight.', category: 'Expansion', intensity: 0.9 }
    },
    'Neptune': {
        'Aries': { id: 'neptune_aries', name: 'Inspired Action', description: 'Your dreams are fueled by a desire for new beginnings.', category: 'Expansion', intensity: 0.85 },
        'Taurus': { id: 'neptune_taurus', name: 'Idealized Beauty', description: 'You dream of a world of material abundance and peace.', category: 'Expansion', intensity: 0.85 },
        'Gemini': { id: 'neptune_gemini', name: 'Poetic Mind', description: 'Your imagination expresses itself through words and ideas.', category: 'Expansion', intensity: 0.85 },
        'Cancer': { id: 'neptune_cancer', name: 'Emotional Idealism', description: 'You are deeply sensitive and dream of a perfect home.', category: 'Expansion', intensity: 0.9 },
        'Leo': { id: 'neptune_leo', name: 'Artistic Glamour', description: 'You channel your dreams into creative and dramatic expression.', category: 'Expansion', intensity: 0.9 },
        'Virgo': { id: 'neptune_virgo', name: 'Healing Service', description: 'You find spiritual meaning in helping others and refining details.', category: 'Expansion', intensity: 0.85 },
        'Libra': { id: 'neptune_libra', name: 'Harmonic Ideal', description: 'You dream of perfect balance, peace, and ideal relationships.', category: 'Expansion', intensity: 0.9 },
        'Scorpio': { id: 'neptune_scorpio', name: 'Mystical Depth', description: 'You are drawn to the deepest mysteries of the soul.', category: 'Expansion', intensity: 0.95 },
        'Sagittarius': { id: 'neptune_sagittarius', name: 'Spiritual Quest', description: 'You seek a universal truth that unites all things.', category: 'Expansion', intensity: 0.9 },
        'Capricorn': { id: 'neptune_capricorn', name: 'Practical Vision', description: 'You try to bring your dreams into concrete reality.', category: 'Expansion', intensity: 0.85 },
        'Aquarius': { id: 'neptune_aquarius', name: 'Utopian Dream', description: 'You dream of a better, more unified society.', category: 'Expansion', intensity: 0.9 },
        'Pisces': { id: 'neptune_pisces', name: 'Oceanic Oneness', description: 'You feel a complete dissolution of boundaries and deep empathy.', category: 'Expansion', intensity: 1.0 }
    },
    'Pluto': {
        'Aries': { id: 'pluto_aries', name: 'Transformative Will', description: 'You are part of a generation that transforms through individual action.', category: 'Structure', intensity: 0.9 },
        'Taurus': { id: 'pluto_taurus', name: 'Material Regeneration', description: 'You transform values, resources, and the economy.', category: 'Structure', intensity: 0.9 },
        'Gemini': { id: 'pluto_gemini', name: 'Mental Transformation', description: 'You transform the way information is communicated.', category: 'Structure', intensity: 0.9 },
        'Cancer': { id: 'pluto_cancer', name: 'Emotional Rebirth', description: 'You transform the concept of family and emotional security.', category: 'Structure', intensity: 0.9 },
        'Leo': { id: 'pluto_leo', name: 'Creative Power', description: 'You transform through creative self-expression and leadership.', category: 'Structure', intensity: 0.95 },
        'Virgo': { id: 'pluto_virgo', name: 'Deep Purification', description: 'You transform through service, health, and analysis.', category: 'Structure', intensity: 0.9 },
        'Libra': { id: 'pluto_libra', name: 'Relational Intensity', description: 'You transform relationships and concepts of justice.', category: 'Structure', intensity: 0.9 },
        'Scorpio': { id: 'pluto_scorpio', name: 'Absolute Power', description: 'You represent the height of regenerative and transformative power.', category: 'Structure', intensity: 1.0 },
        'Sagittarius': { id: 'pluto_sagittarius', name: 'Truth Transformation', description: 'You transform religious and philosophical beliefs.', category: 'Structure', intensity: 0.9 },
        'Capricorn': { id: 'pluto_capricorn', name: 'Structural Power', description: 'You transform governments, institutions, and hierarchies.', category: 'Structure', intensity: 0.95 },
        'Aquarius': { id: 'pluto_aquarius', name: 'Social Rebirth', description: 'You transform society through technology and humanitarianism.', category: 'Structure', intensity: 0.95 },
        'Pisces': { id: 'pluto_pisces', name: 'Spiritual Evolution', description: 'You transform spirituality and the collective unconscious.', category: 'Structure', intensity: 0.9 }
    },
    'Ascendant': {
        'Aries': { id: 'asc_aries', name: 'The Pioneer', description: 'You approach the world with directness, courage, and energy.', category: 'Core', intensity: 0.9 },
        'Taurus': { id: 'asc_taurus', name: 'The Builder', description: 'You present a calm, stable, and reliable face to the world.', category: 'Core', intensity: 0.85 },
        'Gemini': { id: 'asc_gemini', name: 'The Messenger', description: 'You appear curious, adaptable, and communicative.', category: 'Core', intensity: 0.85 },
        'Cancer': { id: 'asc_cancer', name: 'The Nurturer', description: 'You come across as gentle, protective, and sensitive.', category: 'Core', intensity: 0.85 },
        'Leo': { id: 'asc_leo', name: 'The Performer', description: 'You project warmth, confidence, and a desire to be seen.', category: 'Core', intensity: 0.9 },
        'Virgo': { id: 'asc_virgo', name: 'The Analyst', description: 'You appear modest, helpful, and attentive to detail.', category: 'Core', intensity: 0.8 },
        'Libra': { id: 'asc_libra', name: 'The Diplomat', description: 'You project charm, grace, and a desire for harmony.', category: 'Core', intensity: 0.85 },
        'Scorpio': { id: 'asc_scorpio', name: 'The Detective', description: 'You have an intense, magnetic, and mysterious presence.', category: 'Core', intensity: 0.95 },
        'Sagittarius': { id: 'asc_sagittarius', name: 'The Explorer', description: 'You appear optimistic, adventurous, and enthusiastic.', category: 'Core', intensity: 0.9 },
        'Capricorn': { id: 'asc_capricorn', name: 'The Executive', description: 'You project seriousness, competence, and authority.', category: 'Core', intensity: 0.9 },
        'Aquarius': { id: 'asc_aquarius', name: 'The Individualist', description: 'You appear unique, friendly, and somewhat detached.', category: 'Core', intensity: 0.85 },
        'Pisces': { id: 'asc_pisces', name: 'The Dreamer', description: 'You have a soft, empathetic, and adaptable presence.', category: 'Core', intensity: 0.85 }
    },
    'MC': {
        'Aries': { id: 'mc_aries', name: 'Pioneering Career', description: 'You are known for your leadership and initiative in the public sphere.', category: 'Social', intensity: 0.9 },
        'Taurus': { id: 'mc_taurus', name: 'Stable Reputation', description: 'You are known for your reliability and ability to build value.', category: 'Social', intensity: 0.85 },
        'Gemini': { id: 'mc_gemini', name: 'Communicator Role', description: 'You are known for your versatility and communication skills.', category: 'Social', intensity: 0.85 },
        'Cancer': { id: 'mc_cancer', name: 'Caring Authority', description: 'You are known for your protective and nurturing leadership style.', category: 'Social', intensity: 0.85 },
        'Leo': { id: 'mc_leo', name: 'Star Power', description: 'You are known for your creativity, charisma, and visibility.', category: 'Social', intensity: 0.95 },
        'Virgo': { id: 'mc_virgo', name: 'Expert Service', description: 'You are known for your precision, skill, and helpfulness.', category: 'Social', intensity: 0.85 },
        'Libra': { id: 'mc_libra', name: 'Diplomatic Image', description: 'You are known for your fairness, style, and ability to mediate.', category: 'Social', intensity: 0.85 },
        'Scorpio': { id: 'mc_scorpio', name: 'Powerful Presence', description: 'You are known for your intensity, strategy, and transformative power.', category: 'Social', intensity: 0.95 },
        'Sagittarius': { id: 'mc_sagittarius', name: 'Visionary Leader', description: 'You are known for your wisdom, teaching, and expansive vision.', category: 'Social', intensity: 0.9 },
        'Capricorn': { id: 'mc_capricorn', name: 'The Boss', description: 'You are known for your ambition, discipline, and professional success.', category: 'Social', intensity: 1.0 },
        'Aquarius': { id: 'mc_aquarius', name: 'Innovative Career', description: 'You are known for your originality and humanitarian goals.', category: 'Social', intensity: 0.9 },
        'Pisces': { id: 'mc_pisces', name: 'Artistic Vocation', description: 'You are known for your compassion, creativity, and vision.', category: 'Social', intensity: 0.85 }
    },
    'NorthNode': {
        'Aries': { id: 'nn_aries', name: 'Path of Courage', description: 'Your destiny involves developing independence and self-assertion.', category: 'Expansion', intensity: 0.9 },
        'Taurus': { id: 'nn_taurus', name: 'Path of Stability', description: 'Your destiny involves finding peace and building self-worth.', category: 'Expansion', intensity: 0.85 },
        'Gemini': { id: 'nn_gemini', name: 'Path of Connection', description: 'Your destiny involves learning, listening, and communicating.', category: 'Expansion', intensity: 0.85 },
        'Cancer': { id: 'nn_cancer', name: 'Path of Nurturing', description: 'Your destiny involves embracing your feelings and caring for others.', category: 'Expansion', intensity: 0.9 },
        'Leo': { id: 'nn_leo', name: 'Path of Expression', description: 'Your destiny involves shining your light and creating joy.', category: 'Expansion', intensity: 0.95 },
        'Virgo': { id: 'nn_virgo', name: 'Path of Service', description: 'Your destiny involves analyzing, refining, and being of service.', category: 'Expansion', intensity: 0.85 },
        'Libra': { id: 'nn_libra', name: 'Path of Harmony', description: 'Your destiny involves learning cooperation and balance.', category: 'Expansion', intensity: 0.85 },
        'Scorpio': { id: 'nn_scorpio', name: 'Path of Transformation', description: 'Your destiny involves embracing change and deep intimacy.', category: 'Expansion', intensity: 0.95 },
        'Sagittarius': { id: 'nn_sagittarius', name: 'Path of Wisdom', description: 'Your destiny involves seeking truth and expanding your horizons.', category: 'Expansion', intensity: 0.9 },
        'Capricorn': { id: 'nn_capricorn', name: 'Path of Achievement', description: 'Your destiny involves taking responsibility and achieving goals.', category: 'Expansion', intensity: 0.9 },
        'Aquarius': { id: 'nn_aquarius', name: 'Path of Community', description: 'Your destiny involves connecting with the collective and the future.', category: 'Expansion', intensity: 0.9 },
        'Pisces': { id: 'nn_pisces', name: 'Path of Spirit', description: 'Your destiny involves surrendering to the flow and developing compassion.', category: 'Expansion', intensity: 0.9 }
    }
};

export class TraitTranslator {
    static translate(positions: CelestialPosition[]): Trait[] {
        const traits: Trait[] = [];

        positions.forEach(pos => {
            const bodyMap = TRAIT_MAPPING[pos.body];
            if (bodyMap) {
                const trait = bodyMap[pos.sign];
                if (trait) {
                    traits.push(trait);
                }
            }
        });

        return traits;
    }
}
