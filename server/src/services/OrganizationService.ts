import { randomUUID } from 'crypto';
import { db } from '../db';

// ============ INTERFACES ============

export interface Organization {
    id: string;
    name: string;
    slug: string; // URL-friendly identifier
    type: 'company' | 'nonprofit' | 'government' | 'education' | 'other';
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    foundedYear?: number;
    headquarters?: string;
    website?: string;
    description?: string;
    logo?: string;
    isDiscoverable: boolean;
    blueprint?: OrganizationBlueprint;
    settings: OrganizationSettings;
    createdAt: string;
    createdBy: string;
}

export interface OrganizationBlueprint {
    id: string;
    orgId: string;
    culture: CultureProfile;
    structure: StructureProfile;
    dynamics: DynamicsProfile;
    generatedAt: string;
    source: 'questionnaire' | 'imported' | 'ai_inferred';
}

export interface CultureProfile {
    collaboration: number;      // 0-1: Independent <-> Highly collaborative
    formality: number;          // 0-1: Casual <-> Formal
    innovation: number;         // 0-1: Traditional <-> Innovative
    transparency: number;       // 0-1: Need-to-know <-> Open book
    workLifeBalance: number;    // 0-1: Work-first <-> Balance-focused
    values: string[];
}

export interface StructureProfile {
    hierarchy: number;          // 0-1: Flat <-> Hierarchical
    decisionMaking: number;     // 0-1: Distributed <-> Centralized
    autonomy: number;           // 0-1: Guided <-> Self-directed
    specialization: number;     // 0-1: Generalist <-> Specialist
}

export interface DynamicsProfile {
    pace: number;               // 0-1: Steady <-> Fast-paced
    riskTolerance: number;      // 0-1: Risk-averse <-> Risk-taking
    changeFrequency: number;    // 0-1: Stable <-> Constantly evolving
    competitiveness: number;    // 0-1: Cooperative <-> Competitive
}

export interface OrganizationSettings {
    requireApproval: boolean;           // Require admin approval for new members
    allowPublicSearch: boolean;         // Appear in organization search
    defaultConsentLevel: 'minimal' | 'standard' | 'full';
    recruitmentEnabled: boolean;
}

export interface OrganizationMember {
    id: string;
    orgId: string;
    userId: string;
    role: 'owner' | 'admin' | 'manager' | 'employee' | 'contractor';
    department?: string;
    title?: string;
    status: 'pending' | 'active' | 'suspended' | 'departed';
    dataConsent: DataConsentRecord;
    joinedAt: string;
    lastUpdated?: string;
    verifiedBy?: string;
    verifiedAt?: string;
}

export interface DataConsentRecord {
    shareBlueprint: boolean;
    shareProtocolStats: boolean;
    shareGrowthTrends: boolean;
    recruitmentVisible: boolean;
    consentedAt: string;
    lastUpdated: string;
}

export interface RecruitmentRole {
    id: string;
    orgId: string;
    title: string;
    department: string;
    description?: string;
    idealTraits: Record<string, { min: number; max: number; weight: number }>;
    requirements: string[];
    status: 'open' | 'closed' | 'paused';
    createdAt: string;
    createdBy: string;
}

// ============ QUESTION BANK FOR ORG BLUEPRINT ============

