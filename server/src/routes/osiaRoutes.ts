/**
 * OSIA API Routes
 * 
 * Exposes OSIA intelligence endpoints for frontend consumption.
 */

import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { osiaIntelligenceService } from '../services/OSIAIntelligenceService';
import { osiaSnapshotStore } from '../services/OSIASnapshotStore';
import { osiaAuditLogger } from '../services/OSIAAuditLogger';
import { claimEngine, Signal } from '../services/ClaimEngine';
import { RelationshipType } from '../types/osia-types';
import { originSeedService } from '../services/OriginSeedService';

const router = express.Router();

// ============================================================================
// GENERATE COMPLETE OSIA OUTPUT
// ============================================================================

router.post('/generate', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { signals, source = 'api', includeRelationalConnectors = false, focusRelationshipTypes } = req.body;

        if (!signals || !Array.isArray(signals)) {
            return res.status(400).json({ error: 'Signals array is required' });
        }

        const output = await osiaIntelligenceService.processSignals(
            userId,
            signals as Signal[],
            source,
            {
                includeRelationalConnectors,
                focusRelationshipTypes: focusRelationshipTypes as RelationshipType[]
            }
        );

        await osiaAuditLogger.log('osia_output_generated', userId, output.snapshot.snapshotId, {
            claimCount: output.metadata.claimCount,
            patternCount: output.metadata.patternCount
        });

        res.json(output);
    } catch (error: any) {
        console.error('[OSIA] Generate error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// REGENERATE FROM EXISTING PROFILE
// ============================================================================

router.post('/regenerate', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;

        // Get existing profile data (traits from onboarding)
        const profile = await originSeedService.getProfile(userId);

        if (!profile || !profile.traits || profile.traits.length === 0) {
            return res.status(400).json({
                error: 'No profile data found. Please complete onboarding first.'
            });
        }

        // Convert traits to OSIA signals format
        const osiaSignals: Signal[] = profile.traits.map((trait: any, index: number) => ({
            signalId: `SIG.REGEN.${userId}.${index}`,
            userId,
            questionId: `TRAIT.${trait.traitId}`,
            layerIds: [trait.layerId],
            rawValue: trait.description || `Trait ${trait.traitId}`,
            normalizedValue: trait.description || `Trait ${trait.traitId}`,
            timestamp: new Date().toISOString(),
            source: 'onboarding' as const
        }));

        // Process signals through OSIA intelligence service
        const output = await osiaIntelligenceService.processSignals(
            userId,
            osiaSignals,
            'regeneration',
            { includeRelationalConnectors: true }
        );

        await osiaAuditLogger.log('osia_output_generated', userId, output.snapshot.snapshotId, {
            claimCount: output.metadata.claimCount,
            patternCount: output.metadata.patternCount,
            source: 'regeneration'
        });

        res.json({
            success: true,
            message: 'OSIA output regenerated successfully',
            output
        });
    } catch (error: any) {
        console.error('[OSIA] Regenerate error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET LATEST OUTPUT
// ============================================================================

router.get('/latest', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const output = await osiaIntelligenceService.getLatestOutput(userId);

        if (!output) {
            return res.status(404).json({ error: 'No OSIA output found for user' });
        }

        res.json(output);
    } catch (error: any) {
        console.error('[OSIA] Latest output error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET PERSONALITY THESIS
// ============================================================================

router.get('/thesis', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const output = await osiaIntelligenceService.getLatestOutput(userId);

        if (!output) {
            return res.status(404).json({ error: 'No thesis found' });
        }

        const { format } = req.query;

        if (format === 'markdown') {
            const markdown = osiaIntelligenceService.renderToMarkdown(output);
            res.json({ markdown: markdown.thesis });
        } else {
            res.json(output.modules.personalityThesis);
        }
    } catch (error: any) {
        console.error('[OSIA] Thesis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET CORE INSIGHTS HUB
// ============================================================================

router.get('/insights', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const output = await osiaIntelligenceService.getLatestOutput(userId);

        if (!output) {
            return res.status(404).json({ error: 'No insights found' });
        }

        const { format } = req.query;

        if (format === 'markdown') {
            const markdown = osiaIntelligenceService.renderToMarkdown(output);
            res.json({ markdown: markdown.insightsHub });
        } else {
            res.json(output.modules.coreInsightsHub);
        }
    } catch (error: any) {
        console.error('[OSIA] Insights error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET RELATIONAL CONNECTORS
// ============================================================================

router.get('/connectors', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { types } = req.query;

        // Get latest snapshot
        const snapshot = await osiaSnapshotStore.getLatestSnapshot(userId);
        if (!snapshot) {
            return res.status(404).json({ error: 'No snapshot found' });
        }

        // Generate connectors with optional type focus
        const { relationalConnectorsGenerator } = require('../services/RelationalConnectorsGenerator');

        const focusTypes = types
            ? (types as string).split(',') as RelationshipType[]
            : undefined;

        const profile = relationalConnectorsGenerator.generate(
            userId,
            snapshot.snapshotId,
            [...snapshot.claims],
            [...snapshot.patterns],
            [...snapshot.themes],
            focusTypes
        );

        const { format } = req.query;

        if (format === 'markdown') {
            res.json({ markdown: relationalConnectorsGenerator.renderToMarkdown(profile) });
        } else {
            res.json(profile);
        }
    } catch (error: any) {
        console.error('[OSIA] Connectors error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// SUBMIT CLAIM FEEDBACK (Resonance Voting)
// ============================================================================

router.post('/feedback', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { claimId, resonance, contextTags } = req.body;

        if (!claimId || !resonance) {
            return res.status(400).json({ error: 'claimId and resonance are required' });
        }

        if (!['fits', 'partial', 'doesnt_fit'].includes(resonance)) {
            return res.status(400).json({ error: 'resonance must be: fits, partial, or doesnt_fit' });
        }

        await osiaIntelligenceService.recordClaimFeedback(
            userId,
            claimId,
            resonance,
            contextTags
        );

        await osiaAuditLogger.log('claim_feedback', userId, claimId, { resonance });

        res.json({ success: true, message: 'Feedback recorded' });
    } catch (error: any) {
        console.error('[OSIA] Feedback error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET SNAPSHOT HISTORY
// ============================================================================

router.get('/history', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const limit = parseInt(req.query.limit as string) || 10;

        const history = await osiaIntelligenceService.getSnapshotHistory(userId, limit);

        res.json(history);
    } catch (error: any) {
        console.error('[OSIA] History error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// COMPARE SNAPSHOTS
// ============================================================================

router.get('/compare', authMiddleware, async (req: any, res: any) => {
    try {
        const { older, newer } = req.query;

        if (!older || !newer) {
            return res.status(400).json({ error: 'older and newer snapshot IDs required' });
        }

        const comparison = await osiaIntelligenceService.compareSnapshots(
            older as string,
            newer as string
        );

        res.json(comparison);
    } catch (error: any) {
        console.error('[OSIA] Compare error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
