import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logSecurityIncident } from '../utils/logger';

/**
 * Rate limiters for different endpoints
 * Prevents brute force attacks and DoS
 */

// Strict: Auth endpoints (login, signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many auth attempts, please try again later',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  handler: (req, res) => {
    logSecurityIncident('Rate limit exceeded (auth)', {
      ip: req.ip,
      endpoint: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many authentication attempts. Please try again in 15 minutes.'
    });
  }
});

// Moderate: API endpoints
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and auth
    return req.path === '/health' || req.path.startsWith('/api/auth');
  },
  handler: (req, res) => {
    logSecurityIncident('Rate limit exceeded (API)', {
      ip: req.ip,
      endpoint: req.path,
      method: req.method
    });
    res.status(429).json({
      error: 'API rate limit exceeded. Please try again later.'
    });
  }
});

// Very strict: Check-in endpoint (prevent spam)
export const checkInLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 check-ins per hour per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, IP otherwise
    return (req as any).user?.id || req.ip || 'unknown';
  },
  handler: (req, res) => {
    logSecurityIncident('Check-in rate limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip
    });
    res.status(429).json({
      error: 'Too many check-ins. You can check in up to 10 times per hour.'
    });
  }
});

/**
 * Middleware to check for required headers
 * Prevents basic bot attacks
 */
export function requireContentType(contentType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ct = req.get('content-type');
    if (!ct || !ct.includes(contentType)) {
      return res.status(400).json({
        error: `Content-Type must be ${contentType}`
      });
    }
    next();
  };
}

/**
 * Middleware to validate content length
 * Prevents large payload attacks
 */
export function limitContentLength(maxBytes: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > maxBytes) {
      logSecurityIncident('Content-length exceeded', {
        ip: req.ip,
        contentLength,
        maxBytes
      });
      return res.status(413).json({
        error: `Payload too large. Maximum size is ${maxBytes / 1024 / 1024}MB`
      });
    }
    next();
  };
}

export default {
  authLimiter,
  apiLimiter,
  checkInLimiter,
  requireContentType,
  limitContentLength
};
