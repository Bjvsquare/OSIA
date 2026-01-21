import express from 'express';
import multer from 'multer';
import path from 'path';
import { userService } from '../services/UserService';
import { auditLogger } from '../services/AuditLogger';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req: any, res: any) => {
    console.log(`[DEBUG] Avatar upload request received from ${req.ip}`);
    try {
        if (!req.file) {
            console.error('[DEBUG] No file found in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id || req.user.userId;
        const relativeAvatarUrl = `/uploads/${req.file.filename}`;

        console.log(`[DEBUG] User Authenticated: ${userId}. File: ${req.file.filename}`);
        console.log(`[DEBUG] Updating UserService for User: ${userId} with ${relativeAvatarUrl}`);

        await userService.updateAvatar(userId, relativeAvatarUrl);

        console.log(`[DEBUG] Database update successful. Logging audit event...`);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'update_avatar',
            status: 'success'
        });

        console.log(`[DEBUG] Sending 200 OK response with URL: ${relativeAvatarUrl}`);
        res.json({ message: 'Avatar updated successfully', avatarUrl: relativeAvatarUrl, success: true });
    } catch (error: any) {
        console.error('[DEBUG] Avatar Upload FAILURE:', error.stack || error.message);
        res.status(500).json({ error: 'Failed to upload avatar', details: error.message });
    }
});

router.get('/profile', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await userService.getProfile(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Enrich with OSIA profile
        try {
            const { originSeedService } = require('../services/OriginSeedService');
            const osiaProfile = await originSeedService.getProfile(userId);
            if (osiaProfile) {
                user.origin_seed_profile = osiaProfile;
            }
        } catch (e) {
            console.warn(`[Profile] Failed to fetch OSIA profile for ${userId}:`, e);
        }

        res.json(user);
    } catch (error: any) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch profile' });
    }
});


router.post('/profile', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { name, bio } = req.body;

        const updatedUser = await userService.updateProfile(userId, { name, bio });

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'update_profile',
            status: 'success',
            details: { has_name: !!name, has_bio: !!bio }
        });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error: any) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/snapshot', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { source = 'session_persistence', traits } = req.body;
        const { blueprintService } = require('../services/BlueprintService');

        // 3. Prevent overwriting rich data with empty session snapshots
        if ((!traits || traits.length === 0) && (source === 'session_persistence' || source === 'logout_persistence' || source === 'exit_persistence')) {
            console.warn(`[Snapshot] Blocked empty snapshot for user ${userId} from source ${source}`);
            return res.json({ message: 'Empty snapshot ignored to preserve data integrity.', success: true });
        }

        await blueprintService.createSnapshot(userId, traits || [], source);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'blueprint_snapshot',
            status: 'success',
            details: { source }
        });

        res.json({ message: 'Snapshot captured successfully.' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/request-deletion', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await userService.requestDeletion(userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'request_deletion',
            status: 'success'
        });

        res.json({ message: 'Account deletion request submitted for admin review.' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/feedback', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { insightId, feedback, layerId } = req.body;

        await userService.saveFeedback(userId, { insightId, feedback, layerId });

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'submit_feedback',
            status: 'success',
            details: { insightId, feedback }
        });

        res.json({ message: 'Feedback captured' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/rituals', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { prompt, layerId, status } = req.body;

        await userService.saveRitual(userId, { prompt, layerId, status });

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'update_ritual',
            status: 'success',
            details: { status }
        });

        res.json({ message: 'Ritual status updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


export default router;
