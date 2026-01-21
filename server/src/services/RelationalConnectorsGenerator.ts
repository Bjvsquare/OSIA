/**
 * OSIA Relational Connectors Generator — v1.0
 * 
 * Generates the "Relational Connectors Profile" (Module 3) that describes
 * how an individual connects across different relationship types.
 * 
 * Relationship Types:
 * 1. Spouse/Partner - Intimate relationship dynamics
 * 2. Parent/Child - Parental relationship patterns
 * 3. Family Member - Extended family dynamics
 * 4. Friend - Friendship patterns
 * 5. Colleague/Team - Professional relationship dynamics
 * 6. Mentor/Student - Teaching/learning relationships
 * 
 * Key Principle: Same patterns, different interpretations based on relationship context.
 */

import {
    Claim,
    Pattern,
    Theme,
    RelationshipType,
    RelationshipLens,
    LAYER_DEFINITIONS
} from '../types/osia-types';

// ============================================================================
// RELATIONSHIP LENSES: Different interpretation weights per relationship type
// ============================================================================

const RELATIONSHIP_LENSES: RelationshipLens[] = [
    {
        relationshipType: 'spouse_partner',
        primaryLayerWeights: {
            7: 1.5,   // Emotional Regulation - highest weight
            10: 1.4,  // Relational Energy & Boundaries
            11: 1.3,  // Relational Patterning
            9: 1.2,   // Communication Mode
            6: 1.1,   // Stress Patterns
            2: 1.0,   // Energy Orientation
        },
        interpretationFocus: 'emotional safety, repair, and deep connection'
    },
    {
        relationshipType: 'parent_child',
        primaryLayerWeights: {
            7: 1.5,   // Emotional Regulation
            10: 1.4,  // Boundaries
            6: 1.3,   // Stress Patterns - how you handle their stress
            9: 1.2,   // Communication
            5: 1.1,   // Motivation (what you want for them)
        },
        interpretationFocus: 'nurturing, protection, and developmental support'
    },
    {
        relationshipType: 'family_member',
        primaryLayerWeights: {
            11: 1.4,  // Relational Patterning - family scripts
            10: 1.3,  // Boundaries
            7: 1.2,   // Emotional Regulation
            6: 1.1,   // Stress Patterns
        },
        interpretationFocus: 'loyalty balance, boundary maintenance, and legacy patterns'
    },
    {
        relationshipType: 'friend',
        primaryLayerWeights: {
            10: 1.4,  // Boundaries - how much do you share
            2: 1.3,   // Energy - do friends energize or drain
            9: 1.2,   // Communication
            11: 1.1,  // Relational Patterning
        },
        interpretationFocus: 'reciprocity, openness, and sustainable connection'
    },
    {
        relationshipType: 'colleague_team',
        primaryLayerWeights: {
            8: 1.5,   // Behavioral Rhythm - work style
            12: 1.4,  // Social Role & Influence
            4: 1.3,   // Decision Logic
            9: 1.2,   // Communication
            6: 1.1,   // Stress Patterns
        },
        interpretationFocus: 'collaboration, clarity, and professional effectiveness'
    },
    {
        relationshipType: 'mentor_student',
        primaryLayerWeights: {
            14: 1.5,  // Growth Arc
            9: 1.4,   // Communication
            12: 1.3,  // Social Role
            7: 1.2,   // Emotional attunement
        },
        interpretationFocus: 'development, patience, and knowledge transfer'
    }
];

// ============================================================================
// RELATIONAL PATTERN INTERPRETATIONS
// ============================================================================

interface RelationalInterpretation {
    patternId: string;
    interpretations: Record<RelationshipType, string>;
}

/**
 * How the same pattern shows up differently across relationship types
 */
