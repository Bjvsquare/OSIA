import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { kycService } from '../services/KYCService';
import { imageValidationService } from '../services/ImageValidationService';
import { authMiddleware } from '../middleware/authMiddleware';
import { auditLogger } from '../services/AuditLogger';

/* ═══════════════════════════════════════════════════════════
   KYC Routes — Multi-step Verification endpoints

   Individual: selfie portrait + ID document → auto-approve
   Organization: logo + business docs → manual admin review

   GET  /api/kyc/status          → Current KYC status + countdown
   POST /api/kyc/submit          → Individual: portrait + ID doc
   POST /api/kyc/submit-org      → Organization: logo + business docs
   POST /api/kyc/extend          → Request 3-day extension
   GET  /api/kyc/admin/queue     → Pending reviews (admin)
   POST /api/kyc/admin/review    → Approve/reject (admin)
   ═══════════════════════════════════════════════════════════ */

const router = express.Router();

// Ensure KYC uploads directory
const kycUploadsDir = path.join(process.cwd(), 'uploads', 'kyc');
if (!fs.existsSync(kycUploadsDir)) {
    fs.mkdirSync(kycUploadsDir, { recursive: true });
    console.log('[KYC] Created KYC uploads directory at', kycUploadsDir);
}

// Multer storage for KYC documents
const kycStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, kycUploadsDir),
    filename: (req: any, file, cb) => {
        const userId = req.user?.id || req.user?.userId || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const fieldLabel = file.fieldname || 'file';
        cb(null, `kyc-${fieldLabel}-${userId}-${timestamp}${ext}`);
    }
});

const kycUpload = multer({
    storage: kycStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (_req, file, cb) => {
        const imageExts = ['.jpg', '.jpeg', '.png', '.webp'];
        const docExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (file.fieldname === 'businessDoc') {
            // Business docs can be PDF or images
            if (docExts.includes(ext)) return cb(null, true);
            return cb(new Error(`Invalid file type for business document: ${ext}. Allowed: PDF, JPG, PNG, WebP`));
        }

        // Portrait, ID doc, and logo must be images
        if (imageExts.includes(ext)) return cb(null, true);
        cb(new Error(`Invalid file type: ${ext}. Allowed: JPG, PNG, WebP`));
    }
});

// ─── User Endpoints ────────────────────────────────────────

/**
 * GET /api/kyc/status
 * Returns the user's current KYC status, countdown, and history.
 */
