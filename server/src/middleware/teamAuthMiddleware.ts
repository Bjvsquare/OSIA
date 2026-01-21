import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/TeamService';
import { db } from '../db/JsonDb';

export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

/**
 * Ensures the user is a member of the specified team.
 * Expects teamId to be in req.params.teamId or req.params.id.
 */
export const requireTeamMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const teamId = (req.params.teamId || req.params.id) as string;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!teamId) return res.status(400).json({ error: 'Team ID required' });

    const isMember = await teamService.isMember(teamId, userId);

    // Check if user is a global admin (fallback)
    const users = await db.getCollection<any>('users');
    const userProfile = users.find((u: any) => u.id === userId);
    const isGlobalAdmin = userProfile?.isAdmin === true;

    console.log(`[TeamAuth] Member check: user=${userId}, team=${teamId}, isMember=${isMember}, isGlobalAdmin=${isGlobalAdmin}`);

    if (!isMember && !isGlobalAdmin) {
        return res.status(403).json({ error: 'Access denied: Not a member of this team' });
    }
    next();
};

/**
 * Ensures the user is a Leader or Admin of the specified team.
 */
export const requireTeamAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const teamId = (req.params.teamId || req.params.id) as string;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!teamId) return res.status(400).json({ error: 'Team ID required' });

    const isAdmin = await teamService.isAdmin(teamId, userId);

    // Check if user is a global admin (fallback)
    const users = await db.getCollection<any>('users');
    const userProfile = users.find((u: any) => u.id === userId);
    const isGlobalAdmin = userProfile?.isAdmin === true;

    console.log(`[TeamAuth] Admin check: user=${userId}, team=${teamId}, isAdmin=${isAdmin}, isGlobalAdmin=${isGlobalAdmin}`);

    if (!isAdmin && !isGlobalAdmin) {
        return res.status(403).json({ error: 'Access denied: Team admin privileges required' });
    }
    next();
};
