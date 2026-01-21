import { Router } from 'express';
import { organizationService } from '../services/OrganizationService';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireOrgMember, requireOrgAdmin } from '../middleware/orgAuthMiddleware';

const router = Router();

// ===== PUBLIC ACCESS =====

// Get organization by slug (public profile)
router.get('/slug/:slug', async (req: any, res: any) => {
    try {
        const org = await organizationService.getOrganizationBySlug(req.params.slug);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        // Return public-safe info only
        res.json({
            id: org.id,
            name: org.name,
            slug: org.slug,
            type: org.type,
            industry: org.industry,
            size: org.size,
            description: org.description,
            headquarters: org.headquarters,
            foundedYear: org.foundedYear,
            website: org.website,
            logo: org.logo
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get public info for any organization by ID (no membership/auth required)
router.get('/:id/public', async (req: any, res: any) => {
    try {
        const org = await organizationService.getOrganization(req.params.id);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        // Return only safe fields
        res.json({
            id: org.id,
            name: org.name,
            slug: org.slug,
            type: org.type,
            industry: org.industry,
            size: org.size,
            description: org.description
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ORGANIZATION CRUD =====

// Create new organization
router.post('/', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { name, type, industry, size, description, website, headquarters, foundedYear } = req.body;

        if (!name || !type || !industry || !size) {
            return res.status(400).json({ error: 'Missing required fields: name, type, industry, size' });
        }

        const org = await organizationService.createOrganization(userId, {
            name,
            type,
            industry,
            size,
            description,
            website,
            headquarters,
            foundedYear
        });

        res.status(201).json(org);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Search organizations
router.get('/search', async (req: any, res: any) => {
    try {
        const query = (req.query.q as string) || '';
        const orgs = await organizationService.searchOrganizations(query);
        res.json(orgs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get questionnaire for org blueprint
router.get('/questionnaire', (req: any, res: any) => {
    const questionnaire = organizationService.getQuestionnaire();
    res.json(questionnaire);
});



// Get organization by ID
router.get('/:id', authMiddleware, requireOrgMember, async (req: any, res: any) => {
    try {
        const org = await organizationService.getOrganization(req.params.id);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        res.json(org);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update organization
router.patch('/:id', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const org = await organizationService.updateOrganization(req.params.id, req.body);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        res.json(org);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== BLUEPRINT =====

// Generate/update organization blueprint from questionnaire
router.post('/:id/blueprint', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const { responses } = req.body;
        if (!responses || typeof responses !== 'object') {
            return res.status(400).json({ error: 'Responses object required' });
        }

        const blueprint = await organizationService.generateBlueprint(req.params.id, responses);
        res.json(blueprint);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== MEMBERS =====

// Request to join organization
router.post('/:id/join', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { role, department, title, consent } = req.body;

        const defaultConsent = {
            shareBlueprint: consent?.shareBlueprint ?? false,
            shareProtocolStats: consent?.shareProtocolStats ?? false,
            shareGrowthTrends: consent?.shareGrowthTrends ?? false,
            recruitmentVisible: consent?.recruitmentVisible ?? false,
            consentedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        const member = await organizationService.addMember(
            req.params.id,
            userId,
            role || 'employee',
            defaultConsent,
            { department, title }
        );

        res.status(201).json(member);
    } catch (error: any) {
        if (error.message.includes('already a member')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});

// Get organization members (admin only)
router.get('/:id/members', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const status = req.query.status as string | undefined;
        const members = await organizationService.getMembers(req.params.id, status as any);
        res.json(members);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending join requests (admin only)
router.get('/:id/pending', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const pending = await organizationService.getPendingRequests(req.params.id);
        res.json(pending);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Approve member (admin only)
router.post('/:id/members/:memberId/approve', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const member = await organizationService.approveMember(req.params.memberId, userId);
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(member);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Reject or remove member (admin only)
router.delete('/:id/members/:memberId', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const success = await organizationService.removeMember(req.params.id, req.params.memberId);
        if (!success) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update member role (admin only)
router.patch('/:id/members/:memberId/role', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const { role } = req.body;
        if (!role) return res.status(400).json({ error: 'Role is required' });

        const member = await organizationService.updateMemberRole(req.params.id, req.params.memberId, role);
        if (!member) return res.status(404).json({ error: 'Member not found' });

        res.json(member);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add member by email/username directly (admin only)
router.post('/:id/members/add', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const adminId = req.user.id || req.user.userId;
        const { email, role } = req.body;

        if (!email) return res.status(400).json({ error: 'Email/Username is required' });

        const member = await organizationService.addMemberByEmail(
            req.params.id,
            email,
            role || 'employee',
            adminId
        );

        res.status(201).json(member);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update member consent
router.patch('/:id/members/:memberId/consent', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const members = await organizationService.getMembers(req.params.id, 'active');
        const member = members.find(m => m.id === req.params.memberId);

        // Only the member themselves or an admin can update consent
        if (member?.userId !== userId) {
            const isAdmin = await organizationService.isAdmin(req.params.id, userId);
            if (!isAdmin) {
                return res.status(403).json({ error: 'Not authorized to update consent' });
            }
        }

        const updated = await organizationService.updateMemberConsent(req.params.memberId, req.body);
        if (!updated) {
            return res.status(404).json({ error: 'Member not found' });
        }
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== USER'S MEMBERSHIPS =====

router.get('/my/memberships', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const memberships = await organizationService.getUserMemberships(userId);
        res.json(memberships);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ANALYTICS =====

router.get('/:id/analytics', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const analytics = await organizationService.getOrganizationAnalytics(req.params.id);
        res.json(analytics);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


// ===== RECRUITMENT =====

// Get recruitment roles
router.get('/:id/roles', authMiddleware, requireOrgMember, async (req: any, res: any) => {
    try {
        const roles = await organizationService.getRecruitmentRoles(req.params.id);
        res.json(roles);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create recruitment role (admin only)
router.post('/:id/roles', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const role = await organizationService.createRecruitmentRole(req.params.id, userId, req.body);
        res.status(201).json(role);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update recruitment role (admin only)
router.patch('/:id/roles/:roleId', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const role = await organizationService.updateRecruitmentRole(req.params.roleId, req.body);
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }
        res.json(role);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ===== SETTINGS =====

// Update settings (admin only)
router.patch('/:id/settings', authMiddleware, requireOrgAdmin, async (req: any, res: any) => {
    try {
        const org = await organizationService.updateSettings(req.params.id, req.body);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        res.json(org.settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
