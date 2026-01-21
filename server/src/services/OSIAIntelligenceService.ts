/**
 * OSIA Intelligence Service — v1.0
 * 
 * Unified orchestrator for the complete OSIA intelligence pipeline:
 * 
 * Signal → Claims → Patterns → Themes → Modules (Thesis, Insights, Connectors)
 * 
 * This service:
 * 1. Coordinates all engines (Claim, Pattern, Theme)
 * 2. Generates all modules (Thesis, Insights Hub, Connectors)
 * 3. Manages immutable snapshots
 * 4. Provides the public API for the OSIA system
 */

import { randomUUID } from 'crypto';

// Import engines
import { claimEngine, Signal } from './ClaimEngine';
import { patternEngine } from './PatternEngine';
import { themeEngine } from './ThemeEngine';

// Import generators (fallback)
import { personalityThesisGenerator, PersonalityThesis } from './PersonalityThesisGenerator';
import { coreInsightsHubGenerator, CoreInsightsHub } from './CoreInsightsHubGenerator';
import { relationalConnectorsGenerator, RelationalConnectorsProfile } from './RelationalConnectorsGenerator';

// Import AI service
import { aiIntelligenceService } from './AIIntelligenceService';

// Import blueprint service for context
import { blueprintService } from './BlueprintService';

// Import storage and audit
import { osiaSnapshotStore } from './OSIASnapshotStore';
import { osiaAuditLogger } from './OSIAAuditLogger';

// Import types
import {
    Claim,
    Pattern,
    Theme,
    OSIABlueprintSnapshot,
    SnapshotSource,
    RelationshipType
} from '../types/osia-types';

// Import JSON storage for modules
import { db } from '../db/JsonDb';

// Type for stored modules
interface StoredModules {
    snapshotId: string;
    userId: string;
    personalityThesis: PersonalityThesis;
    coreInsightsHub: CoreInsightsHub;
    relationalConnectors?: RelationalConnectorsProfile;
    generatedAt: string;
    aiGenerated: boolean;
}


// ============================================================================
// COMPLETE OSIA OUTPUT STRUCTURE
// ============================================================================

export interface OSIACompleteOutput {
    snapshot: OSIABlueprintSnapshot;
    modules: {
        personalityThesis: PersonalityThesis;
        coreInsightsHub: CoreInsightsHub;
        relationalConnectors?: RelationalConnectorsProfile;
    };
    metadata: {
        generatedAt: string;
        processingTimeMs: number;
        claimCount: number;
        patternCount: number;
        themeCount: number;
        stabilityIndex: number;
    };
}

// ============================================================================
// OSIA INTELLIGENCE SERVICE
// ============================================================================

