import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/OrganizationService';
import { db } from '../db/JsonDb';

export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

/**
 * Ensures the user is an active member of the specified organization.
 * Expects orgId to be in req.params.orgId or req.params.id.
 */
export const requireOrgMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const orgId = (req.params.orgId || req.params.id) as string;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!orgId) return res.status(400).json({ error: 'Organization ID required' });

    const isMember = await organizationService.isMember(orgId, userId);

    // Check if user is a global admin (fallback)
    const users = await db.getCollection<any>('users');
    const userProfile = users.find((u: any) => u.id === userId);
    const isGlobalAdmin = userProfile?.isAdmin === true;

    console.log(`[OrgAuth] Member check: user=${userId}, org=${orgId}, isMember=${isMember}, isGlobalAdmin=${isGlobalAdmin}`);

    if (!isMember && !isGlobalAdmin) {
        return res.status(403).json({ error: 'Access denied: Not a member of this organization' });
    }
    next();
};

/**
 * Ensures the user is an admin or owner of the specified organization.
 */
export const requireOrgAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const orgId = (req.params.orgId || req.params.id) as string;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!orgId) return res.status(400).json({ error: 'Organization ID required' });

    const isAdmin = await organizationService.isAdmin(orgId, userId);

    // Check if user is a global admin (fallback)
    const users = await db.getCollection<any>('users');
    const userProfile = users.find((u: any) => u.id === userId);
    const isGlobalAdmin = userProfile?.isAdmin === true;

    console.log(`[OrgAuth] Admin check: user=${userId}, org=${orgId}, isAdmin=${isAdmin}, isGlobalAdmin=${isGlobalAdmin}`);

    if (!isAdmin && !isGlobalAdmin) {
        return res.status(403).json({ error: 'Access denied: Organization admin privileges required' });
    }
    next();
};
