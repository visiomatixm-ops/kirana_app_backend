import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(60),

  phone: z
    .string({ required_error: 'Phone is required' })
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  phone: z
    .string({ required_error: 'Phone is required' })
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;
