import { db } from '../db/JsonDb';
import { errorLogger } from './ErrorLogger';

export class AdminService {
    async getUsers(): Promise<any[]> {
        const users = await db.getCollection<any>('users');
        const profiles = await db.getCollection<any>('profiles');
        const seeds = await db.getCollection<any>('origin_seeds');

        return users.map(({ password, ...user }) => {
            const profile = profiles.find(p => p.userId === user.id);
            const seed = seeds.find(s => s.userId === user.id);
            return {
                ...user,
                profile,
                originSeed: seed
            };
        });
    }

    async getUserDetails(userId: string): Promise<any> {
        const users = await db.getCollection<any>('users');
        const user = users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        const profiles = await db.getCollection<any>('profiles');
        const profile = profiles.find(p => p.userId === userId);

        const seeds = await db.getCollection<any>('origin_seeds');
        const seed = seeds.find(s => s.userId === userId);

        const { password, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            profile,
            originSeed: seed
        };
    }

    async deleteUser(userId: string): Promise<void> {
        // 1. Delete from users
        const users = await db.getCollection<any>('users');
        const filteredUsers = users.filter(u => u.id !== userId);
        await db.saveCollection('users', filteredUsers);

        // 2. Delete from profiles
        const profiles = await db.getCollection<any>('profiles');
        const filteredProfiles = profiles.filter(p => p.userId !== userId);
        await db.saveCollection('profiles', filteredProfiles);

        // 3. Delete from origin_seeds
        const seeds = await db.getCollection<any>('origin_seeds');
        const filteredSeeds = seeds.filter(s => s.userId !== userId);
        await db.saveCollection('origin_seeds', filteredSeeds);

        console.log(`[AdminService] User ${userId} and all associated data deleted.`);
    }

    async updateUserRole(userId: string, isAdmin: boolean): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error('User not found');

        users[userIndex].isAdmin = isAdmin;
        await db.saveCollection('users', users);
        console.log(`[AdminService] User ${userId} role updated to: ${isAdmin ? 'Admin' : 'User'}`);
    }

    async getAnalytics(): Promise<any> {
        const users = await db.getCollection<any>('users');
        const seeds = await db.getCollection<any>('origin_seeds');
        const logs = await db.getCollection<any>('audit_logs');

        // 1. Calculate Growth Over Time (last 7 days)
        const growth_over_time = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = users.filter(u => u.createdAt.startsWith(dateStr)).length;
            return { date: dateStr, count };
        }).reverse();

        // 2. Calculate Regional Cluster Distribution (from origin seeds)
        const regions: Record<string, number> = {};
        seeds.forEach(s => {
            const region = s.location?.name?.split(',').pop()?.trim() || 'Unknown';
            regions[region] = (regions[region] || 0) + 1;
        });
        const regional_clusters = Object.entries(regions)
            .map(([name, count]) => ({ name, count, percent: (count / seeds.length) * 100 }))
            .sort((a, b) => b.count - a.count);

        return {
            totalUsers: users.length,
            activeUsers: new Set(logs.map(l => l.userId)).size,
            completionRate: users.length > 0 ? (seeds.length / users.length) * 100 : 0,
            recentInteractions: logs.length,
            growth_over_time,
            regional_clusters
        };
    }
}

export const adminService = new AdminService();
