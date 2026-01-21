import express from 'express';
import { userService } from '../services/UserService';
import { auditLogger } from '../services/AuditLogger';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { OAuth2Client } from 'google-auth-library';
import { waitlistService } from '../services/WaitlistService';
import { supabaseService } from '../services/SupabaseService';
import { originSeedService } from '../services/OriginSeedService';

const router = express.Router();

const logToDisk = (message: string) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const logEntry = `[${new Date().toISOString()}] ${message}\n`;
        fs.appendFileSync(path.join(process.cwd(), 'server-vital-signs.log'), logEntry);
        console.log(message);
    } catch (e) { }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to extract user ID from token
const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

router.post('/waitlist', async (req, res) => {
    console.log(`[DEBUG] Waitlist signup request received: ${JSON.stringify(req.body)}`);
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        const result = await waitlistService.join(email);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/signup', async (req, res) => {
    console.log(`[DEBUG] Signup request received: ${JSON.stringify(req.body)}`);
    try {
        const {
            username,
            password,
            name,
            birthDate,
            birthTime,
            birthLocation,
            latitude,
            longitude,
            timezone,
            birthTimeConfidence,
            consentVersion
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // 1. Create Identity (Supabase Auth)
        console.log(`[Signup] Phase 1: Creating identity...`);
        const result = await userService.signup(username, password, name);
        const userId = result.user.id;
        console.log(`[Signup] Identity created: ${userId}`);

        // 2. Store Immutable Signals (Supabase System of Record)
        if (birthDate && birthLocation) {
            console.log(`[Signup] Phase 2: Storing signals in Supabase...`);
            await supabaseService.updateIdentitySignals(userId, {
                username,
                birthDate,
                birthTime,
                birthLocation,
                latitude,
                longitude,
                timezone,
                birthTimeConfidence: birthTimeConfidence || 'UNKNOWN',
                consentVersion: consentVersion || 'v1.0'
            });
            console.log(`[Signup] Supabase signals stored.`);
        }

        // 3. Generate Foundational Blueprint (Neo4j System of Intelligence)
        if (birthDate && birthLocation) {
            console.log(`[Signup] Phase 3: Generating Neo4j Blueprint (OSIA v1.2)...`);
            try {
                await originSeedService.generateFoundationalBlueprint(userId, {
                    date: birthDate,
                    time: birthTime,
                    location: birthLocation,
                    latitude: latitude || 0,
                    longitude: longitude || 0,
                    timezone: timezone || 'UTC'
                });
                console.log(`[Signup] Neo4j Blueprint generated.`);
            } catch (err) {
                console.error(`[Signup] Failed to generate blueprint for ${userId}:`, err);
            }
        }

        await auditLogger.log({
            userId: result.user.id,
            username: result.user.username,
            action: 'signup',
            status: 'success'
        });
        res.json(result);
    } catch (error: any) {
        console.error('[Signup] Error:', error);
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    logToDisk(`[AuthRoute] /login POST received for user: ${req.body?.username || 'unknown'}`);
    try {
        const { username, password } = req.body;
        logToDisk(`[AuthRoute] Calling userService.login for ${username}`);
        const result = await userService.login(username, password);
        logToDisk(`[AuthRoute] userService.login returned for ${username}`);

        // Check if 2FA is enabled for this user
        logToDisk(`[AuthRoute] Checking 2FA status for ${result.user.id}`);
        const twoFactorStatus = await userService.getTwoFactorStatus(result.user.id);
        logToDisk(`[AuthRoute] 2FA status: ${twoFactorStatus.enabled}`);

        if (twoFactorStatus.enabled) {
            // Return a partial response indicating 2FA is required
            return res.json({
                mfaRequired: true,
                userId: result.user.id,
                username: result.user.username
            });
        }

        // If 2FA is not enabled, proceed with normal login
        await auditLogger.log({
            userId: result.user.id,
            username: result.user.username,
            action: 'login',
            status: 'success'
        });
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// 2FA Login - Verify TOTP code and issue full JWT
router.post('/login/2fa', async (req, res) => {
    console.log(`[AuthRoute] /login/2fa POST received for userId: ${req.body.userId}`);
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({ error: 'User ID and code required' });
        }

        const isValid = await userService.verifyTwoFactorCode(userId, code);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }

        // Get user info
        const user = await userService.getProfile(userId);
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

        await auditLogger.log({
            userId: user.id,
            username: user.username,
            action: 'login_2fa',
            status: 'success'
        });

        res.json({ token, user });
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// Get 2FA setup info (QR code)
router.post('/2fa/setup', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { secret, qrCodeUrl } = await userService.generateTwoFactorSecret(userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: '2fa_setup_initiated',
            status: 'success'
        });

        res.json({ secret, qrCodeUrl });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Verify 2FA code and enable 2FA
router.post('/2fa/verify', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { secret, code } = req.body;

        if (!secret || !code) {
            return res.status(400).json({ error: 'Secret and code required' });
        }

        // Temporarily enable 2FA to verify the code
        await userService.enableTwoFactor(userId, secret);
        const isValid = await userService.verifyTwoFactorCode(userId, code);

        if (!isValid) {
            // Disable 2FA if verification fails
            await userService.disableTwoFactor(userId);
            return res.status(401).json({ error: 'Invalid code' });
        }

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: '2fa_enabled',
            status: 'success'
        });

        res.json({ message: '2FA enabled successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        await userService.disableTwoFactor(userId);

        await auditLogger.log({
            userId,
            username: req.user.username,
            action: '2fa_disabled',
            status: 'success'
        });

        res.json({ message: '2FA disabled successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get 2FA status
router.get('/2fa/status', authenticate, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const status = await userService.getTwoFactorStatus(userId);
        res.json(status);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Google OAuth Verification
router.post('/google/verify', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'ID Token required' });
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        // Check if user already exists
        const userExists = await userService.userExists(payload.email);
        if (!userExists) {
            return res.status(403).json({
                error: 'Account not found. Please sign up first using your access code to create your Foundational Blueprint.',
                needsSignup: true
            });
        }

        // Find or create user from Google profile (since they exist, this will find them)
        const user = await userService.findOrCreateGoogleUser(payload);

        // Check if 2FA is enabled for this user
        const twoFactorStatus = await userService.getTwoFactorStatus(user.id);

        if (twoFactorStatus.enabled) {
            return res.json({
                mfaRequired: true,
                userId: user.id,
                username: user.username
            });
        }

        // Normal login
        const token = jwt.sign({ id: user.id, username: user.username, isAdmin: !!user.isAdmin }, JWT_SECRET);

        await auditLogger.log({
            userId: user.id,
            username: user.username,
            action: 'google_login',
            status: 'success'
        });

        res.json({ token, user });
    } catch (error: any) {
        console.error('Google verify error:', error);
        res.status(401).json({ error: 'Google authentication failed' });
    }
});

export default router;
