/**
 * OSIA Intelligence Types — v1.0
 * 
 * Core data structures for the OSIA psychological intelligence system.
 * These types enforce the Claim → Pattern → Theme → Module architecture.
 * 
 * CRITICAL: All objects are designed to be immutable. 
 * Never update an existing object - create a new snapshot instead.
 */

// ============================================================================
// CLAIM: The atomic unit of psychological insight
// ============================================================================

export type ClaimPolarity = 'strength' | 'friction' | 'neutral';
export type ClaimConfidence = 'emerging' | 'moderate' | 'developed' | 'integrated';
export type ClaimStatus = 'active' | 'superseded' | 'rejected';

/**
 * A Claim is the smallest verifiable unit of meaning.
 * Every output sentence should map to one or more Claims.
 */
export interface Claim {
    readonly claimId: string;           // Unique identifier (e.g., "CLM.L3.002")
    readonly layerId: number;           // Which of the 15 layers this claim relates to
    readonly text: string;              // The actual claim statement
    readonly polarity: ClaimPolarity;   // Is this a strength, friction, or neutral observation?
    readonly confidence: ClaimConfidence;
    readonly evidenceRefs: readonly string[];  // Signal IDs that support this claim
    readonly verificationPromptId?: string;    // Optional prompt to verify this claim
    readonly status: ClaimStatus;
    readonly createdAt: string;         // ISO timestamp
    readonly userId: string;            // Owner of this claim
}

/**
 * User feedback on a claim - never modifies the claim, creates adjustment record
 */
export interface ClaimFeedback {
    readonly feedbackId: string;
    readonly claimId: string;
    readonly userId: string;
    readonly resonance: 'fits' | 'partial' | 'doesnt_fit';
    readonly contextTags?: readonly string[];  // e.g., ['work', 'family', 'partner']
    readonly timestamp: string;
}

// ============================================================================
// PATTERN: A stable cluster of claims with a named dynamic
// ============================================================================

export type PatternCategory = 'individual' | 'relational' | 'team';
export type PatternStability = 'unstable' | 'emerging' | 'stable' | 'evolving';

/**
 * A Pattern is a recurring dynamic derived from multiple claims.
 * Patterns are reused across modules and have neutral, descriptive names.
 */
export interface Pattern {
    readonly patternId: string;         // e.g., "PAT.IND.DEPTH_BEFORE_DECISION"
    readonly category: PatternCategory;
    readonly layerIds: readonly number[];  // Which layers contribute to this pattern
    readonly name: string;              // Human-readable name (non-diagnostic)
    readonly oneLiner: string;          // Brief description
    readonly supportingClaimIds: readonly string[];
    readonly growthEdges: readonly string[];  // Actionable suggestions
    readonly confidence: ClaimConfidence;
    readonly stabilityIndex: number;    // 0-1 score of how stable this pattern is
    readonly createdAt: string;
    readonly userId: string;
}

// ============================================================================
// THEME: Cross-layer synthesis for thesis-level writing
// ============================================================================

/**
 * A Theme is a high-level polarity tension (e.g., "Control ↔ Trust")
 * derived from convergent patterns across multiple layers.
 */
export interface Theme {
    readonly themeId: string;           // e.g., "THM.TRUST_VS_CONTROL"
    readonly name: string;              // e.g., "Control ↔ Trust"
    readonly layerIds: readonly number[];
    readonly summary: string;
    readonly supportingPatternIds: readonly string[];
    readonly priority: 'low' | 'medium' | 'high';
    readonly createdAt: string;
    readonly userId: string;
}

// ============================================================================
// BLUEPRINT SNAPSHOT: Immutable point-in-time capture
// ============================================================================

export type SnapshotSource =
    | 'onboarding'
    | 'recalibration'
    | 'check_in'
    | 'refinement'
    | 'system_derived'
    | 'regeneration'
    | 'api';

/**
 * A BlueprintSnapshot is an immutable point-in-time capture of a user's
 * psychological intelligence state. NEVER update - always create new.
 */
export interface OSIABlueprintSnapshot {
    readonly snapshotId: string;
    readonly userId: string;
    readonly timestamp: string;
    readonly source: SnapshotSource;
    readonly version: string;           // e.g., "1.0.0"

