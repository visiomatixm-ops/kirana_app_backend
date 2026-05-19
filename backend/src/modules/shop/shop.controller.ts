/**
 * shop.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HTTP layer — validates input, calls service, sends response.
 * req.user is guaranteed by the authenticate middleware applied in router.ts.
 */

import type { Request, Response } from 'express';
import { createShopSchema, updateShopSchema } from './shop.schema';
import {
  getShop,
  createShop,
  updateShop,
  uploadLogo,
  uploadSignature,
  removeAsset,
} from './shop.service';
import { ok, created, fail, notFound, serverError } from '../../utils/response';

// ── Helper: resolve shopId or fail early ─────────────────────────────────────
function resolveShopId(req: Request, res: Response): string | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    fail(res, 'No shop linked to your account. Create a shop first.', 404);
    return null;
  }
  return shopId;
}

// GET /api/shop
export async function getShopHandler(req: Request, res: Response) {
  const shopId = resolveShopId(req, res);
  if (!shopId) return;
  try {
    const shop = await getShop(shopId);
    ok(res, shop);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch shop';
    notFound(res, msg);
  }
}

// POST /api/shop  — create new shop
export async function createShopHandler(req: Request, res: Response) {
  const parsed = createShopSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed');
    return;
  }
  try {
    const shop = await createShop(req.user!.userId, parsed.data);
    created(res, shop);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create shop';
    fail(res, msg);
  }
}

// PATCH /api/shop  — partial update
export async function updateShopHandler(req: Request, res: Response) {
  const shopId = resolveShopId(req, res);
  if (!shopId) return;

  const parsed = updateShopSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed');
    return;
  }
  try {
    const shop = await updateShop(shopId, parsed.data);
    ok(res, shop);
  } catch (err) {
    serverError(res);
  }
}

// POST /api/shop/logo  — upload logo image
export async function uploadLogoHandler(req: Request, res: Response) {
  const shopId = resolveShopId(req, res);
  if (!shopId) return;

  const file = req.file;
  if (!file) {
    fail(res, 'No file uploaded. Send image as multipart/form-data field "logo"');
    return;
  }
  try {
    const shop = await uploadLogo(shopId, file);
    ok(res, shop);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Logo upload failed';
    fail(res, msg);
  }
}

// POST /api/shop/signature  — upload signature image
export async function uploadSignatureHandler(req: Request, res: Response) {
  const shopId = resolveShopId(req, res);
  if (!shopId) return;

  const file = req.file;
  if (!file) {
    fail(res, 'No file uploaded. Send image as multipart/form-data field "signature"');
    return;
  }
  try {
    const shop = await uploadSignature(shopId, file);
    ok(res, shop);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature upload failed';
    fail(res, msg);
  }
}

// DELETE /api/shop/logo
export async function removeLogoHandler(req: Request, res: Response) {
  const shopId = resolveShopId(req, res);
  if (!shopId) return;
  try {
    const shop = await removeAsset(shopId, 'logoUrl');
    ok(res, shop);
  } catch {
    serverError(res);
  }
}

// DELETE /api/shop/signature
export async function removeSignatureHandler(req: Request, res: Response) {
  const shopId = resolveShopId(req, res);
  if (!shopId) return;
  try {
    const shop = await removeAsset(shopId, 'signatureUrl');
    ok(res, shop);
  } catch {
    serverError(res);
  }
}