router.get('/status', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const status = await kycService.getStatus(userId);
        res.json(status);
    } catch (error: any) {
        console.error('[KYC] Status error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/kyc/submit
 * Individual KYC: upload portrait selfie + ID/passport photo.
 * Auto-approves if image validation passes (V1).
 */
router.post(
    '/submit',
    authMiddleware,
    kycUpload.fields([
        { name: 'portrait', maxCount: 1 },
        { name: 'idDocument', maxCount: 1 }
    ]),
    async (req: any, res: any) => {
        try {
            const userId = req.user.id || req.user.userId;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!files?.portrait?.[0]) {
                return res.status(400).json({ error: 'Portrait photo is required' });
            }

            const portraitFile = files.portrait[0];
            const idDocFile = files.idDocument?.[0];

            // Validate portrait image
            const validation = await imageValidationService.validateImage(portraitFile.path);

            if (!validation.valid) {
                // Cleanup invalid files
                try { fs.unlinkSync(portraitFile.path); } catch { }
                if (idDocFile) try { fs.unlinkSync(idDocFile.path); } catch { }
                return res.status(400).json({
                    error: 'Portrait validation failed',
                    validationErrors: validation.errors,
                    warnings: validation.warnings
                });
            }

            const portraitUrl = `/uploads/kyc/${portraitFile.filename}`;
            const idDocUrl = idDocFile ? `/uploads/kyc/${idDocFile.filename}` : undefined;

            // Submit KYC
            await kycService.submitKYC(userId, portraitUrl, idDocUrl, validation.metadata || undefined);

            // Auto-approve individual KYC (V1 — portrait also becomes profile pic)
            const approvedRecord = await kycService.autoApprove(userId);

            await auditLogger.log({
                userId,
                username: req.user.username,
                action: 'kyc_individual_submitted',
                status: 'success',
                details: {
                    portraitUrl,
                    idDocUrl,
                    autoApproved: true,
                    metadata: validation.metadata
                }
            });

            res.json({
                message: 'Identity verified successfully. Your portrait is now your profile picture.',
                record: approvedRecord,
                validation: {
                    warnings: validation.warnings,
                    metadata: validation.metadata
                }
            });
        } catch (error: any) {
            console.error('[KYC] Submit error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * POST /api/kyc/submit-org
 * Organization KYC: upload logo + business registration doc + business details.
 * Always goes to manual admin review.
 */
router.post(
    '/submit-org',
    authMiddleware,
    kycUpload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'businessDoc', maxCount: 1 }
    ]),
    async (req: any, res: any) => {
        try {
            const userId = req.user.id || req.user.userId;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!files?.logo?.[0]) {
                return res.status(400).json({ error: 'Organization logo is required' });
            }

            const { businessName, taxId, contactEmail } = req.body;
            if (!businessName) {
                return res.status(400).json({ error: 'Business name is required' });
            }

            const logoFile = files.logo[0];
            const businessDocFile = files.businessDoc?.[0];

            // Validate logo image
            const validation = await imageValidationService.validateImage(logoFile.path);
            if (!validation.valid) {
                try { fs.unlinkSync(logoFile.path); } catch { }
                if (businessDocFile) try { fs.unlinkSync(businessDocFile.path); } catch { }
                return res.status(400).json({
                    error: 'Logo validation failed',
                    validationErrors: validation.errors,
                    warnings: validation.warnings
                });
            }

            const logoUrl = `/uploads/kyc/${logoFile.filename}`;
            const businessRegDocUrl = businessDocFile ? `/uploads/kyc/${businessDocFile.filename}` : undefined;

            const record = await kycService.submitOrgKYC(userId, {
                logoUrl,
                businessRegDocUrl,
                businessName,
                taxId,
                contactEmail
            });

            await auditLogger.log({
                userId,
                username: req.user.username,
                action: 'kyc_org_submitted',
                status: 'success',
                details: { businessName, logoUrl, businessRegDocUrl }
            });

            res.json({
                message: 'Organization verification submitted. An admin will review your documents shortly.',
                record
            });
        } catch (error: any) {
            console.error('[KYC] Org submit error:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * POST /api/kyc/extend
 * Request a one-time 3-day extension.
 */
router.post('/extend', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const record = await kycService.requestExtension(userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: 'kyc_extension_requested',
            status: 'success'
        });

        res.json({
            message: 'Extension granted. You have 3 more days to complete KYC.',
            record
        });
    } catch (error: any) {
        console.error('[KYC] Extension error:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// ─── Admin Endpoints ───────────────────────────────────────

/**
 * GET /api/kyc/admin/queue
 * Get all KYC submissions pending review.
 */
router.get('/admin/queue', authMiddleware, async (req: any, res: any) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const pending = await kycService.getPendingReviews();
        const all = await kycService.getAllRecords();

        res.json({
            pending,
            stats: {
                total: all.length,
                pendingCount: all.filter(r => r.status === 'pending').length,
                submittedCount: all.filter(r => r.status === 'submitted').length,
                underReviewCount: all.filter(r => r.status === 'under_review').length,
                verifiedCount: all.filter(r => r.status === 'verified').length,
                lockedCount: all.filter(r => r.status === 'locked' || r.status === 'locked_final').length,
                rejectedCount: all.filter(r => r.status === 'rejected').length,
            }
        });
    } catch (error: any) {
        console.error('[KYC] Admin queue error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/kyc/admin/review
 * Admin: approve or reject a KYC submission.
 * On approve for orgs: also sets the logo as avatar.
 */
router.post('/admin/review', authMiddleware, async (req: any, res: any) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { userId, decision, reason } = req.body;

        if (!userId || !decision || !['approve', 'reject'].includes(decision)) {
            return res.status(400).json({ error: 'Missing userId or valid decision (approve/reject)' });
        }

        const record = await kycService.adminReview(userId, decision, reason);

        // For approved orgs, set logo as avatar
        if (decision === 'approve' && record.orgVerification?.logoUrl) {
            try {
                const { userService } = require('../services/UserService');
                await userService.updateAvatar(userId, record.orgVerification.logoUrl);
            } catch (e: any) {
                console.warn(`[KYC] Could not set org avatar: ${e.message}`);
            }
        }

        // For approved individuals, set portrait as avatar
        if (decision === 'approve' && record.portrait?.imageUrl) {
            try {
                const { userService } = require('../services/UserService');
                await userService.updateAvatar(userId, record.portrait.imageUrl);
            } catch (e: any) {
                console.warn(`[KYC] Could not set avatar: ${e.message}`);
            }
        }

        await auditLogger.log({
            userId: req.user.id || req.user.userId,
            username: req.user.username,
            action: `kyc_admin_${decision}`,
            status: 'success',
            details: { targetUserId: userId, reason }
        });

        res.json({
            message: `KYC ${decision === 'approve' ? 'approved' : 'rejected'} for user ${userId}`,
            record
        });
    } catch (error: any) {
        console.error('[KYC] Admin review error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
