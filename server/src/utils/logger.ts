import pino from 'pino';
import path from 'path';
import fs from 'fs';

/**
 * Structured logger using Pino
 * Replaces scattered console.log and fs.appendFileSync calls
 * Never logs sensitive data (passwords, tokens)
 */

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger instance
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      pid: false,
      hostname: false
    },
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: false
      }
    }
  },
  pino.destination({
    dest: path.join(logsDir, 'app.log'),
    sync: false // Async writes
  })
);

/**
 * Audit logger for security-relevant events
 * Used for: auth attempts, failed validations, suspicious activity
 */
export const auditLogger = pino(
  {
    level: 'info',
    base: {
      pid: false,
      hostname: false
    }
  },
  pino.destination({
    dest: path.join(logsDir, 'audit.log'),
    sync: false
  })
);

/**
 * Log authentication event (safe, no passwords)
 */
export function logAuthEvent(event: string, userId: string | null, details?: Record<string, any>) {
  auditLogger.info(
    { event, userId, ...details },
    `Auth event: ${event}`
  );
}

/**
 * Log failed validation
 */
export function logValidationError(endpoint: string, error: any, details?: Record<string, any>) {
  logger.warn(
    { endpoint, error: error.message, ...details },
    `Validation error on ${endpoint}`
  );
}

/**
 * Log database operation
 */
export function logDatabaseOperation(operation: string, table: string, duration: number, success: boolean) {
  logger.debug(
    { operation, table, duration, success },
    `DB operation: ${operation} on ${table}`
  );
}

/**
 * Log security incident
 */
export function logSecurityIncident(incident: string, details?: Record<string, any>) {
  auditLogger.error(
    { incident, ...details },
    `Security incident: ${incident}`
  );
}

/**
 * Log application startup/shutdown
 */
export function logAppEvent(event: string, details?: Record<string, any>) {
  logger.info(
    { event, ...details },
    event
  );
}

/**
 * Middleware to log HTTP requests
 */
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    // Log request (but not sensitive fields)
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      logger.info(
        { method, url, status, duration, ip },
        `${method} ${url} - ${status} (${duration}ms)`
      );
    });

    next();
  };
}

export default logger;