const RELATIONAL_INTERPRETATIONS: RelationalInterpretation[] = [
    {
        patternId: 'PAT.IND.BOUNDARY_CLARITY',
        interpretations: {
            spouse_partner: 'You maintain definition even in intimacy—this creates trust, but may require deliberate softening in vulnerable moments.',
            parent_child: 'Clear boundaries help your children feel safe—ensure warmth accompanies the structure.',
            family_member: 'Your boundaries protect you from family enmeshment—watch for rigidity becoming distance.',
            friend: 'Friends know where they stand with you—this clarity supports honest, drama-free connection.',
            colleague_team: 'Professional clarity accelerates collaboration—colleagues appreciate knowing what to expect.',
            mentor_student: 'Clear expectations support learning—balance structure with encouragement.'
        }
    },
    {
        patternId: 'PAT.IND.BOUNDARY_POROSITY',
        interpretations: {
            spouse_partner: 'Deep empathy creates profound connection—practice distinguishing their feelings from yours.',
            parent_child: 'You absorb your children\'s emotions easily—build recovery rituals after intense moments.',
            family_member: 'Family demands can overwhelm—prioritize which requests actually need you.',
            friend: 'You give generously in friendships—notice when giving depletes instead of connects.',
            colleague_team: 'Work dynamics affect you deeply—create boundaries around emotional labor.',
            mentor_student: 'You invest heavily in others\' growth—protect your capacity to give.'
        }
    },
    {
        patternId: 'PAT.IND.PRESSURE_WITHDRAWAL',
        interpretations: {
            spouse_partner: 'When overwhelmed, you may go quiet—signal this to your partner before full withdrawal.',
            parent_child: 'Stress may make you less present—name your need for space so children don\'t personalize it.',
            family_member: 'Family pressure can trigger retreat—let key people know you\'ll return.',
            friend: 'Friends may misread silence as disinterest—brief check-ins prevent misunderstanding.',
            colleague_team: 'Workplace stress may lead to isolation—schedule re-engagement to stay connected.',
            mentor_student: 'Overwhelm can pause guidance—communicate unavailability clearly.'
        }
    },
    {
        patternId: 'PAT.IND.PRESSURE_CONTROLLER',
        interpretations: {
            spouse_partner: 'Stress may trigger over-management of shared life—practice releasing control deliberately.',
            parent_child: 'Pressure can make parenting feel micro-managed—trust your children\'s natural problem-solving.',
            family_member: 'You may try to fix family situations—sometimes presence beats solutions.',
            friend: 'Stress can make you directive—practice receiving instead of managing.',
            colleague_team: 'Under pressure, you may over-control team dynamics—delegate to build trust.',
            mentor_student: 'Stress may make teaching feel rigid—allow space for discovery.'
        }
    },
    {
        patternId: 'PAT.IND.INITIATOR_STANCE',
        interpretations: {
            spouse_partner: 'You often start conversations and plans—create space for your partner to initiate too.',
            parent_child: 'You lead family activities naturally—let children propose ideas sometimes.',
            family_member: 'You may be the family connector—ensure others can reach you, not just the reverse.',
            friend: 'You often organize and reach out—notice if reciprocity feels balanced.',
            colleague_team: 'Your initiative drives projects forward—make room for others\' ideas to surface first.',
            mentor_student: 'You guide actively—practice asking before telling.'
        }
    },
    {
        patternId: 'PAT.IND.RESPONDER_STANCE',
        interpretations: {
            spouse_partner: 'You respond well to your partner\'s lead—practice initiating connection sometimes.',
            parent_child: 'You follow your children\'s cues—occasionally take the lead to provide direction.',
            family_member: 'You let family set the pace—own your preferences more clearly.',
            friend: 'You support friends\' ideas—share your own suggestions more freely.',
            colleague_team: 'You refine and support team initiatives—propose before ideas are polished.',
            mentor_student: 'You respond to learner needs—occasionally offer unsolicited guidance.'
        }
    },
    {
        patternId: 'PAT.IND.RELATIONAL_WARMTH',
        interpretations: {
            spouse_partner: 'Deep care is your default—protect your capacity so warmth doesn\'t deplete you.',
            parent_child: 'Your warmth creates emotional safety—ensure you receive care too.',
            family_member: 'You hold family bonds with care—watch for over-responsibility.',
            friend: 'Friends feel held by you—notice if caretaking is one-directional.',
            colleague_team: 'You create psychologically safe teams—balance warmth with task focus.',
            mentor_student: 'Your warmth encourages learners—ensure challenge accompanies support.'
        }
    },
    {
        patternId: 'PAT.IND.SOLITUDE_RECHARGER',
        interpretations: {
            spouse_partner: 'You need solo time to return to relationship fully—communicate this need clearly.',
            parent_child: 'Parenting drains differently—protect small pockets of solitude.',
            family_member: 'Family gatherings may drain you—build in recovery time.',
            friend: 'Quality over quantity in friendship—honor your recharge needs.',
            colleague_team: 'Open offices and constant meetings drain you—protect focus time.',
            mentor_student: 'Teaching gives but also takes—schedule recovery.'
        }
    },
    {
        patternId: 'PAT.IND.PEOPLE_ENERGIZER',
        interpretations: {
            spouse_partner: 'Connection energizes you—ensure your partner has space if they need solitude.',
            parent_child: 'Interaction with children fuels you—be mindful of their need for quiet.',
            family_member: 'Family time lights you up—not everyone shares this energy.',
            friend: 'You thrive in social connection—invest in depth alongside breadth.',
            colleague_team: 'Collaboration energizes your work—make space for deep solo work too.',
            mentor_student: 'Teaching fills you up—notice when learners need processing time alone.'
        }
    }
];

