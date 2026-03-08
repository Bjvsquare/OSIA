import express, { Request, Response } from 'express';
import { adminService } from '../services/AdminService';
import { errorLogger } from '../services/ErrorLogger';
import { auditLogger } from '../services/AuditLogger';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { migrationService } from '../services/MigrationService';
import { blueprintService } from '../services/BlueprintService';
import { db } from '../db/JsonDb';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';

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

// DevOps / Collaboration Context
router.get('/devops', async (req, res) => {
    try {
        // Run git commands in the backend root
        const cwd = process.cwd(); // sentari-app directory

        let gitBranch = 'unknown';
        let gitLog: any[] = [];
        let gitStatus: any[] = [];

        try {
            gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();

            // Get last 30 commits: hash|author|date|message
            const logStr = execSync('git log -n 30 --pretty=format:"%h|%an|%cI|%s"', { cwd, encoding: 'utf-8' });
            gitLog = logStr.split('\n').filter(Boolean).map(line => {
                const [hash, author, date, message] = line.split('|');
                return { hash, author, date, message };
            });

            // Get porcelain status
            const statusStr = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
            gitStatus = statusStr.split('\n').filter(Boolean).map(line => ({
                status: line.substring(0, 2),
                file: line.substring(3)
            }));
        } catch (gitErr) {
            console.error('[AdminAPI] Git command failed:', gitErr);
        }

        // Read CONTEXT.md safely
        let contextMd = '';
        let lastUpdated = '';
        try {
            const contextPath = path.join(cwd, 'CONTEXT.md');
            contextMd = await fs.readFile(contextPath, 'utf8');
            const stats = await fs.stat(contextPath);
            lastUpdated = stats.mtime.toISOString();
        } catch (fileErr) {
            console.error('[AdminAPI] Failed to read CONTEXT.md:', fileErr);
            contextMd = '# CONTEXT.md not found\n\nCreate a `CONTEXT.md` file in the project root to enable collaboration tracking.';
        }

        res.json({
            gitBranch,
            gitLog,
            gitStatus,
            contextMd,
            lastUpdated
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/devops/context', async (req, res) => {
    try {
        const { content } = req.body;
        if (typeof content !== 'string') {
            return res.status(400).json({ error: 'Content must be a string' });
        }

        const cwd = process.cwd();
        const contextPath = path.join(cwd, 'CONTEXT.md');

        await fs.writeFile(contextPath, content, 'utf8');
        res.json({ message: 'CONTEXT.md updated successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Sync Board API ---

router.get('/devops/tasks', async (req, res) => {
    try {
        const tasks = await db.getCollection<any>('devops_tasks') || [];
        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/devops/tasks', async (req, res) => {
    try {
        const { title, description, assignee } = req.body;
        if (!title) return res.status(400).json({ error: 'Title is required' });

        const tasks = await db.getCollection<any>('devops_tasks') || [];
        const newTask = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            title,
            description: description || '',
            assignee: assignee || 'Unassigned',
            status: 'todo', // todo, in_progress, review, done
            isFocusPoint: false,
            reviewer: null,
            comments: [], // New feedback thread
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        await db.saveCollection('devops_tasks', tasks);
        res.status(201).json(newTask);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/devops/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const tasks = await db.getCollection<any>('devops_tasks') || [];
        const taskIndex = tasks.findIndex(t => t.id === id);

        if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

        // If setting this task as focus point, clear focus from other tasks assigned to this person
        if (updates.isFocusPoint && updates.assignee) {
            tasks.forEach(t => {
                if (t.assignee === updates.assignee && t.id !== id) t.isFocusPoint = false;
            });
        }

        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
        await db.saveCollection('devops_tasks', tasks);

        res.json(tasks[taskIndex]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/devops/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tasks = await db.getCollection<any>('devops_tasks') || [];
        const filteredTasks = tasks.filter(t => t.id !== id);

        await db.saveCollection('devops_tasks', filteredTasks);
        res.json({ message: 'Task deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