export const ORG_QUESTIONNAIRE = [
    // Culture Questions
    {
        id: 'culture_collab',
        category: 'culture',
        text: 'How does your team typically approach projects?',
        trait: 'collaboration',
        options: [
            { value: 0.2, label: 'Individual ownership with periodic check-ins' },
            { value: 0.4, label: 'Small teams with defined roles' },
            { value: 0.6, label: 'Cross-functional collaboration' },
            { value: 0.8, label: 'Highly collaborative with shared ownership' }
        ]
    },
    {
        id: 'culture_formality',
        category: 'culture',
        text: 'How would you describe your workplace communication style?',
        trait: 'formality',
        options: [
            { value: 0.2, label: 'Very casual, first-name basis, informal channels' },
            { value: 0.4, label: 'Relaxed but professional' },
            { value: 0.6, label: 'Professional with structured meetings' },
            { value: 0.8, label: 'Formal with clear protocols' }
        ]
    },
    {
        id: 'culture_innovation',
        category: 'culture',
        text: 'How does your organization approach new ideas?',
        trait: 'innovation',
        options: [
            { value: 0.2, label: 'We stick to proven methods' },
            { value: 0.4, label: 'Open to improvements on existing processes' },
            { value: 0.6, label: 'Actively encourage experimentation' },
            { value: 0.8, label: 'Innovation is core to everything we do' }
        ]
    },
    {
        id: 'culture_transparency',
        category: 'culture',
        text: 'How is information shared within your organization?',
        trait: 'transparency',
        options: [
            { value: 0.2, label: 'On a need-to-know basis' },
            { value: 0.4, label: 'Within relevant teams and departments' },
            { value: 0.6, label: 'Openly across the organization' },
            { value: 0.8, label: 'Complete transparency, including financials' }
        ]
    },
    // Structure Questions
    {
        id: 'structure_hierarchy',
        category: 'structure',
        text: 'How is your organization structured?',
        trait: 'hierarchy',
        options: [
            { value: 0.2, label: 'Very flat, everyone is equal' },
            { value: 0.4, label: 'Minimal hierarchy, team leads' },
            { value: 0.6, label: 'Clear management layers' },
            { value: 0.8, label: 'Traditional hierarchical structure' }
        ]
    },
    {
        id: 'structure_decisions',
        category: 'structure',
        text: 'How are important decisions typically made?',
        trait: 'decisionMaking',
        options: [
            { value: 0.2, label: 'Team consensus' },
            { value: 0.4, label: 'Manager with team input' },
            { value: 0.6, label: 'Leadership team' },
            { value: 0.8, label: 'Top-down from executives' }
        ]
    },
    {
        id: 'structure_autonomy',
        category: 'structure',
        text: 'How much autonomy do employees have in their work?',
        trait: 'autonomy',
        options: [
            { value: 0.2, label: 'Clear guidelines and supervision' },
            { value: 0.4, label: 'Some flexibility within defined scope' },
            { value: 0.6, label: 'Significant autonomy with accountability' },
            { value: 0.8, label: 'Full autonomy, results-focused' }
        ]
    },
    // Dynamics Questions
    {
        id: 'dynamics_pace',
        category: 'dynamics',
        text: 'What is the typical pace of work?',
        trait: 'pace',
        options: [
            { value: 0.2, label: 'Steady and predictable' },
            { value: 0.4, label: 'Moderate with occasional busy periods' },
            { value: 0.6, label: 'Fast-paced with quick turnarounds' },
            { value: 0.8, label: 'Intense, startup-like energy' }
        ]
    },
    {
        id: 'dynamics_risk',
        category: 'dynamics',
        text: 'How does your organization approach risk?',
        trait: 'riskTolerance',
        options: [
            { value: 0.2, label: 'Very risk-averse, thorough analysis' },
            { value: 0.4, label: 'Calculated risks with mitigation plans' },
            { value: 0.6, label: 'Comfortable with moderate risk' },
            { value: 0.8, label: 'High risk tolerance, move fast' }
        ]
    },
    {
        id: 'dynamics_change',
        category: 'dynamics',
        text: 'How often do priorities and projects change?',
        trait: 'changeFrequency',
        options: [
            { value: 0.2, label: 'Very stable, annual planning' },
            { value: 0.4, label: 'Quarterly adjustments' },
            { value: 0.6, label: 'Monthly pivots are common' },
            { value: 0.8, label: 'Constantly evolving, weekly changes' }
        ]
    }
];

// ============ SERVICE CLASS ============

// Helper to generate URL-friendly slug from organization name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
}

class OrganizationService {

    // ===== ORGANIZATION CRUD =====

