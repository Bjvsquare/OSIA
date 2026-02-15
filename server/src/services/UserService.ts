import { db } from '../db/JsonDb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const logToDisk = (message: string) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const logEntry = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(path.join(process.cwd(), 'server-vital-signs.log'), logEntry);
        console.log(message);
    } catch (e) { }
};

export class UserService {
    async signup(username: string, password: string, name?: string): Promise<{ token: string; user: any }> {
        const users = await db.getCollection<any>('users');

        if (users.find(u => u.username === username)) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: require('crypto').randomUUID(),
            username,
            password: hashedPassword,
            name,
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
            stripeCustomerId: null,
            subscriptionId: null,
            onboardingCompleted: false,
            isAdmin: false,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await db.saveCollection('users', users);

        const token = jwt.sign({ id: newUser.id, username: newUser.username, isAdmin: newUser.isAdmin }, JWT_SECRET);
        const { password: _, ...userWithoutPassword } = newUser;

        return { token, user: userWithoutPassword };
    }

    async login(username: string, password: string): Promise<{ token: string; user: any }> {
        logToDisk(`[UserService] Login starting for user: ${username}`);
        try {
            logToDisk(`[UserService] Fetching user collection...`);
            const users = await db.getCollection<any>('users');
            logToDisk(`[UserService] Initial users check: ${users.length} users found`);

            const user = users.find(u => u.username === username);

            if (!user) {
                logToDisk(`[UserService] User not found: ${username}`);
                throw new Error('Invalid credentials');
            }

            logToDisk(`[UserService] User found (id: ${user.id}). Comparing password...`);
            const isValid = await bcrypt.compare(password, user.password);
            logToDisk(`[UserService] Bcrypt result: ${isValid}`);

            if (!isValid) {
                logToDisk(`[UserService] Invalid password for ${username}`);
                throw new Error('Invalid credentials');
            }

            logToDisk(`[UserService] Generating JWT for ${user.id}...`);
            const token = jwt.sign({ id: user.id, username: user.username, isAdmin: !!user.isAdmin }, JWT_SECRET);
            const { password: _, ...userWithoutPassword } = user;

            logToDisk(`[UserService] Checking founding status...`);
            const foundingMembers = await db.getCollection<any>('founding_circle');
            const isFoundingMember =
                user.subscriptionTier === 'founding' ||
                foundingMembers.some(
                    fm => fm.email.toLowerCase() === user.username.toLowerCase() && fm.status === 'activated'
                );
            logToDisk(`[UserService] Founding status check complete: ${isFoundingMember}`);

            return {
                token,
                user: {
                    ...userWithoutPassword,
                    onboardingCompleted: !!user.onboardingCompleted,
                    isAdmin: !!user.isAdmin,
                    isFoundingMember
                }
            };
        } catch (error: any) {
            logToDisk(`[UserService] Login error: ${error.message}`);
            throw error;
        }
    }

