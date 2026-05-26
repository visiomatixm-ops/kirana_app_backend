/**
 * khata.schema.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zod schemas for all khata-related request bodies.
 */

import { z } from 'zod';

// ── Create Khata ──────────────────────────────────────────────────────────────

export const createKhataSchema = z.object({
  customerName: z
    .string({ required_error: 'Customer name is required' })
    .min(2, 'Customer name must be at least 2 characters')
    .max(100),

  customerPhone: z
    .string({ required_error: 'Customer phone is required' })
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  pendingAmount: z
    .number({ required_error: 'Pending amount is required' })
    .positive('Pending amount must be greater than 0'),

  address: z.string().max(300).optional(),

  note: z.string().max(500).optional(),
});

// ── Update Khata ──────────────────────────────────────────────────────────────
// pendingAmount excluded intentionally — use /payment endpoint to reduce balance

export const updateKhataSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100)
    .optional(),

  customerPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional(),

  address: z.string().max(300).nullable().optional(),

  note: z.string().max(500).nullable().optional(),
});

// ── Add Payment ───────────────────────────────────────────────────────────────

export const addPaymentSchema = z.object({
  amount: z
    .number({ required_error: 'Payment amount is required' })
    .positive('Payment amount must be greater than 0'),

  note: z.string().max(500).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CreateKhataInput = z.infer<typeof createKhataSchema>;
export type UpdateKhataInput = z.infer<typeof updateKhataSchema>;
export type AddPaymentInput  = z.infer<typeof addPaymentSchema>;