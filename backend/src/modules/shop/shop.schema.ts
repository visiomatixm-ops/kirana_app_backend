import { z } from 'zod';

export const createShopSchema = z.object({
  name:    z.string().min(2, 'Shop name must be at least 2 characters').max(100),
  gstin:   z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  phone:   z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
  email:   z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
});

export const updateShopSchema = createShopSchema.partial();

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