    async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error(`User with ID ${userId} not found in database`);
        }

        users[userIndex].avatarUrl = avatarUrl;
        await db.saveCollection('users', users);
    }

    async updateProfile(userId: string, data: { name?: string; bio?: string }): Promise<any> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            if (data.name !== undefined) users[userIndex].name = data.name;
            if (data.bio !== undefined) users[userIndex].bio = data.bio;

            await db.saveCollection('users', users);
            const { password: _, ...userWithoutPassword } = users[userIndex];
            return {
                subscriptionTier: 'free', // Fallback for legacy users
                ...userWithoutPassword
            };
        }
        throw new Error('User not found');
    }

    async getProfile(userId: string): Promise<any> {
        const users = await db.getCollection<any>('users');
        const user = users.find(u => u.id === userId);

        if (!user) throw new Error('User not found');

        const foundingMembers = await db.getCollection<any>('founding_circle');
        const isFoundingMember =
            user.subscriptionTier === 'founding' ||
            foundingMembers.some(
                fm => fm.email.toLowerCase() === user.username.toLowerCase() && fm.status === 'activated'
            );

        const { password: _, ...userWithoutPassword } = user;
        return {
            subscriptionTier: user.subscriptionTier || 'free',
            onboardingCompleted: !!user.onboardingCompleted,
            isFoundingMember,
            ...userWithoutPassword
        };
    }

    // ===== 2FA Methods =====

    async generateTwoFactorSecret(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
        const users = await db.getCollection<any>('users');
        const user = users.find(u => u.id === userId);

        if (!user) throw new Error('User not found');

        // Generate a secret for this user
        const secret = authenticator.generateSecret();

        // Create the otpauth URL for QR code
        const otpauthUrl = authenticator.keyuri(user.username, 'OSIA', secret);

        // Generate QR code as data URL
        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

        return { secret, qrCodeUrl };
    }

    async enableTwoFactor(userId: string, secret: string): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].twoFactorEnabled = true;
        users[userIndex].twoFactorSecret = secret;
        await db.saveCollection('users', users);
    }

    async disableTwoFactor(userId: string): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].twoFactorEnabled = false;
        users[userIndex].twoFactorSecret = undefined;
        await db.saveCollection('users', users);
    }

    async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
        const users = await db.getCollection<any>('users');
        const user = users.find(u => u.id === userId);

        if (!user) throw new Error('User not found');
        if (!user.twoFactorSecret) throw new Error('2FA not set up for this user');

        return authenticator.check(code, user.twoFactorSecret);
    }

    async getTwoFactorStatus(userId: string): Promise<{ enabled: boolean }> {
        const users = await db.getCollection<any>('users');
        const user = users.find(u => u.id === userId);

        if (!user) throw new Error('User not found');

        return { enabled: !!user.twoFactorEnabled };
    }

    // ===== Google OAuth Methods =====

    async findOrCreateGoogleUser(payload: any): Promise<any> {
        const users = await db.getCollection<any>('users');
        let user = users.find(u => u.googleId === payload.sub || u.username === payload.email);

        if (user) {
            // Update existing user with Google ID if they signed in via email before
            if (!user.googleId) {
                user.googleId = payload.sub;
                await db.saveCollection('users', users);
            }
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }

        // Create new user from Google profile
        const newUser: any = {
            id: require('crypto').randomUUID(),
            googleId: payload.sub,
            username: payload.email,
            name: payload.name,
            avatarUrl: payload.picture,
            subscriptionTier: 'free',
            subscriptionStatus: 'inactive',
            stripeCustomerId: null,
            subscriptionId: null,
            onboardingCompleted: false,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await db.saveCollection('users', users);

        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    async userExists(username: string): Promise<boolean> {
        const users = await db.getCollection<any>('users');
        return users.some(u => u.username === username);
    }

    async markOnboardingComplete(userId: string): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            users[userIndex].onboardingCompleted = true;
            await db.saveCollection('users', users);
        }
    }

    async requestDeletion(userId: string): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        users[userIndex].status = 'deletion_pending';
        users[userIndex].deletionRequestedAt = new Date().toISOString();
        await db.saveCollection('users', users);
    }

    async updateSubscription(userId: string, data: {
        stripeCustomerId?: string;
        subscriptionId?: string;
        subscriptionTier?: string;
        subscriptionStatus?: string;
    }): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('User not found');
        }

        if (data.stripeCustomerId) users[userIndex].stripeCustomerId = data.stripeCustomerId;
        if (data.subscriptionId) users[userIndex].subscriptionId = data.subscriptionId;
        if (data.subscriptionTier) users[userIndex].subscriptionTier = data.subscriptionTier;
        if (data.subscriptionStatus) users[userIndex].subscriptionStatus = data.subscriptionStatus;

        await db.saveCollection('users', users);
    }

    async saveFeedback(userId: string, data: { insightId: string; feedback: string; layerId: string }): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) throw new Error('User not found');

        if (!users[userIndex].feedback) users[userIndex].feedback = [];

        users[userIndex].feedback.push({
            id: require('crypto').randomUUID(),
            ...data,
            createdAt: new Date().toISOString()
        });

        await db.saveCollection('users', users);
    }

    async saveRitual(userId: string, data: { prompt: string; layerId: string; status: 'active' | 'skipped' }): Promise<void> {
        const users = await db.getCollection<any>('users');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) throw new Error('User not found');

        if (!users[userIndex].rituals) users[userIndex].rituals = [];

        users[userIndex].rituals.push({
            id: require('crypto').randomUUID(),
            ...data,
            createdAt: new Date().toISOString()
        });

        await db.saveCollection('users', users);
    }
}

export const userService = new UserService();
