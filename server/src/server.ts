import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';

dotenv.config();

import { neo4jService } from './services/Neo4jService';
import { supabaseService } from './services/SupabaseService';
import { logger, logAppEvent, createRequestLogger } from './utils/logger';
import { authLimiter, apiLimiter } from './middleware/securityMiddleware';

// Route imports
import teamRoutes from './routes/teamRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import webhookRoutes from './routes/webhookRoutes';
import protocolRoutes from './routes/protocolRoutes';
import journeyRoutes from './routes/journeyRoutes';
import checkInRoutes from './routes/checkInRoutes';

const app: Express = express();
const PORT = Number(process.env.PORT) || 3001;

logAppEvent('Server session initialized', { PORT });

// Middleware
// 1. Core Config & CORS
app.use(cors());
app.use(cookieParser());

// 2. Health check (Highest priority, NO body-parsing)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Request Logging (Structured, async)
app.use(createRequestLogger());

// 4. Raw Routes (Stripe Webhooks - before body parsing)
app.use('/api/webhooks/stripe', webhookRoutes);

// 5. Body Parsing (Scoped to /api)
app.use('/api', express.json({ limit: '10mb' }));
app.use('/api', express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Security middleware on /api
app.use('/api', apiLimiter);

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


// Additional route imports
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
import kycRoutes from './routes/kycRoutes';
import lifeAreaRoutes from './routes/lifeAreaRoutes';
import practiceRoutes from './routes/practiceRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { pushNotificationService } from './services/PushNotificationService';

// 7. Static Files (after body parsing)
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// 8. ROUTE REGISTRATION
// Auth routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Check-in routes (MVP - visual first)
app.use('/api/check-ins', checkInRoutes);

// All other existing routes
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
app.use('/api/kyc', kycRoutes);
app.use('/api/life-areas', lifeAreaRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Start push notification scheduler
pushNotificationService.startScheduler();

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

// 9. Error Handling
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error({ error: err, path: req.path, method: req.method }, 'Uncaught Express error');
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// 10. Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
});

process.on('uncaughtException', (err: any) => {
  if (err.code === 'EPIPE') return; // Ignore broken pipes
  logger.fatal({ error: err }, 'Uncaught exception');
  setTimeout(() => process.exit(1), 100);
});

// 11. Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logAppEvent('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version
  });

  // Verify DB connections
  setTimeout(async () => {
    try {
      const neo4jHealthy = await neo4jService.verifyConnectivity();
      const supabaseHealthy = await supabaseService.verifyConnectivity();
      logAppEvent('Database health check completed', {
        neo4j: neo4jHealthy,
        supabase: supabaseHealthy
      });
    } catch (err) {
      logger.error({ err }, 'Database health check failed');
    }
  }, 1000);
});

// 12. Graceful shutdown
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    logAppEvent(`Received ${signal}, shutting down gracefully`);
    server.close(() => {
      logAppEvent('Server closed, process exiting');
      process.exit(0);
    });
  });
});

export default app;
