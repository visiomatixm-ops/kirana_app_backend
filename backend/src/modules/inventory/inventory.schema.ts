/**
 * inventory.schema.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zod schemas for all inventory-related request bodies.
 */

import { z } from 'zod';

// ── Create / Update Product ───────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(1, 'Product name cannot be empty')
    .max(120),

  unit: z.string().min(1).max(20).default('pcs'),

  mrp: z
    .number({ required_error: 'MRP is required' })
    .positive('MRP must be a positive number'),

  costPrice: z
    .number({ required_error: 'Cost price is required' })
    .nonnegative('Cost price cannot be negative'),

  stock: z.number().nonnegative('Stock cannot be negative').default(0),

  lowStock: z
    .number()
    .nonnegative('Low-stock threshold cannot be negative')
    .default(5),
});

export const updateProductSchema = createProductSchema.partial();

// ── Stock Adjustment ──────────────────────────────────────────────────────────

export const adjustStockSchema = z.object({
  type: z.enum(['ADD', 'SELL', 'ADJUST'], {
    required_error: 'Adjustment type is required (ADD | SELL | ADJUST)',
  }),

  qty: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than 0'),

  note: z.string().max(255).optional(),
});

// ── Inferred Types ────────────────────────────────────────────────────────────

export type CreateProductInput  = z.infer<typeof createProductSchema>;
export type UpdateProductInput  = z.infer<typeof updateProductSchema>;
export type AdjustStockInput    = z.infer<typeof adjustStockSchema>;