class OSIAIntelligenceService {
    /**
     * Process signals and generate a complete OSIA output.
     * This is the main entry point for the intelligence pipeline.
     */
    async processSignals(
        userId: string,
        signals: Signal[],
        source: SnapshotSource,
        options?: {
            includeRelationalConnectors?: boolean;
            focusRelationshipTypes?: RelationshipType[];
            signalSnapshotId?: string;
        }
    ): Promise<OSIACompleteOutput> {
        const startTime = Date.now();

        // Step 1: Generate Claims from Signals
        const claims = claimEngine.generateClaimsFromSignals(signals);
        console.log(`[OSIA] Generated ${claims.length} claims from ${signals.length} signals`);

        // Log claim creation
        for (const claim of claims) {
            await osiaAuditLogger.log('claim_created', userId, claim.claimId, {
                layerId: claim.layerId,
                polarity: claim.polarity
            });
        }

        // Step 2: Detect Patterns from Claims
        const patterns = patternEngine.detectPatterns(claims, userId);
        console.log(`[OSIA] Detected ${patterns.length} patterns`);

        // Log pattern promotion
        for (const pattern of patterns) {
            await osiaAuditLogger.log('pattern_promoted', userId, pattern.patternId, {
                stabilityIndex: pattern.stabilityIndex,
                supportingClaimCount: pattern.supportingClaimIds.length
            });
        }

        // Step 3: Detect Themes from Patterns
        const themes = themeEngine.detectThemes(patterns, userId);
        console.log(`[OSIA] Detected ${themes.length} themes`);

        // Log theme detection
        for (const theme of themes) {
            await osiaAuditLogger.log('theme_detected', userId, theme.themeId, {
                priority: theme.priority,
                supportingPatternCount: theme.supportingPatternIds.length
            });
        }

        // Step 4: Create immutable snapshot
        const snapshot = await osiaSnapshotStore.createSnapshot(
            userId,
            source,
            claims,
            patterns,
            themes,
            options?.signalSnapshotId
        );

        // Step 5: Fetch blueprint and traits for AI context
        const blueprint = await blueprintService.getLatestSignal(userId);
        const latestSnapshot = await blueprintService.getLatestSnapshot(userId);
        const traits = latestSnapshot?.traits || [];

        // Step 6: Generate Modules (AI with fallback to templates)
        let personalityThesis: PersonalityThesis;
        let coreInsightsHub: CoreInsightsHub;
        let relationalConnectors: RelationalConnectorsProfile | undefined;

        if (aiIntelligenceService.isAvailable()) {
            console.log('[OSIA] Using AI-powered generation...');

            // Generate all modules in parallel
            const [aiThesis, aiInsights, aiConnectors] = await Promise.all([
                aiIntelligenceService.generatePersonalityThesis(
                    userId,
                    snapshot.snapshotId,
                    blueprint,
                    traits,
                    claims,
                    patterns,
                    themes
                ),
                aiIntelligenceService.generateCoreInsightsHub(
                    userId,
                    snapshot.snapshotId,
                    blueprint,
                    traits,
                    claims,
                    patterns,
                    themes
                ),
                options?.includeRelationalConnectors
                    ? aiIntelligenceService.generateRelationalConnectors(
                        userId,
                        snapshot.snapshotId,
                        blueprint,
                        traits,
                        claims,
                        patterns,
                        themes
                    )
                    : Promise.resolve(null)
            ]);

            personalityThesis = aiThesis || personalityThesisGenerator.generate(
                userId,
                snapshot.snapshotId,
                claims,
                patterns,
                themes
            );

            coreInsightsHub = aiInsights || coreInsightsHubGenerator.generate(
                userId,
                snapshot.snapshotId,
                claims,
                patterns,
                themes
            );

            if (options?.includeRelationalConnectors) {
                relationalConnectors = (aiConnectors as RelationalConnectorsProfile) || relationalConnectorsGenerator.generate(
                    userId,
                    snapshot.snapshotId,
                    claims,
                    patterns,
                    themes,
                    options.focusRelationshipTypes
                );
            }
        } else {
            console.log('[OSIA] Using template-based generation (AI not configured)...');

            // Fallback to template generators
            personalityThesis = personalityThesisGenerator.generate(
                userId,
                snapshot.snapshotId,
                claims,
                patterns,
                themes
            );

            coreInsightsHub = coreInsightsHubGenerator.generate(
                userId,
                snapshot.snapshotId,
                claims,
                patterns,
                themes
            );

            if (options?.includeRelationalConnectors) {
                relationalConnectors = relationalConnectorsGenerator.generate(
                    userId,
                    snapshot.snapshotId,
                    claims,
                    patterns,
                    themes,
                    options.focusRelationshipTypes
                );
            }
        }

        await osiaAuditLogger.log('module_generated', userId, 'personality_thesis', {
            snapshotId: snapshot.snapshotId,
            wordCount: personalityThesis.totalWordCount,
            aiGenerated: aiIntelligenceService.isAvailable()
        });

        await osiaAuditLogger.log('module_generated', userId, 'core_insights_hub', {
            snapshotId: snapshot.snapshotId,
            coverageScore: coreInsightsHub.coverageScore,
            aiGenerated: aiIntelligenceService.isAvailable()
        });

        if (relationalConnectors) {
            await osiaAuditLogger.log('module_generated', userId, 'relational_connectors', {
                snapshotId: snapshot.snapshotId,
                insightCount: relationalConnectors.connectorInsights.length,
                aiGenerated: aiIntelligenceService.isAvailable()
            });
        }

        // Calculate stability index
        const stabilityIndex = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.stabilityIndex, 0) / patterns.length
            : 0;

        const processingTimeMs = Date.now() - startTime;
        console.log(`[OSIA] Complete processing finished in ${processingTimeMs}ms`);

        // Store generated modules for later retrieval
        try {
            const allModules = await db.getCollection<StoredModules>('osia_modules');
            // Remove any existing modules for this user
            const filtered = allModules.filter(m => m.userId !== userId);
            // Add new modules
            filtered.push({
                snapshotId: snapshot.snapshotId,
                userId,
                personalityThesis,
                coreInsightsHub,
                relationalConnectors,
                generatedAt: new Date().toISOString(),
                aiGenerated: aiIntelligenceService.isAvailable()
            });
            await db.saveCollection('osia_modules', filtered);
            console.log(`[OSIA] Stored modules for user ${userId}`);
        } catch (e: any) {
            console.error('[OSIA] Failed to store modules:', e.message);
        }