// ============================================================================
// RELATIONAL PRACTICES: "One Relational Practice" per relationship type
// ============================================================================

interface RelationalPractice {
    relationshipType: RelationshipType;
    triggerPatternId: string;
    practice: string;
    duration: string;
    outcome: string;
}

const RELATIONAL_PRACTICES: RelationalPractice[] = [
    // Spouse/Partner practices
    { relationshipType: 'spouse_partner', triggerPatternId: 'PAT.IND.PRESSURE_WITHDRAWAL', practice: 'Before withdrawing, say "I need space and will return in [time]"', duration: '14 days', outcome: 'Reduced partner anxiety during your withdrawal' },
    { relationshipType: 'spouse_partner', triggerPatternId: 'PAT.IND.INITIATOR_STANCE', practice: 'Once this week, wait for your partner to propose an activity first', duration: '7 days', outcome: 'More balanced initiation in the relationship' },
    { relationshipType: 'spouse_partner', triggerPatternId: 'PAT.IND.BOUNDARY_POROSITY', practice: 'After an emotional conversation, take 10 minutes alone before continuing', duration: '14 days', outcome: 'Clearer sense of where you end and partner begins' },

    // Parent/Child practices
    { relationshipType: 'parent_child', triggerPatternId: 'PAT.IND.PRESSURE_CONTROLLER', practice: 'When your child faces a problem, wait 60 seconds before offering solutions', duration: '21 days', outcome: 'Increased child problem-solving confidence' },
    { relationshipType: 'parent_child', triggerPatternId: 'PAT.IND.SOLITUDE_RECHARGER', practice: 'Schedule one 20-minute alone time daily, even if hidden in the schedule', duration: '14 days', outcome: 'More patient, present parenting' },

    // Colleague/Team practices
    { relationshipType: 'colleague_team', triggerPatternId: 'PAT.IND.INITIATOR_STANCE', practice: 'In the next team meeting, ask "What do others think?" before sharing your view', duration: '14 days', outcome: 'More diverse ideas surfacing' },
    { relationshipType: 'colleague_team', triggerPatternId: 'PAT.IND.PRESSURE_CONTROLLER', practice: 'Delegate one decision fully this week with no check-ins', duration: '7 days', outcome: 'Increased team ownership' },

    // Friend practices
    { relationshipType: 'friend', triggerPatternId: 'PAT.IND.RELATIONAL_WARMTH', practice: 'In your next friend conversation, receive for 5 minutes before giving', duration: '14 days', outcome: 'More reciprocal friendships' },
    { relationshipType: 'friend', triggerPatternId: 'PAT.IND.RESPONDER_STANCE', practice: 'Initiate plans with one friend you usually respond to', duration: '7 days', outcome: 'More balanced initiative' }
];

// ============================================================================
// CONNECTOR PROFILE STRUCTURE
// ============================================================================

export interface RelationalConnectorInsight {
    relationshipType: RelationshipType;
    displayName: string;
    interpretationFocus: string;
    primaryPatterns: {
        patternName: string;
        interpretation: string;
    }[];
    suggestedPractice?: {
        practice: string;
        duration: string;
        outcome: string;
    };
}

export interface RelationalConnectorsProfile {
    userId: string;
    generatedAt: string;
    snapshotId: string;
    connectorInsights: RelationalConnectorInsight[];
    primaryRelationshipFocus?: RelationshipType;
}

// ============================================================================
// GENERATOR CLASS
// ============================================================================

