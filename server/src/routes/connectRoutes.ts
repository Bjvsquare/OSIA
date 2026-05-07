import express from 'express';
import { connectionService } from '../services/ConnectionService';
import { synastryService } from '../services/SynastryService';
import { insightNotificationService } from '../services/InsightNotificationService';
import { auditLogger } from '../services/AuditLogger';
import { authMiddleware } from '../middleware/authMiddleware';
import { logger, logAuthEvent } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/connect/search?q=query
 */
router.get('/search', authMiddleware, async (req: any, res: any) => {
    try {
        const query = req.query.q as string;
        const currentUserId = req.user.id || req.user.userId;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter q is required' });
        }

        logAuthEvent('connect_search', currentUserId, { query });

        const results = await connectionService.searchUsers(query, currentUserId);
        res.json(results);
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id, query: req.query?.q }, 'Connect search failed');
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

/**
 * GET /api/connect/list
 * Get accepted connections
 */
router.get('/list', authMiddleware, async (req: any, res: any) => {
    try {
        const currentUserId = req.user.id || req.user.userId;
        const connections = await connectionService.getConnections(currentUserId);
        res.json(connections);
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Connection list failed');
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

/**
 * GET /api/connect/requests
 * Get pending incoming requests
 */
router.get('/requests', authMiddleware, async (req: any, res: any) => {
    try {
        const currentUserId = req.user.id || req.user.userId;
        const requests = await connectionService.getPendingRequests(currentUserId);
        res.json(requests);
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Get pending requests failed');
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

/**
 * GET /api/connect/synastry/:targetUserId
 * Calculate synastry between current user and another
 */
router.get('/synastry/:targetUserId', authMiddleware, async (req: any, res: any) => {
    try {
        const currentUserId = req.user.id || req.user.userId;
        const targetUserId = req.params.targetUserId;

        const result = await synastryService.calculateSynastry(currentUserId, targetUserId);
        res.json(result);
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Synastry calculation error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/connect/request
 * Send a connection request
 */
router.post('/request', authMiddleware, async (req: any, res: any) => {
    try {
        const fromUserId = req.user.id || req.user.userId;
        const { toUserId, type } = req.body;

        if (!toUserId || !type) {
            return res.status(400).json({ error: 'Missing toUserId or type' });
        }

        const requestId = await connectionService.sendRequest(fromUserId, toUserId, type);

        await auditLogger.log({
            userId: fromUserId,
            username: req.user.username,
            action: 'send_connection_request',
            status: 'success',
            details: { toUserId, type, requestId }
        });

        res.json({ message: 'Request sent successfully', requestId });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Send request error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/connect/remove/:targetUserId
 * Remove a connection
 */
router.delete('/remove/:targetUserId', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { targetUserId } = req.params;

        await connectionService.removeConnection(userId, targetUserId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'remove_connection',
            status: 'success',
            details: { targetUserId }
        });

        res.json({ message: 'Connection removed successfully' });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Remove connection error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/connect/respond
 * Accept or Reject a request
 */
router.post('/respond', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { requestId, action, type } = req.body; // action: 'accept' | 'reject'

        if (!requestId || !action) {
            return res.status(400).json({ error: 'Missing requestId or action' });
        }

        await connectionService.respondToRequest(requestId, userId, action, type);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: `respond_connection_request_${action}`,
            status: 'success',
            details: { requestId, type }
        });

        res.json({ message: `Request ${action}ed successfully` });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Respond request error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/connect/share-insight
 * Share an insight with a connected user
 */
router.post('/share-insight', authMiddleware, async (req: any, res: any) => {
    try {
        const fromUserId = req.user.id || req.user.userId;
        const fromUsername = req.user.username;
        const { toUserId, insightType, title, content, affectedLayers, category } = req.body;

        if (!toUserId || !title || !content) {
            return res.status(400).json({ error: 'Missing required fields: toUserId, title, content' });
        }

        const notification = await insightNotificationService.shareInsight(
            fromUserId,
            fromUsername,
            { toUserId, insightType, title, content, affectedLayers: affectedLayers || [], category }
        );

        await auditLogger.log({
            userId: fromUserId,
            username: fromUsername,
            action: 'share_insight',
            status: 'success',
            details: { toUserId, title, insightType }
        });

        res.json({ message: 'Insight shared successfully', notification });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Share insight error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/connect/shared-insights
 * Get received insight notifications
 */
router.get('/shared-insights', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const insights = await insightNotificationService.getReceivedInsights(userId);
        const unreadCount = await insightNotificationService.getUnreadCount(userId);
        res.json({ insights, unreadCount });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Get shared insights error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/connect/shared-insights/:id/read
 * Mark an insight notification as read
 */
router.patch('/shared-insights/:id/read', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const notificationId = req.params.id;
        await insightNotificationService.markAsRead(notificationId, userId);
        res.json({ message: 'Marked as read' });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Mark insight read error:');
        res.status(500).json({ error: error.message });
    }
});

/* ═══════════════════════════════════════════════════════════════
   Connection Type Change — Mutual Approval
   ═══════════════════════════════════════════════════════════════ */

/**
 * POST /api/connect/propose-type-change
 * Propose changing a connection type (requires other user's approval)
 */
router.post('/propose-type-change', authMiddleware, async (req: any, res: any) => {
    try {
        const fromUserId = req.user.id || req.user.userId;
        const { targetUserId, proposedType, proposedSubType } = req.body;

        if (!targetUserId || !proposedType) {
            return res.status(400).json({ error: 'Missing targetUserId or proposedType' });
        }

        const requestId = await connectionService.proposeTypeChange(
            fromUserId,
            targetUserId,
            proposedType,
            proposedSubType
        );

        await auditLogger.log({
            userId: fromUserId,
            username: req.user.username,
            action: 'propose_type_change',
            status: 'success',
            details: { targetUserId, proposedType, proposedSubType, requestId }
        });

        res.json({ message: 'Type change proposed', requestId });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Propose type change error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/connect/type-change-requests
 * Get pending incoming type change proposals + all history
 */
router.get('/type-change-requests', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const pending = await connectionService.getPendingTypeChanges(userId);
        const all = await connectionService.getAllTypeChangeRequests(userId);
        res.json({ pending, all });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Get type change requests error:');
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/connect/respond-type-change
 * Approve or reject a type change proposal
 */
router.post('/respond-type-change', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { requestId, action } = req.body;

        if (!requestId || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Missing requestId or invalid action (approve/reject)' });
        }

        const result = await connectionService.respondToTypeChange(requestId, userId, action);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: `respond_type_change_${action}`,
            status: 'success',
            details: { requestId, proposedType: result.proposedType, currentType: result.currentType }
        });

        res.json({ message: `Type change ${action}d`, request: result });
    } catch (error: any) {
        logger.error({ error, userId: (req as any).user?.id }, 'Respond type change error:');
        res.status(500).json({ error: error.message });
    }
});

export default router;

