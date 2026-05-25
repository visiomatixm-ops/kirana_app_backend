/**
 * shop.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Business logic for shop profile management.
 * All DB access goes through Prisma here — controllers stay clean.
 */

import { prisma }   from '../../config/prisma';
import { storeFile } from '../../middleware/upload.middleware';
import { signToken } from '../../utils/jwt';
import type { CreateShopInput, UpdateShopInput } from './shop.schema';

// ─── Safe shop fields returned to client ──────────────────────────────────────

const SHOP_SELECT = {
  id:          true,
  name:        true,
  gstin:       true,
  phone:       true,
  email:       true,
  address:     true,
  pincode:     true,
  logoUrl:     true,
  signatureUrl:true,
  createdAt:   true,
  updatedAt:   true,
} as const;

// ─── Get shop (by shopId from JWT) ────────────────────────────────────────────

export async function getShop(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where:  { id: shopId },
    select: SHOP_SELECT,
  });
  if (!shop) throw new Error('Shop not found');
  return shop;
}

// ─── Create shop + link to user ───────────────────────────────────────────────

export async function createShop(userId: string, input: CreateShopInput) {
  // One user can only have one shop
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.shopId) throw new Error('You already have a shop. Use update instead.');

  const shop = await prisma.shop.create({
    data: {
      name:    input.name,
      gstin:   input.gstin   || null,
      phone:   input.phone   || null,
      email:   input.email   || null,
      address: input.address || null,
      pincode: input.pincode || null,
      users:   { connect: { id: userId } },
    },
    select: SHOP_SELECT,
  });

  // Update user's shopId
  //! This is redundant since we have the relation, but it makes querying easier and is needed for JWT claims
await prisma.user.update({
    where: { id: userId },
    data:  { shopId: shop.id },
  });

  const token = signToken({ userId, shopId: shop.id, role: user.role });
  return { shop, token };
}
// ─── Update shop profile ──────────────────────────────────────────────────────

export async function updateShop(shopId: string, input: UpdateShopInput) {
  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(input.name    !== undefined && { name:    input.name    }),
      ...(input.gstin   !== undefined && { gstin:   input.gstin   || null }),
      ...(input.phone   !== undefined && { phone:   input.phone   || null }),
      ...(input.email   !== undefined && { email:   input.email   || null }),
      ...(input.address !== undefined && { address: input.address || null }),
      ...(input.pincode !== undefined && { pincode: input.pincode || null }),
    },
    select: SHOP_SELECT,
  });
  return shop;
}

// ─── Upload logo ──────────────────────────────────────────────────────────────

export async function uploadLogo(
  shopId: string,
  file: Express.Multer.File,
) {
  const logoUrl = await storeFile(file, 'kirana/logos', `shop_${shopId}_logo`);

  const shop = await prisma.shop.update({
    where:  { id: shopId },
    data:   { logoUrl },
    select: SHOP_SELECT,
  });
  return shop;
}

// ─── Upload signature ─────────────────────────────────────────────────────────

export async function uploadSignature(
  shopId: string,
  file: Express.Multer.File,
) {
  const signatureUrl = await storeFile(
    file,
    'kirana/signatures',
    `shop_${shopId}_signature`,
  );

  const shop = await prisma.shop.update({
    where:  { id: shopId },
    data:   { signatureUrl },
    select: SHOP_SELECT,
  });
  return shop;
}

// ─── Delete logo / signature ──────────────────────────────────────────────────

export async function removeAsset(
  shopId: string,
  field: 'logoUrl' | 'signatureUrl',
) {
  const shop = await prisma.shop.update({
    where:  { id: shopId },
    data:   { [field]: null },
    select: SHOP_SELECT,
  });
  return shop;
}
