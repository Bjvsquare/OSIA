import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logValidationError } from '../utils/logger';

/**
 * Middleware factory to validate request body with Zod schema
 * Usage: app.post('/api/endpoint', validateBody(MySchema), handler)
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      // Attach validated data to request
      (req as any).validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logValidationError(req.path, error, {
          method: req.method,
          ip: req.ip
        });

        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.') || 'root',
            message: err.message
          }))
        });
      }

      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

/**
 * Middleware factory to validate query parameters with Zod schema
 * Usage: app.get('/api/endpoint', validateQuery(MySchema), handler)
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      (req as any).validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logValidationError(`${req.path} (query)`, error, {
          method: req.method,
          ip: req.ip
        });

        return res.status(400).json({
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.') || 'root',
            message: err.message
          }))
        });
      }

      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

/**
 * Middleware factory to validate params with Zod schema
 * Usage: app.get('/api/endpoint/:id', validateParams(MySchema), handler)
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      (req as any).validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logValidationError(`${req.path} (params)`, error, {
          method: req.method,
          ip: req.ip
        });

        return res.status(400).json({
          error: 'Parameter validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.') || 'root',
            message: err.message
          }))
        });
      }

      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}
