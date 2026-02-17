import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// File-based storage for feedback persistence
const FEEDBACK_FILE = path.join(__dirname, '../../data/feedback.json');

// Ensure data directory exists
const dataDir = path.dirname(FEEDBACK_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing feedback from file
let feedbackStore: any[] = [];
try {
    if (fs.existsSync(FEEDBACK_FILE)) {
        const data = fs.readFileSync(FEEDBACK_FILE, 'utf8');
        feedbackStore = JSON.parse(data);
        console.log(`[Feedback] Loaded ${feedbackStore.length} existing feedback items`);
    }
} catch (error) {
    console.error('[Feedback] Failed to load feedback file:', error);
    feedbackStore = [];
}

// Save feedback to file
const saveFeedback = () => {
    try {
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackStore, null, 2));
    } catch (error) {
        console.error('[Feedback] Failed to save feedback:', error);
    }
};

// Configure multer for screenshot uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/feedback');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'feedback-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'));
        }
    }
});

// Submit feedback (Founding members OR admins)
router.post('/', authMiddleware, upload.single('screenshot'), async (req, res) => {
    try {
        const authUser = (req as any).user;
        const { userService } = require('../services/UserService');
        const user = await userService.getProfile(authUser.id);

        // Beta: Allow ALL authenticated users to submit feedback
        // (Previously restricted to founding members only)
        // const canSubmit = user.isFoundingMember || user.isAdmin;
        const canSubmit = true;

        if (!canSubmit) {
            return res.status(403).json({ error: 'Feedback submission is available for Founding Circle members only' });
        }

        const { category, priority, title, description, pageUrl } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const feedback = {
            id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            userName: user.name || user.email,
            userEmail: user.email,
            category: category || 'other',
            priority: priority || 'medium',
            title,
            description,
            pageUrl: pageUrl || '',
            screenshotPath: req.file ? `/uploads/feedback/${req.file.filename}` : null,
            status: 'new',
            isRead: false, // Track if admin has seen this
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        feedbackStore.push(feedback);
        saveFeedback(); // Persist to file

        console.log(`[Feedback] New ${category} from ${user.email}: "${title}"`);

        res.status(201).json({
            success: true,
            feedbackId: feedback.id,
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        console.error('[Feedback] Submission error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// Get all feedback (Admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = (req as any).user;

        // Verify admin status
        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { status, category, priority, limit = 50, offset = 0 } = req.query;

        let filtered = [...feedbackStore];

        if (status) {
            filtered = filtered.filter(f => f.status === status);
        }
        if (category) {
            filtered = filtered.filter(f => f.category === category);
        }
        if (priority) {
            filtered = filtered.filter(f => f.priority === priority);
        }

        // Sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

        res.json({
            feedback: paginated,
            total: filtered.length,
            limit: Number(limit),
            offset: Number(offset)
        });
    } catch (error) {
        console.error('[Feedback] Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// Get new feedback count (Admin only) - for notifications
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const user = (req as any).user;

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const unreadCount = feedbackStore.filter(f => f.status === 'new' && !f.isRead).length;

        res.json({ unreadCount });
    } catch (error) {
        console.error('[Feedback] Unread count error:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark feedback as read (Admin only)
router.post('/:id/read', authMiddleware, async (req, res) => {
    try {
        const user = (req as any).user;

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { id } = req.params;
        const feedbackIndex = feedbackStore.findIndex(f => f.id === id);

        if (feedbackIndex === -1) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        feedbackStore[feedbackIndex].isRead = true;
        saveFeedback();

        res.json({ success: true });
    } catch (error) {
        console.error('[Feedback] Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Update feedback status (Admin only)
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const user = (req as any).user;

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const feedbackIndex = feedbackStore.findIndex(f => f.id === id);

        if (feedbackIndex === -1) {
            return res.status(404).json({ error: 'Feedback not found' });
        }

        if (status) {
            feedbackStore[feedbackIndex].status = status;
        }
        if (adminNotes !== undefined) {
            feedbackStore[feedbackIndex].adminNotes = adminNotes;
        }
        feedbackStore[feedbackIndex].isRead = true; // Mark as read when updated
        feedbackStore[feedbackIndex].updatedAt = new Date().toISOString();
        feedbackStore[feedbackIndex].updatedBy = user.id;

        saveFeedback(); // Persist changes

        res.json({
            success: true,
            feedback: feedbackStore[feedbackIndex]
        });
    } catch (error) {
        console.error('[Feedback] Update error:', error);
        res.status(500).json({ error: 'Failed to update feedback' });
    }
});

// Get feedback stats (Admin only)
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const user = (req as any).user;

        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const stats = {
            total: feedbackStore.length,
            unread: feedbackStore.filter(f => !f.isRead).length,
            byStatus: {
                new: feedbackStore.filter(f => f.status === 'new').length,
                inProgress: feedbackStore.filter(f => f.status === 'in_progress').length,
                resolved: feedbackStore.filter(f => f.status === 'resolved').length,
                closed: feedbackStore.filter(f => f.status === 'closed').length
            },
            byCategory: {
                bug: feedbackStore.filter(f => f.category === 'bug').length,
                feature: feedbackStore.filter(f => f.category === 'feature').length,
                improvement: feedbackStore.filter(f => f.category === 'improvement').length,
                other: feedbackStore.filter(f => f.category === 'other').length
            },
            byPriority: {
                low: feedbackStore.filter(f => f.priority === 'low').length,
                medium: feedbackStore.filter(f => f.priority === 'medium').length,
                high: feedbackStore.filter(f => f.priority === 'high').length,
                critical: feedbackStore.filter(f => f.priority === 'critical').length
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('[Feedback] Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch feedback stats' });
    }
});

export default router;