    // The intelligence stack at this point in time
    readonly claims: readonly Claim[];
    readonly patterns: readonly Pattern[];
    readonly themes: readonly Theme[];

    // Reference to raw signal data
    readonly signalSnapshotId?: string;

    // Lineage tracking
    readonly previousSnapshotId?: string;
    readonly triggerEventId?: string;   // What caused this snapshot (e.g., refinement action)
}

// ============================================================================
// MODULE OUTPUTS: The generated thesis/insight documents
// ============================================================================

/**
 * Module section types for the Personality Thesis (Module 1)
 */
export type ThesisSectionType =
    | 'foundational_overview'
    | 'cognitive_emotional_blueprint'
    | 'core_strengths'
    | 'friction_zones'
    | 'behavioral_relational'
    | 'growth_trajectories'
    | 'closing_reflection';

/**
 * A generated section within a module
 */
export interface ModuleSection {
    readonly sectionType: ThesisSectionType | string;
    readonly content: string;
    readonly sourceClaimIds: readonly string[];
    readonly sourcePatternIds: readonly string[];
    readonly sourceThemeIds: readonly string[];
    readonly wordCount: number;
}

/**
 * Core Insights Hub domain (Module 2)
 */
export type LifeDomain =
    | 'spiritual'
    | 'physical_health'
    | 'personal'
    | 'relationships'
    | 'career'
    | 'business'
    | 'finances';

/**
 * A "One Thing" recommendation for a life domain
 */
export interface DomainInsight {
    readonly domain: LifeDomain;
    readonly coreTheme: string;
    readonly primaryChallenge: string;
    readonly oneThing: string;          // The single actionable practice
    readonly appliedOutcome: string;
    readonly sourceLayerIds: readonly number[];
    readonly sourcePatternsIds: readonly string[];
}

// ============================================================================
// RELATIONAL TYPES: For dyadic and relationship-type intelligence
// ============================================================================

export type RelationshipType =
    | 'spouse_partner'
    | 'parent_child'
    | 'family_member'
    | 'friend'
    | 'colleague_team'
    | 'mentor_student';

/**
 * Weights for interpreting patterns by relationship type
 */
export interface RelationshipLens {
    readonly relationshipType: RelationshipType;
    readonly primaryLayerWeights: Record<number, number>;  // Layer ID -> weight multiplier
    readonly interpretationFocus: string;  // e.g., "emotional safety & repair"
}

/**
 * A relational blueprint between two users
 */
export interface RelationalBlueprint {
    readonly relationalId: string;
    readonly userAId: string;
    readonly userBId: string;
    readonly relationshipType: RelationshipType;
    readonly mutualConsentTimestamp: string;

    // The relationship itself is a first-class object with its own patterns
    readonly relationalPatterns: readonly Pattern[];
    readonly sharedGrowthEdges: readonly string[];
    readonly strengthExpressions: readonly string[];
    readonly frictionPoints: readonly string[];

    readonly createdAt: string;
    readonly lastUpdatedAt: string;
}

// ============================================================================
// VOCABULARY ENFORCEMENT: Allowed and forbidden language
// ============================================================================

/**
 * Words and phrases that MUST NOT appear in any output
 */
export const FORBIDDEN_VOCABULARY: readonly string[] = [
    // Clinical/diagnostic labels
    'narcissistic', 'borderline', 'bipolar', 'adhd', 'trauma response',
    'codependent', 'toxic', 'disorder', 'syndrome', 'pathological',

    // Moral judgments
    'lazy', 'weak', 'broken', 'damaged', 'selfish', 'manipulative',

    // Deterministic identity
    'you are', 'this proves', 'always will be', 'never can',

    // Scores/rankings
    'score:', 'rating:', '% compatible', 'high performer', 'low performer'
] as const;

/**
 * Preferred framing language
 */
export const PREFERRED_VOCABULARY: readonly string[] = [
    // Pattern language
    'tendency', 'pattern', 'often', 'may', 'can show up as',

    // Hypothesis framing
    'hypothesis', 'a working mirror', 'what we see',

    // Growth language
    'growth edge', 'leverage', 'experiment', 'practice',

    // State descriptors
    'stability', 'emerging', 'developed', 'integrated',

    // Contextual anchors
    'in work', 'in close relationships', 'under stress', 'when uncertain'
] as const;

// ============================================================================
// AUDIT TYPES: For tracking all mutations
// ============================================================================

