import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { checkInLimiter, limitContentLength } from '../middleware/securityMiddleware';
import { CheckInSchema } from '../validators/checkIn';
import { checkInService } from '../services/CheckInService';
import { logger, logAuthEvent } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/check-ins/quick
 * Save a quick daily check-in (emotion + energy + context)
 */
router.post(
  '/quick',
  limitContentLength(1024 * 100), // 100KB max
  authMiddleware,
  checkInLimiter,
  validateBody(CheckInSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const validatedData = (req as any).validated;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const checkIn = await checkInService.saveCheckIn(userId, validatedData);

      logAuthEvent('check_in_saved', userId, {
        emotion: validatedData.emotion,
        energyLevel: validatedData.energy_level
      });

      res.status(201).json({
        success: true,
        data: checkIn,
        message: 'Check-in saved successfully'
      });
    } catch (error) {
      logger.error({ error }, 'POST /api/check-ins/quick failed');
      res.status(500).json({
        error: 'Failed to save check-in',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/check-ins
 * Get all check-ins for authenticated user (paginated)
 */
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const result = await checkInService.getCheckIns(userId, limit, offset);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          limit,
          offset,
          total: result.total
        }
      });
    } catch (error) {
      logger.error({ error }, 'GET /api/check-ins failed');
      res.status(500).json({
        error: 'Failed to retrieve check-ins',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/check-ins/recent
 * Get recent check-ins (last N days, default 7)
 */
router.get(
  '/recent',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const days = Math.min(parseInt(req.query.days as string) || 7, 90);

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const checkIns = await checkInService.getRecentCheckIns(userId, days);

      res.json({
        success: true,
        data: checkIns,
        meta: {
          days,
          count: checkIns.length
        }
      });
    } catch (error) {
      logger.error({ error }, 'GET /api/check-ins/recent failed');
      res.status(500).json({
        error: 'Failed to retrieve recent check-ins',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/check-ins/count
 * Get total check-in count for user
 */
router.get(
  '/count',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const count = await checkInService.getCheckInCount(userId);

      res.json({
        success: true,
        count
      });
    } catch (error) {
      logger.error({ error }, 'GET /api/check-ins/count failed');
      res.status(500).json({
        error: 'Failed to get check-in count',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/check-ins/emotions/frequency
 * Get emotion frequency for pattern detection (prep for future)
 */
router.get(
  '/emotions/frequency',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const days = Math.min(parseInt(req.query.days as string) || 7, 90);

      if (!userId) {
        return res.status(401).json({ error: 'User ID not found in token' });
      }

      const frequency = await checkInService.getEmotionFrequency(userId, days);

      res.json({
        success: true,
        data: frequency,
        meta: {
          days
        }
      });
    } catch (error) {
      logger.error({ error }, 'GET /api/check-ins/emotions/frequency failed');
      res.status(500).json({
        error: 'Failed to get emotion frequency',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