class RelationalConnectorsGenerator {
    /**
     * Generate the complete Relational Connectors Profile
     */
    generate(
        userId: string,
        snapshotId: string,
        claims: Claim[],
        patterns: Pattern[],
        themes: Theme[],
        focusRelationshipTypes?: RelationshipType[]
    ): RelationalConnectorsProfile {
        const insights: RelationalConnectorInsight[] = [];

        // Generate for specified types or all types
        const typesToGenerate = focusRelationshipTypes ||
            RELATIONSHIP_LENSES.map(l => l.relationshipType);

        for (const relType of typesToGenerate) {
            const insight = this.generateConnectorInsight(relType, patterns);
            insights.push(insight);
        }

        return {
            userId,
            generatedAt: new Date().toISOString(),
            snapshotId,
            connectorInsights: insights,
            primaryRelationshipFocus: focusRelationshipTypes?.[0]
        };
    }

    /**
     * Generate insight for a single relationship type
     */
    private generateConnectorInsight(
        relationshipType: RelationshipType,
        patterns: Pattern[]
    ): RelationalConnectorInsight {
        const lens = RELATIONSHIP_LENSES.find(l => l.relationshipType === relationshipType)!;

        // Find patterns that have interpretations for this relationship type
        const relevantPatterns = patterns.filter(p =>
            RELATIONAL_INTERPRETATIONS.some(ri => ri.patternId === p.patternId)
        );

        // Get weighted interpretations
        const patternInterpretations = relevantPatterns.map(p => {
            const interpretation = RELATIONAL_INTERPRETATIONS.find(
                ri => ri.patternId === p.patternId
            );

            return {
                patternName: p.name,
                interpretation: interpretation?.interpretations[relationshipType] || p.oneLiner
            };
        });

        // Find suggested practice
        const practice = this.findRelationalPractice(relationshipType, relevantPatterns);

        return {
            relationshipType,
            displayName: this.getDisplayName(relationshipType),
            interpretationFocus: lens.interpretationFocus,
            primaryPatterns: patternInterpretations.slice(0, 4),
            suggestedPractice: practice
        };
    }

    /**
     * Find the most relevant practice for this relationship type
     */
    private findRelationalPractice(
        relationshipType: RelationshipType,
        patterns: Pattern[]
    ): { practice: string; duration: string; outcome: string } | undefined {
        const patternIds = patterns.map(p => p.patternId);

        for (const rp of RELATIONAL_PRACTICES) {
            if (rp.relationshipType === relationshipType &&
                patternIds.includes(rp.triggerPatternId)) {
                return {
                    practice: rp.practice,
                    duration: rp.duration,
                    outcome: rp.outcome
                };
            }
        }

        // Return the first practice for this relationship type as fallback
        const fallback = RELATIONAL_PRACTICES.find(
            rp => rp.relationshipType === relationshipType
        );

        return fallback ? {
            practice: fallback.practice,
            duration: fallback.duration,
            outcome: fallback.outcome
        } : undefined;
    }

    /**
     * Get display name for relationship type
     */
    private getDisplayName(type: RelationshipType): string {
        const names: Record<RelationshipType, string> = {
            spouse_partner: 'Spouse / Partner',
            parent_child: 'Parent / Child',
            family_member: 'Family Member',
            friend: 'Friend',
            colleague_team: 'Colleague / Team',
            mentor_student: 'Mentor / Student'
        };
        return names[type];
    }

    /**
     * Render profile to markdown
     */
    renderToMarkdown(profile: RelationalConnectorsProfile): string {
        let md = `# Relational Connectors Profile\n\n`;
        md += `*Generated: ${new Date(profile.generatedAt).toLocaleDateString()}*\n\n`;
        md += `This profile shows how your patterns express differently across relationship contexts.\n\n`;
        md += `---\n\n`;

        for (const insight of profile.connectorInsights) {
            md += `## ${insight.displayName}\n\n`;
            md += `**Focus:** ${insight.interpretationFocus}\n\n`;

            if (insight.primaryPatterns.length > 0) {
                md += `### How Your Patterns Show Up\n\n`;
                insight.primaryPatterns.forEach(pp => {
                    md += `**${pp.patternName}:** ${pp.interpretation}\n\n`;
                });
            }

            if (insight.suggestedPractice) {
                md += `### One Relational Practice (${insight.suggestedPractice.duration})\n\n`;
                md += `${insight.suggestedPractice.practice}\n\n`;
                md += `*Expected outcome: ${insight.suggestedPractice.outcome}*\n\n`;
            }

            md += `---\n\n`;
        }

        return md;
    }
}

export const relationalConnectorsGenerator = new RelationalConnectorsGenerator();
