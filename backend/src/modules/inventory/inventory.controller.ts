/**
 * inventory.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles HTTP layer only — validates input, calls service, sends response.
 */

import type { Request, Response } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
} from './inventory.schema';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getStockLogs,
  getLowStockProducts,
} from './inventory.service';
import { ok, created, fail, notFound, serverError } from '../../utils/response';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely coerce an Express route param (which may be string | string[]) to string */
function param(req: Request, key: string): string {
  return Array.isArray(req.params[key]) ? req.params[key][0] : (req.params[key] as string);
}

function requireShopId(req: Request, res: Response): string | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    fail(res, 'You must set up a shop before managing inventory', 403);
    return null;
  }
  return shopId;
}

// GET /api/inventory/products
export async function getProducts(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const products = await listProducts(shopId);
    ok(res, products);
  } catch (err) {
    serverError(res);
  }
}

// GET /api/inventory/products/low-stock
export async function getLowStock(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const products = await getLowStockProducts(shopId);
    ok(res, products);
  } catch (err) {
    serverError(res);
  }
}

// GET /api/inventory/products/:id
export async function getProductById(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const product = await getProduct(param(req, 'id'), shopId);
    ok(res, product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch product';
    if (message === 'Product not found') {
      notFound(res, message);
    } else {
      serverError(res);
    }
  }
}

// POST /api/inventory/products
export async function addProduct(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  try {
    const product = await createProduct(shopId, parsed.data);
    created(res, product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product';
    fail(res, message);
  }
}

// PATCH /api/inventory/products/:id
export async function editProduct(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  try {
    const product = await updateProduct(param(req, 'id'), shopId, parsed.data);
    ok(res, product);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product';
    if (message === 'Product not found') {
      notFound(res, message);
    } else {
      fail(res, message);
    }
  }
}

// DELETE /api/inventory/products/:id
export async function removeProduct(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const result = await deleteProduct(param(req, 'id'), shopId);
    ok(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete product';
    if (message === 'Product not found') {
      notFound(res, message);
    } else {
      fail(res, message);
    }
  }
}

// POST /api/inventory/products/:id/adjust-stock
export async function adjustProductStock(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  const parsed = adjustStockSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed: ' + parsed.error.errors.map((e) => e.message).join(', '));
    return;
  }

  try {
    const result = await adjustStock(param(req, 'id'), shopId, parsed.data);
    ok(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to adjust stock';
    if (message === 'Product not found') {
      notFound(res, message);
    } else {
      fail(res, message);
    }
  }
}

// GET /api/inventory/products/:id/logs
export async function getProductLogs(req: Request, res: Response) {
  const shopId = requireShopId(req, res);
  if (!shopId) return;

  try {
    const data = await getStockLogs(param(req, 'id'), shopId);
    ok(res, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch logs';
    if (message === 'Product not found') {
      notFound(res, message);
    } else {
      serverError(res);
    }
  }
}