export type AuditEventType =
    | 'snapshot_created'
    | 'claim_created'
    | 'claim_feedback_received'
    | 'claim_feedback'
    | 'pattern_promoted'
    | 'theme_detected'
    | 'module_generated'
    | 'osia_output_generated'
    | 'relational_link_created'
    | 'consent_changed';

/**
 * Immutable audit record for every significant system action
 */
export interface AuditEvent {
    readonly eventId: string;
    readonly eventType: AuditEventType;
    readonly userId: string;
    readonly targetId: string;          // The ID of the object affected
    readonly metadata: Record<string, unknown>;
    readonly timestamp: string;
}

// ============================================================================
// TYPE GUARDS: Runtime validation
// ============================================================================

export function isClaim(obj: unknown): obj is Claim {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'claimId' in obj &&
        'layerId' in obj &&
        'text' in obj &&
        'polarity' in obj
    );
}

export function isPattern(obj: unknown): obj is Pattern {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'patternId' in obj &&
        'category' in obj &&
        'name' in obj
    );
}

export function isTheme(obj: unknown): obj is Theme {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'themeId' in obj &&
        'name' in obj &&
        'supportingPatternIds' in obj
    );
}

// ============================================================================
// LAYER DEFINITIONS: The 15-layer model reference
// ============================================================================

export interface LayerDefinition {
    readonly layerId: number;
    readonly name: string;
    readonly cluster: 'A' | 'B' | 'C' | 'D' | 'E';
    readonly primaryFocus: string;
    readonly stabilityType: 'stable' | 'dynamic';
}

export const LAYER_DEFINITIONS: readonly LayerDefinition[] = [
    { layerId: 1, name: 'Core Disposition', cluster: 'A', primaryFocus: 'Baseline temperament and inner climate', stabilityType: 'stable' },
    { layerId: 2, name: 'Energy Orientation', cluster: 'A', primaryFocus: 'How energy is gained, lost, and paced', stabilityType: 'dynamic' },
    { layerId: 3, name: 'Perception & Information Processing', cluster: 'A', primaryFocus: 'How information is taken in and structured', stabilityType: 'stable' },
    { layerId: 4, name: 'Decision Logic', cluster: 'B', primaryFocus: 'How conclusions are reached and trade-offs made', stabilityType: 'dynamic' },
    { layerId: 5, name: 'Motivational Drivers', cluster: 'B', primaryFocus: 'What deeply motivates and sustains effort', stabilityType: 'stable' },
    { layerId: 6, name: 'Stress & Pressure Patterns', cluster: 'B', primaryFocus: 'How pressure is experienced and responded to', stabilityType: 'dynamic' },
    { layerId: 7, name: 'Emotional Regulation & Expression', cluster: 'C', primaryFocus: 'How emotions are processed and shared', stabilityType: 'dynamic' },
    { layerId: 8, name: 'Behavioural Rhythm & Execution', cluster: 'C', primaryFocus: 'Work style, pacing, and follow-through', stabilityType: 'dynamic' },
    { layerId: 9, name: 'Communication Mode', cluster: 'C', primaryFocus: 'Preferred ways of expressing and receiving meaning', stabilityType: 'dynamic' },
    { layerId: 10, name: 'Relational Energy & Boundaries', cluster: 'D', primaryFocus: 'How connection, distance, and closeness are managed', stabilityType: 'dynamic' },
    { layerId: 11, name: 'Relational Patterning', cluster: 'D', primaryFocus: 'Repeating patterns in key relationships', stabilityType: 'dynamic' },
    { layerId: 12, name: 'Social Role & Influence Expression', cluster: 'D', primaryFocus: 'How a person shows up in groups and power structures', stabilityType: 'dynamic' },
    { layerId: 13, name: 'Identity Coherence & Maturity', cluster: 'E', primaryFocus: 'How integrated and grounded the sense of self is', stabilityType: 'stable' },
    { layerId: 14, name: 'Growth Arc & Learning Orientation', cluster: 'E', primaryFocus: 'Long-term developmental direction and learning style', stabilityType: 'dynamic' },
    { layerId: 15, name: 'Life Navigation & Current Edge', cluster: 'E', primaryFocus: 'How major decisions are made and where growth pressure sits now', stabilityType: 'dynamic' }
] as const;
