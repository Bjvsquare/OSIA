import express from 'express';
import { foundingCircleService } from '../services/FoundingCircleService';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// Join the founding circle waitlist
router.post('/join', async (req, res) => {
    try {
        const { email, referralSource } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        const result = await foundingCircleService.joinWaitlist(email, referralSource);
        res.json(result);
    } catch (error: any) {
        console.error('[FoundingCircle] Join error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get status for a specific email
router.get('/status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const member = await foundingCircleService.getStatus(email);

        if (!member) {
            return res.status(404).json({ error: 'Email not found in waitlist' });
        }

        // Don't expose access code unless approved
        const response = {
            queueNumber: member.queueNumber,
            status: member.status,
            signedUpAt: member.signedUpAt,
            ...(member.status === 'approved' && { accessCode: member.accessCode })
        };

        res.json(response);
    } catch (error: any) {
        console.error('[FoundingCircle] Status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Validate an access code (used during signup)
router.post('/validate-code', async (req, res) => {
    try {
        const { accessCode, email } = req.body;

        if (!accessCode) {
            return res.status(400).json({ error: 'Access code is required' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Email is required for validation' });
        }

        const result = await foundingCircleService.validateAndActivateCode(accessCode, email);

        if (!result.valid) {
            return res.status(400).json({ error: 'Invalid access code for this email' });
        }

        res.json(result);
    } catch (error: any) {
        console.error('[FoundingCircle] Code validation error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * ADMIN ROUTES (require admin authentication)
 */

// Get all founding circle members
router.get('/admin/all', adminMiddleware, async (req, res) => {
    try {
        const members = await foundingCircleService.getAllMembers();
        res.json(members);
    } catch (error: any) {
        console.error('[FoundingCircle] Admin get all error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get statistics
router.get('/admin/stats', adminMiddleware, async (req, res) => {
    try {
        const stats = await foundingCircleService.getStats();
        res.json(stats);
    } catch (error: any) {
        console.error('[FoundingCircle] Admin stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve a single member
router.patch('/admin/:id/approve', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const member = await foundingCircleService.approveMember(id);
        res.json({ message: 'Member approved', member });
    } catch (error: any) {
        console.error('[FoundingCircle] Admin approve error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Bulk approve first N members
router.post('/admin/bulk-approve', adminMiddleware, async (req, res) => {
    try {
        const { count } = req.body;

        if (!count || count < 1) {
            return res.status(400).json({ error: 'Valid count is required' });
        }

        const approved = await foundingCircleService.bulkApprove(count);
        res.json({ message: `Approved ${approved.length} members`, members: approved });
    } catch (error: any) {
        console.error('[FoundingCircle] Bulk approve error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove a member from waitlist
router.delete('/admin/:id', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await foundingCircleService.removeMember(id);
        res.json({ message: 'Member removed from waitlist' });
    } catch (error: any) {
        console.error('[FoundingCircle] Admin remove error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export to CSV
router.get('/admin/export', adminMiddleware, async (req, res) => {
    try {
        const members = await foundingCircleService.getAllMembers();

        // Create CSV content
        const headers = ['Queue #', 'Email', 'Status', 'Access Code', 'Signed Up', 'Approved', 'Activated'];
        const rows = members.map(m => [
            m.queueNumber,
            m.email,
            m.status,
            m.accessCode || 'N/A',
            m.signedUpAt,
            m.approvedAt || 'N/A',
            m.activatedAt || 'N/A'
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=founding-circle-export.csv');
        res.send(csv);
    } catch (error: any) {
        console.error('[FoundingCircle] Export error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
