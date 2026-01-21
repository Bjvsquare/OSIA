import express, { Request, Response } from 'express';
import { adminService } from '../services/AdminService';
import { errorLogger } from '../services/ErrorLogger';
import { auditLogger } from '../services/AuditLogger';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { migrationService } from '../services/MigrationService';
import { blueprintService } from '../services/BlueprintService';

const router = express.Router();

// Apply admin middleware to all routes in this router
router.use(adminMiddleware);

// User Management
router.get('/users', async (req, res) => {
    console.log('[AdminAPI] GET /users - Authorization checked');
    try {
        const users = await adminService.getUsers();
        console.log(`[AdminAPI] Fetched ${users.length} users`);
        res.json(users);
    } catch (error: any) {
        console.error('[AdminAPI] GET /users Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const details = await adminService.getUserDetails(req.params.id);
        res.json(details);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await adminService.deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/users/:id/role', async (req, res) => {
    try {
        const { isAdmin } = req.body;
        await adminService.updateUserRole(req.params.id, isAdmin);
        res.json({ message: `User role updated to ${isAdmin ? 'Admin' : 'User'} ` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Analytics
router.get('/analytics', async (req, res) => {
    console.log('[AdminAPI] GET /analytics - Authorization checked');
    try {
        const stats = await adminService.getAnalytics();
        console.log('[AdminAPI] Analytics data compiled');
        res.json(stats);
    } catch (error: any) {
        console.error('[AdminAPI] GET /analytics Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Error Logs
router.get('/errors', async (req, res) => {
    try {
        const errors = await errorLogger.getErrors();
        res.json(errors);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/errors/:id/resolve', async (req, res) => {
    try {
        await errorLogger.resolveError(req.params.id);
        res.json({ message: 'Error marked as resolved' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Interactions / Audit Logs
router.get('/interactions', async (req, res) => {
    try {
        const logs = await auditLogger.getLogs(200);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Blueprint & Digital Twin Visualization
router.get('/blueprint/:userId/history', async (req, res) => {
    try {
        const history = await blueprintService.getHistory(req.params.userId);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/blueprint/snapshot/:id', async (req, res) => {
    try {
        const snapshot = await blueprintService.getSnapshotDetail(req.params.id);
        if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
        res.json(snapshot);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/migrate', async (req: Request, res: Response) => {
    try {
        await migrationService.migrateAll();
        res.json({ message: 'Migration triggered successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Migration failed', details: error.message });
    }
});

export default router;
