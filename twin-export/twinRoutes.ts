import express from 'express';
import { twinBrainService } from '../services/TwinBrainService';
import { authMiddleware } from '../middleware/authMiddleware';
import { auditLogger } from '../services/AuditLogger';

const router = express.Router();

/**
 * POST /api/twin/message — Send a message to the user's Digital Twin
 * The twin responds with AI-powered, profile-aware dialogue.
 */
router.post('/message', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
        }

        const response = await twinBrainService.processMessage(userId, message.trim());

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'twin_message',
            status: 'success',
            details: {
                messageLength: message.length,
                emotion: response.emotion,
                hasProfileUpdate: !!response.profileUpdates,
            },
        });

        res.json(response);
    } catch (error: any) {
        console.error('[TwinRoute] Message error:', error.message);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

/**
 * GET /api/twin/history — Get conversation history
 */
router.get('/history', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        // Access history through the db directly for the GET endpoint
        const { db } = require('../db/JsonDb');
        const records = await db.getCollection('twin_conversations');
        const record = records.find((r: any) => r.userId === userId);

        res.json({
            messages: record?.messages || [],
            updatedAt: record?.updatedAt || null,
        });
    } catch (error: any) {
        console.error('[TwinRoute] History error:', error.message);
        res.status(500).json({ error: 'Failed to load history' });
    }
});

/**
 * DELETE /api/twin/history — Clear conversation history
 */
router.delete('/history', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await twinBrainService.clearHistory(userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'twin_clear_history',
            status: 'success',
        });

        res.json({ message: 'Conversation history cleared' });
    } catch (error: any) {
        console.error('[TwinRoute] Clear history error:', error.message);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

/**
 * GET /api/twin/greeting — Proactive greeting when twin loads
 * Returns a context-aware greeting using nudges, focus areas, and profile data.
 */
router.get('/greeting', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const greeting = await twinBrainService.generateGreeting(userId);
        res.json(greeting);
    } catch (error: any) {
        console.error('[TwinRoute] Greeting error:', error.message);
        // Return a safe fallback
        res.json({
            reply: "I'm here. What's on your mind?",
            emotion: 'warm',
        });
    }
});

/**
 * GET /api/twin/status — Check twin AI availability
 */
router.get('/status', authMiddleware, async (_req: any, res: any) => {
    res.json({
        aiAvailable: twinBrainService.isAvailable(),
        model: 'claude-sonnet-4-20250514',
        features: ['conversation', 'profile_updates', 'history', 'greeting'],
    });
});

export default router;