        return {
            snapshot,
            modules: {
                personalityThesis,
                coreInsightsHub,
                relationalConnectors
            },
            metadata: {
                generatedAt: new Date().toISOString(),
                processingTimeMs,
                claimCount: claims.length,
                patternCount: patterns.length,
                themeCount: themes.length,
                stabilityIndex: Math.round(stabilityIndex * 100) / 100
            }
        };
    }


    /**
     * Get the latest OSIA output for a user.
     * First checks for stored AI-generated modules, falls back to template generation.
     */
    async getLatestOutput(userId: string): Promise<OSIACompleteOutput | null> {
        const snapshot = await osiaSnapshotStore.getLatestSnapshot(userId);
        if (!snapshot) return null;

        const claims = [...snapshot.claims];
        const patterns = [...snapshot.patterns];
        const themes = [...snapshot.themes];

        // Try to get stored AI-generated modules first
        try {
            const allModules = await db.getCollection<StoredModules>('osia_modules');
            const storedModules = allModules.find(m => m.userId === userId);

            if (storedModules && storedModules.aiGenerated) {
                console.log(`[OSIA] Using stored AI-generated modules for user ${userId}`);

                const stabilityIndex = patterns.length > 0
                    ? patterns.reduce((sum, p) => sum + p.stabilityIndex, 0) / patterns.length
                    : 0;

                return {
                    snapshot,
                    modules: {
                        personalityThesis: storedModules.personalityThesis,
                        coreInsightsHub: storedModules.coreInsightsHub,
                        relationalConnectors: storedModules.relationalConnectors
                    },
                    metadata: {
                        generatedAt: storedModules.generatedAt,
                        processingTimeMs: 0,
                        claimCount: claims.length,
                        patternCount: patterns.length,
                        themeCount: themes.length,
                        stabilityIndex: Math.round(stabilityIndex * 100) / 100
                    }
                };
            }
        } catch (e: any) {
            console.log('[OSIA] No stored modules found, using template generation');
        }

        // Fallback to template generation
        console.log(`[OSIA] Using template generation for user ${userId}`);

        const personalityThesis = personalityThesisGenerator.generate(
            userId,
            snapshot.snapshotId,
            claims,
            patterns,
            themes
        );

        const coreInsightsHub = coreInsightsHubGenerator.generate(
            userId,
            snapshot.snapshotId,
            claims,
            patterns,
            themes
        );

        const stabilityIndex = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.stabilityIndex, 0) / patterns.length
            : 0;

        return {
            snapshot,
            modules: {
                personalityThesis,
                coreInsightsHub
            },
            metadata: {
                generatedAt: snapshot.timestamp,
                processingTimeMs: 0,
                claimCount: claims.length,
                patternCount: patterns.length,
                themeCount: themes.length,
                stabilityIndex: Math.round(stabilityIndex * 100) / 100
            }
        };
    }


    /**
     * Record user feedback on a claim (refinement action)
     */
    async recordClaimFeedback(
        userId: string,
        claimId: string,
        resonance: 'fits' | 'partial' | 'doesnt_fit',
        contextTags?: string[]
    ): Promise<void> {
        await osiaSnapshotStore.recordClaimFeedback(userId, claimId, resonance, contextTags);
    }

    /**
     * Compare two snapshots to see evolution
     */
    async compareSnapshots(olderSnapshotId: string, newerSnapshotId: string) {
        return osiaSnapshotStore.compareSnapshots(olderSnapshotId, newerSnapshotId);
    }

    /**
     * Get snapshot history for a user
     */
    async getSnapshotHistory(userId: string, limit: number = 10) {
        return osiaSnapshotStore.getSnapshotHistory(userId, limit);
    }

    /**
     * Render all modules to markdown for display
     */
    renderToMarkdown(output: OSIACompleteOutput): {
        thesis: string;
        insightsHub: string;
        connectors?: string;
    } {
        return {
            thesis: personalityThesisGenerator.renderToMarkdown(output.modules.personalityThesis),
            insightsHub: coreInsightsHubGenerator.renderToMarkdown(output.modules.coreInsightsHub),
            connectors: output.modules.relationalConnectors
                ? relationalConnectorsGenerator.renderToMarkdown(output.modules.relationalConnectors)
                : undefined
        };
    }
}

export const osiaIntelligenceService = new OSIAIntelligenceService();
