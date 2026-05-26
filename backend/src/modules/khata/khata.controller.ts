/**
 * khata.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles HTTP layer only — validates input, calls service, sends response.
 */

import type { Request, Response } from 'express';
import { createKhataSchema, updateKhataSchema, addPaymentSchema } from './khata.schema';
import { listKhata, getKhata, createKhata, updateKhata, deleteKhata, addPayment } from './khata.service';
import { ok, created, fail, notFound, serverError } from '../../utils/response';

// ── Helpers ───────────────────────────────────────────────────────────────────

function param(req: Request, key: string): string {
  return Array.isArray(req.params[key]) ? req.params[key][0] : (req.params[key] as string);
}

function requireShopId(req: Request, res: Response): string | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    fail(res, 'You must set up a shop before managing khata entries', 403);
    return null;
  }
  return shopId;
}

// ── GET /api/khata ────────────────────────────────────────────────────────────

export async function getKhataList(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const entries = await listKhata(shopId);
    ok(res, entries);
  } catch {
    serverError(res);
  }
}

// ── GET /api/khata/:id ────────────────────────────────────────────────────────

export async function getKhataById(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const entry = await getKhata(param(req, 'id'), shopId);
    ok(res, entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch khata entry';
    if (message === 'Khata entry not found') notFound(res, message);
    else serverError(res);
  }
}

// ── POST /api/khata ───────────────────────────────────────────────────────────

export async function addKhata(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  const parsed = createKhataSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  try {
    const entry = await createKhata(shopId, parsed.data);
    created(res, entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create khata entry';
    fail(res, message);
  }
}

// ── PATCH /api/khata/:id ──────────────────────────────────────────────────────

export async function editKhata(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  const parsed = updateKhataSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  try {
    const entry = await updateKhata(param(req, 'id'), shopId, parsed.data);
    ok(res, entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update khata entry';
    if (message === 'Khata entry not found') notFound(res, message);
    else fail(res, message);
  }
}

// ── DELETE /api/khata/:id ─────────────────────────────────────────────────────

export async function removeKhata(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const result = await deleteKhata(param(req, 'id'), shopId);
    ok(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete khata entry';
    if (message === 'Khata entry not found') notFound(res, message);
    else fail(res, message);
  }
}

// ── POST /api/khata/:id/payment ───────────────────────────────────────────────

export async function addKhataPayment(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  const parsed = addPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  try {
    const result = await addPayment(param(req, 'id'), shopId, parsed.data);
    created(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add payment';
    if (message === 'Khata entry not found') notFound(res, message);
    else fail(res, message);
  }
}