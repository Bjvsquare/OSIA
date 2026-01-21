import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { db } from '../db/JsonDb';

export const adminMiddleware = async (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });

        try {
            // Dynamically check if user has admin role in database
            const users = await db.getCollection<any>('users');
            const targetId = user.id || user.userId;
            const dbUser = users.find(u => u.id === targetId || u.username === user.username);

            if (!dbUser || !dbUser.isAdmin) {
                console.warn(`[AdminGuard] Unauthorized access attempt: ${user.username} (targetId: ${targetId}, isAdmin: ${dbUser?.isAdmin || 'user not found'})`);
                return res.status(403).json({ error: 'Admin access denied' });
            }

            req.user = dbUser; // Attach the actual DB user with all fields
            next();
        } catch (error) {
            console.error('[AdminGuard] Error checking admin status:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
};