    async createOrganization(
        adminUserId: string,
        data: Pick<Organization, 'name' | 'type' | 'industry' | 'size' | 'description' | 'website' | 'headquarters' | 'foundedYear'>
    ): Promise<Organization> {
        const orgs = await db.getCollection<Organization>('organizations');

        // Generate unique slug
        let baseSlug = generateSlug(data.name);
        let slug = baseSlug;
        let counter = 1;
        while (orgs.some(o => o.slug === slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const newOrg: Organization = {
            id: randomUUID(),
            slug,
            ...data,
            isDiscoverable: true,
            settings: {
                requireApproval: true,
                allowPublicSearch: true,
                defaultConsentLevel: 'standard',
                recruitmentEnabled: true
            },
            createdAt: new Date().toISOString(),
            createdBy: adminUserId
        };

        orgs.push(newOrg);
        await db.saveCollection('organizations', orgs);

        // Create owner membership
        await this.addMember(newOrg.id, adminUserId, 'owner', {
            shareBlueprint: true,
            shareProtocolStats: true,
            shareGrowthTrends: true,
            recruitmentVisible: false,
            consentedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        return newOrg;
    }

    async getOrganization(orgId: string): Promise<Organization | null> {
        const orgs = await db.getCollection<Organization>('organizations');
        return orgs.find(o => o.id === orgId) || null;
    }

    async getOrganizationBySlug(slug: string): Promise<Organization | null> {
        const orgs = await db.getCollection<Organization>('organizations');
        return orgs.find(o => o.slug === slug && o.isDiscoverable) || null;
    }

    async searchOrganizations(query: string): Promise<Organization[]> {
        const orgs = await db.getCollection<Organization>('organizations');
        const lowerQuery = query.toLowerCase().trim();

        return orgs.filter(o =>
            o.isDiscoverable &&
            o.settings.allowPublicSearch &&
            (o.name.toLowerCase().includes(lowerQuery) ||
                o.industry.toLowerCase().includes(lowerQuery) ||
                o.description?.toLowerCase().includes(lowerQuery))
        );
    }

    async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization | null> {
        const orgs = await db.getCollection<Organization>('organizations');
        const index = orgs.findIndex(o => o.id === orgId);

        if (index === -1) return null;

        orgs[index] = { ...orgs[index], ...updates };
        await db.saveCollection('organizations', orgs);

        return orgs[index];
    }

    // ===== BLUEPRINT GENERATION =====

    async generateBlueprint(orgId: string, responses: Record<string, number>): Promise<OrganizationBlueprint> {
        const culture: CultureProfile = {
            collaboration: responses['culture_collab'] || 0.5,
            formality: responses['culture_formality'] || 0.5,
            innovation: responses['culture_innovation'] || 0.5,
            transparency: responses['culture_transparency'] || 0.5,
            workLifeBalance: 0.5, // Can be added as question later
            values: this.inferValues(responses)
        };

        const structure: StructureProfile = {
            hierarchy: responses['structure_hierarchy'] || 0.5,
            decisionMaking: responses['structure_decisions'] || 0.5,
            autonomy: responses['structure_autonomy'] || 0.5,
            specialization: 0.5
        };

        const dynamics: DynamicsProfile = {
            pace: responses['dynamics_pace'] || 0.5,
            riskTolerance: responses['dynamics_risk'] || 0.5,
            changeFrequency: responses['dynamics_change'] || 0.5,
            competitiveness: 0.5
        };

        const blueprint: OrganizationBlueprint = {
            id: randomUUID(),
            orgId,
            culture,
            structure,
            dynamics,
            generatedAt: new Date().toISOString(),
            source: 'questionnaire'
        };

        // Save blueprint to organization
        await this.updateOrganization(orgId, { blueprint });

        return blueprint;
    }

    private inferValues(responses: Record<string, number>): string[] {
        const values: string[] = [];

        if (responses['culture_collab'] > 0.6) values.push('Collaboration');
        if (responses['culture_innovation'] > 0.6) values.push('Innovation');
        if (responses['culture_transparency'] > 0.6) values.push('Transparency');
        if (responses['structure_autonomy'] > 0.6) values.push('Autonomy');
        if (responses['dynamics_risk'] > 0.6) values.push('Bold Action');
        if (responses['dynamics_risk'] < 0.4) values.push('Stability');
        if (responses['dynamics_pace'] < 0.4) values.push('Work-Life Balance');

        return values.length > 0 ? values : ['Excellence', 'Growth'];
    }

    // ===== MEMBER MANAGEMENT =====

    async addMember(
        orgId: string,
        userId: string,
        role: OrganizationMember['role'],
        consent: DataConsentRecord,
        options?: { department?: string; title?: string }
    ): Promise<OrganizationMember> {
        const members = await db.getCollection<OrganizationMember>('organization_members');

        // Check if already a member
        const existing = members.find(m => m.orgId === orgId && m.userId === userId && m.status !== 'departed');
        if (existing) {
            throw new Error('User is already a member of this organization');
        }

        const org = await this.getOrganization(orgId);
        const needsApproval = org?.settings.requireApproval && role !== 'owner';

        const member: OrganizationMember = {
            id: randomUUID(),
            orgId,
            userId,
            role,
            department: options?.department,
            title: options?.title,
            status: needsApproval ? 'pending' : 'active',
            dataConsent: consent,
            joinedAt: new Date().toISOString(),
            ...(needsApproval ? {} : { verifiedAt: new Date().toISOString() })
        };

        members.push(member);
        await db.saveCollection('organization_members', members);

        return member;
    }

    async getMembers(orgId: string, status?: OrganizationMember['status']): Promise<any[]> {
        const members = await db.getCollection<OrganizationMember>('organization_members');
        const orgMembers = members.filter(m =>
            m.orgId === orgId &&
            (!status || m.status === status)
        );

        const users = await db.getCollection<any>('users');
        return orgMembers.map(m => {
            const user = users.find((u: any) => u.id === m.userId);
            return {
                ...m,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    avatarUrl: user.avatarUrl
                } : null
            };
        });
    }

    async getPendingRequests(orgId: string): Promise<any[]> {
        return this.getMembers(orgId, 'pending');
    }

    async approveMember(memberId: string, adminId: string): Promise<any | null> {
        const members = await db.getCollection<OrganizationMember>('organization_members');
        const index = members.findIndex(m => m.id === memberId);

        if (index === -1) return null;

        members[index].status = 'active';
        members[index].verifiedBy = adminId;
        members[index].verifiedAt = new Date().toISOString();

        await db.saveCollection('organization_members', members);

        // Enrich the returned member
        const users = await db.getCollection<any>('users');
        const user = users.find((u: any) => u.id === members[index].userId);
        return {
            ...members[index],
            user: user ? {
                id: user.id,
                name: user.name,
                username: user.username,
                avatarUrl: user.avatarUrl
            } : null
        };
    }

    async rejectMember(memberId: string): Promise<boolean> {
        const members = await db.getCollection<OrganizationMember>('organization_members');
        const index = members.findIndex(m => m.id === memberId);

        if (index === -1) return false;

        members.splice(index, 1);
        await db.saveCollection('organization_members', members);
        return true;
    }

    async removeMember(orgId: string, memberId: string): Promise<boolean> {
        const members = await db.getCollection<OrganizationMember>('organization_members');
        const index = members.findIndex(m => m.id === memberId && m.orgId === orgId);

        if (index === -1) return false;

        members.splice(index, 1);
        await db.saveCollection('organization_members', members);
        return true;
    }

    async updateMemberRole(orgId: string, memberId: string, role: OrganizationMember['role']): Promise<OrganizationMember | null> {
        const members = await db.getCollection<OrganizationMember>('organization_members');
        const index = members.findIndex(m => m.id === memberId && m.orgId === orgId);

        if (index === -1) return null;

        members[index].role = role;
        members[index].lastUpdated = new Date().toISOString();

        await db.saveCollection('organization_members', members);
        return members[index];
    }

    async addMemberByEmail(
        orgId: string,
        email: string,
        role: OrganizationMember['role'],
        adminId: string
    ): Promise<any> {
        const users = await db.getCollection<any>('users');
        const user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase() || u.username?.toLowerCase() === email.toLowerCase());

        if (!user) {
            throw new Error(`User with email/username ${email} not found`);
        }

        const consent: DataConsentRecord = {
            shareBlueprint: true,
            shareProtocolStats: true,
            shareGrowthTrends: false,
            recruitmentVisible: false,
            consentedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        const member = await this.addMember(orgId, user.id, role, consent);

        // Auto-approve if added by admin
        let finalMember = member;
        if (member.status === 'pending') {
            finalMember = (await this.approveMember(member.id, adminId))!;
        } else {
            // If not auto-approved, still enrich it
            (finalMember as any).user = {
                id: user.id,
                name: user.name,
                username: user.username,
                avatarUrl: user.avatarUrl
            };
        }

        return finalMember;
    }

    async updateMemberConsent(memberId: string, consent: Partial<DataConsentRecord>): Promise<OrganizationMember | null> {
        const members = await db.getCollection<OrganizationMember>('organization_members');
        const index = members.findIndex(m => m.id === memberId);

        if (index === -1) return null;

        members[index].dataConsent = {
            ...members[index].dataConsent,
            ...consent,
            lastUpdated: new Date().toISOString()
        };

        await db.saveCollection('organization_members', members);
        return members[index];
    }

    async getUserMemberships(userId: string): Promise<any[]> {
        const members = await db.getCollection<any>('organization_members');
        const userMemberships = members.filter(m => m.userId === userId && m.status === 'active');

        // Enrich with full organization details
        const orgs = await db.getCollection<any>('organizations');
        return userMemberships.map(m => {
            const org = orgs.find(o => o.id === m.orgId);
            return {
                ...m,
                organization: org
            };
        });
    }

    async isMember(orgId: string, userId: string): Promise<boolean> {
        const members = await this.getMembers(orgId, 'active');
        return members.some(m => m.userId === userId);
    }

    async isAdmin(orgId: string, userId: string): Promise<boolean> {
        const members = await this.getMembers(orgId, 'active');
        const member = members.find(m => m.userId === userId);
        return member?.role === 'owner' || member?.role === 'admin';
    }

    // ===== ANALYTICS =====

    async getOrganizationAnalytics(orgId: string): Promise<{
        memberCount: number;
        pendingCount: number;
        departmentBreakdown: Record<string, number>;
        consentLevels: Record<string, number>;
    }> {
        const members = await this.getMembers(orgId);
        const active = members.filter(m => m.status === 'active');
        const pending = members.filter(m => m.status === 'pending');

        const departmentBreakdown: Record<string, number> = {};
        const consentLevels = { full: 0, partial: 0, minimal: 0 };

        active.forEach(m => {
            const dept = m.department || 'Unassigned';
            departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;

            const consentCount = [
                m.dataConsent.shareBlueprint,
                m.dataConsent.shareProtocolStats,
                m.dataConsent.shareGrowthTrends
            ].filter(Boolean).length;

            if (consentCount === 3) consentLevels.full++;
            else if (consentCount > 0) consentLevels.partial++;
            else consentLevels.minimal++;
        });

        return {
            memberCount: active.length,
            pendingCount: pending.length,
            departmentBreakdown,
            consentLevels
        };
    }

    // ===== RECRUITMENT =====

    async createRecruitmentRole(
        orgId: string,
        adminUserId: string,
        data: Pick<RecruitmentRole, 'title' | 'department' | 'description' | 'idealTraits' | 'requirements'>
    ): Promise<RecruitmentRole> {
        const roles = await db.getCollection<RecruitmentRole>('recruitment_roles');

        const newRole: RecruitmentRole = {
            id: randomUUID(),
            orgId,
            ...data,
            status: 'open',
            createdAt: new Date().toISOString(),
            createdBy: adminUserId
        };

        roles.push(newRole);
        await db.saveCollection('recruitment_roles', roles);
        return newRole;
    }

    async getRecruitmentRoles(orgId: string): Promise<RecruitmentRole[]> {
        const roles = await db.getCollection<RecruitmentRole>('recruitment_roles');
        return roles.filter(r => r.orgId === orgId);
    }

    async updateRecruitmentRole(roleId: string, updates: Partial<RecruitmentRole>): Promise<RecruitmentRole | null> {
        const roles = await db.getCollection<RecruitmentRole>('recruitment_roles');
        const index = roles.findIndex(r => r.id === roleId);

        if (index === -1) return null;

        roles[index] = { ...roles[index], ...updates };
        await db.saveCollection('recruitment_roles', roles);
        return roles[index];
    }

    // ===== SETTINGS =====

    async updateSettings(orgId: string, settings: Partial<OrganizationSettings>): Promise<Organization | null> {
        const orgs = await db.getCollection<Organization>('organizations');
        const index = orgs.findIndex(o => o.id === orgId);

        if (index === -1) return null;

        orgs[index].settings = {
            ...orgs[index].settings,
            ...settings
        };

        // Sync discoverability with allowPublicSearch setting
        if (settings.allowPublicSearch !== undefined) {
            orgs[index].isDiscoverable = settings.allowPublicSearch;
        }

        await db.saveCollection('organizations', orgs);
        return orgs[index];
    }

    getQuestionnaire() {
        return ORG_QUESTIONNAIRE;
    }
}

export const organizationService = new OrganizationService();
