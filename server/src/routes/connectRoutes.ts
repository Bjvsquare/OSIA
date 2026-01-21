import express from 'express';
import { connectionService } from '../services/ConnectionService';
import { synastryService } from '../services/SynastryService';
import { insightNotificationService } from '../services/InsightNotificationService';
import { auditLogger } from '../services/AuditLogger';
import { authMiddleware } from '../middleware/authMiddleware';
import fs from 'fs';
import path from 'path';

console.log(`[ConnectRoute] LOADER: connectRoutes.ts initializing at ${new Date().toISOString()}`);

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

        console.log(`[ConnectRoute] Search: user=${req.user.username} (${currentUserId}), q="${query}"`);

        try {
            const results = await connectionService.searchUsers(query, currentUserId);
            res.json(results);
        } catch (dbError: any) {
            console.error('[ConnectRoute] DB Search Failed:', dbError);
            const logPath = 'C:\\Users\\baren\\.gemini\\antigravity\\brain\\da2b10d5-940d-425e-afb1-dc98e64919c2\\server_db_error.log';
            fs.appendFileSync(logPath, `[DB ERROR] ${dbError.message}\n${dbError.stack}\n`);
            throw dbError; // Re-throw to main handler
        }
    } catch (error: any) {
        console.error('Search error:', error);

        try {
            console.error('Full stack:', error.stack);
            // LOG TO ARTIFACT DIR - ABSOLUTE PATH
            const logPath = 'C:\\Users\\baren\\.gemini\\antigravity\\brain\\da2b10d5-940d-425e-afb1-dc98e649192\\server_debug.log';
            const logContent = `[${new Date().toISOString()}] SEARCH ERROR:\nDir: ${__dirname}\nUser: ${JSON.stringify(req.user)}\nQuery: ${req.query?.q}\nError: ${error.message}\n${error.stack}\n\n`;
            fs.appendFileSync(logPath, logContent);
        } catch (logErr) {
            console.error('Failed to write to error log:', logErr);
        }

        res.status(500).json({ error: error.message, stack: error.stack });
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
        console.error('Connection list error:', error);
        res.status(500).json({ error: error.message });
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
        console.error('Requests fetch error:', error);
        res.status(500).json({ error: error.message });
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
        console.error('Synastry calculation error:', error);
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
        console.error('Send request error:', error);
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
        console.error('Respond request error:', error);
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
        console.error('Share insight error:', error);
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
        console.error('Get shared insights error:', error);
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
        console.error('Mark insight read error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
