// Heartbeat: Triggering server reload to fix connectivity issues. (Attempt 3)
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

import { neo4jService } from './services/Neo4jService';
import { supabaseService } from './services/SupabaseService';
import teamRoutes from './routes/teamRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';
import protocolRoutes from './routes/protocolRoutes';
import journeyRoutes from './routes/journeyRoutes';

const app: Express = express();
const PORT = Number(process.env.PORT) || 3001;

// Robust Persistence & Crash Logging
const LOG_FILE = path.join(process.cwd(), 'server-vital-signs.log');
const logToDisk = (message: string) => {
  try {
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
    console.log(message);
  } catch (e) {
    // Silence EPIPE or other terminal/disk errors to prevent server crash
  }
};

logToDisk('--- Server Session Initialized ---');

// Middleware
// 1. Core Config & CORS
app.use(cors());

// 2. Health check (Highest priority, NO body-parsing)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Request Logging (Minimal delay)
app.use((req: Request, res: Response, next: any) => {
  const start = Date.now();
  console.log(`[INCOMING] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMsg = `[REQ] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
    console.log(logMsg);
    logToDisk(logMsg);
  });
  next();
});

// 4. Raw Routes (Stripe Webhooks)
app.use('/api/webhooks/stripe', webhookRoutes);

// 5. Body Parsing (Narrow scoped to /api only)
// This prevents global hangs on non-api routes like /health
app.use('/api', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    logToDisk(`[BP_TRACE] START parsing body for ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.use('/api', express.json({ limit: '10mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    logToDisk(`[BP_TRACE] DONE parsing body for ${req.method} ${req.originalUrl}`);
  }
  next();
});

// 6. Static Files
app.use('/uploads', express.static('uploads', {
  etag: false,
  lastModified: false,
  cacheControl: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Body parsed routes follow below


// Routes
import authRoutes from './routes/authRoutes';
import originSeedRoutes from './routes/originSeedRoutes';

import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import foundingCircleRoutes from './routes/foundingCircleRoutes';
import realtimeRoutes from './routes/realtimeRoutes';
import connectRoutes from './routes/connectRoutes';
import feedbackRoutes from './routes/feedback.routes';
import organizationRoutes from './routes/organizationRoutes';
import osiaRoutes from './routes/osiaRoutes';
import compatibilityRoutes from './routes/compatibilityRoutes';
import teamOsiaRoutes from './routes/teamOsiaRoutes';
import orgOsiaRoutes from './routes/orgOsiaRoutes';
import nudgesRoutes from './routes/nudgesRoutes';
import evolutionRoutes from './routes/evolutionRoutes';
import refinementRoutes from './routes/refinementRoutes';

app.use('/api/auth', authRoutes);


app.use('/api/origin-seed', originSeedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/founding-circle', foundingCircleRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/osia', osiaRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/teams/osia', teamOsiaRoutes);
app.use('/api/orgs/osia', orgOsiaRoutes);
app.use('/api/nudges', nudgesRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/protocols', protocolRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/refinement', refinementRoutes);

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../dist');
  app.use(express.static(frontendPath));
  // SPA fallback — serve index.html for all non-API routes
  app.get('/{*path}', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// Pro & Team Routes (Gated)
// These would typically be separate route files, but for now we apply logic here or in their respective routers
// app.use('/api/pro', requireSubscription('pro'), proRoutes);
// app.use('/api/teams', requireSubscription('teams'), teamRoutes);

// Gracefully handle errors
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[CRITICAL] Uncaught Express Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message || 'Check server logs'
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Origin Seed Engine server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Binding: 0.0.0.0:${PORT}`);

  // Verify DB connections in background
  setTimeout(() => {
    console.log('[INFO] Starting background connectivity checks...');
    neo4jService.verifyConnectivity().catch(err => console.error('[Neo4j] Background connectivity check failed:', err));
    supabaseService.verifyConnectivity().catch(err => console.error('[Supabase] Background connectivity check failed:', err));
  }, 1000);
});

logToDisk('--- Server Session Initialized ---');

process.on('unhandledRejection', (reason, promise) => {
  logToDisk(`[FATAL] Unhandled Rejection at: ${promise} reason: ${reason}`);
});

process.on('uncaughtException', (err: any) => {
  if (err.code === 'EPIPE') return; // Ignore broken pipes
  logToDisk(`[FATAL] Uncaught Exception: ${err.message}\n${err.stack}`);
  // Give disk log a chance before exiting
  setTimeout(() => process.exit(1), 100);
});

// Capture Termination Signals
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    logToDisk(`[SIGNAL] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logToDisk('[INFO] Server closed. Process exiting.');
      process.exit(0);
    });
  });
});

// Keep process alive aggressively
setInterval(() => {
  logToDisk('[LIFE] Heartbeat: Server process is active.');
}, 1000 * 60 * 15); // Every 15 minutes

export default app;
