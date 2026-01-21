import { Router } from 'express';
import { protocolService } from '../services/ProtocolService';
import { protocolRecommendationService } from '../services/ProtocolRecommendationService';
import { authMiddleware } from '../middleware/authMiddleware';
import { auditLogger } from '../services/AuditLogger';
import { journeyService } from '../services/JourneyService';

const router = Router();

// Get OSIA-personalized protocol recommendations
router.get('/recommended', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const recommendations = await protocolRecommendationService.getRecommendations(userId);
        res.json(recommendations);
    } catch (error: any) {
        console.error('[Protocols] Recommendation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active protocols for current user
router.get('/active', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const protocols = await protocolService.getActiveProtocols(userId);
        res.json(protocols);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get protocol history
router.get('/history', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const protocols = await protocolService.getProtocolHistory(userId);
        res.json(protocols);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get protocol stats
router.get('/stats', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const stats = await protocolService.getProtocolStats(userId);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific protocol
router.get('/:id', authMiddleware, async (req: any, res: any) => {
    try {
        const protocol = await protocolService.getProtocol(req.params.id);
        if (!protocol) {
            return res.status(404).json({ error: 'Protocol not found' });
        }
        res.json(protocol);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create new protocol
router.post('/', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const protocol = await protocolService.createProtocol(userId, req.body);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'create_protocol',
            status: 'success',
            details: { protocolId: protocol.id, type: protocol.type }
        });

        res.status(201).json(protocol);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Complete a protocol step
router.post('/:id/complete', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { notes, blueprintImpact } = req.body;

        const completion = await protocolService.completeProtocolStep(
            userId,
            req.params.id,
            notes,
            blueprintImpact
        );

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'complete_protocol_step',
            status: 'success',
            details: { protocolId: req.params.id, completionId: completion.id }
        });

        // Log activity for journey credits
        try {
            await journeyService.logActivity(userId, 'protocol_completion', { protocolId: req.params.id });
        } catch (e) { /* Ignore journey errors */ }

        res.json(completion);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Pause protocol
router.post('/:id/pause', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await protocolService.pauseProtocol(userId, req.params.id);
        res.json({ success: true, message: 'Protocol paused' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Resume protocol
router.post('/:id/resume', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await protocolService.resumeProtocol(userId, req.params.id);
        res.json({ success: true, message: 'Protocol resumed' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Archive protocol
router.post('/:id/archive', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await protocolService.archiveProtocol(userId, req.params.id);
        res.json({ success: true, message: 'Protocol archived' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete protocol
router.delete('/:id', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await protocolService.deleteProtocol(userId, req.params.id);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'delete_protocol',
            status: 'success',
            details: { protocolId: req.params.id }
        });

        res.json({ success: true, message: 'Protocol deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== RECALIBRATION ENDPOINTS =====
import { recalibrationService } from '../services/RecalibrationService';

// Start a new recalibration session for a protocol type
router.post('/recalibration/start', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { protocolType } = req.body;

        const session = await recalibrationService.createSession(userId, protocolType || 'reflection');

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'start_recalibration',
            status: 'success',
            details: { sessionId: session.id, protocolType }
        });

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Submit a response to a recalibration question
router.post('/recalibration/:sessionId/respond', authMiddleware, async (req: any, res: any) => {
    try {
        const { questionId, value } = req.body;

        if (!questionId || typeof value !== 'number' || value < 1 || value > 4) {
            return res.status(400).json({ error: 'Valid questionId and value (1-4) required' });
        }

        const result = await recalibrationService.submitResponse(req.params.sessionId, questionId, value);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Complete a recalibration session
router.post('/recalibration/:sessionId/complete', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const session = await recalibrationService.completeSession(req.params.sessionId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'complete_recalibration',
            status: 'success',
            details: { sessionId: session.id }
        });

        // Log activity for journey credits
        try {
            await journeyService.logActivity(userId, 'recalibration_complete', { sessionId: session.id });
        } catch (e) { /* Ignore journey errors */ }

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Blueprint history for trend analysis
router.get('/blueprint/history', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const limit = parseInt(req.query.limit as string) || 10;
        const history = await recalibrationService.getBlueprintHistory(userId, limit);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get trait trends
router.get('/blueprint/trends', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const traitId = req.query.trait as string;
        const trends = await recalibrationService.getTraitTrends(userId, traitId);
        res.json(trends);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

