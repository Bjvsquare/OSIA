import { z } from 'zod';

/**
 * Validation schemas for check-in MVP
 * Ensures all input data is safe and typed before reaching services
 */

export const EmotionEnum = z.enum([
  'Energized',
  'Stressed',
  'Curious',
  'Grounded',
  'Flowing',
  'Stuck',
  'Overwhelmed',
  'Reflective'
]);

export const CheckInSchema = z.object({
  emotion: EmotionEnum,
  energy_level: z
    .number()
    .min(0, 'Energy level must be at least 0')
    .max(100, 'Energy level must be at most 100')
    .int('Energy level must be an integer'),
  context: z
    .string()
    .max(500, 'Context must be 500 characters or less')
    .optional()
});

export type CheckInInput = z.infer<typeof CheckInSchema>;

export const CheckInResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  emotion: EmotionEnum,
  energy_level: z.number().int(),
  context: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type CheckInResponse = z.infer<typeof CheckInResponseSchema>;

/**
 * Validation for auth endpoints
 */
export const SignupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less'),
  name: z
    .string()
    .max(100, 'Name must be 100 characters or less')
    .optional()
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Error formatter for Zod validation errors
 */
export function formatValidationError(error: z.ZodError) {
  return {
    message: 'Validation error',
    errors: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  };
}
