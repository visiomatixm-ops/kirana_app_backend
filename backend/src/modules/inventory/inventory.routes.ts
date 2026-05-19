/**
 * Inventory Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes are protected by the global `authenticate` middleware
 * applied in src/router.ts — no need to add it per-route here.
 *
 * GET    /api/inventory/products               — list all products (with low-stock flag)
 * GET    /api/inventory/products/low-stock     — only low-stock products
 * GET    /api/inventory/products/:id           — single product + last 20 stock logs
 * POST   /api/inventory/products               — create a product
 * PATCH  /api/inventory/products/:id           — update name/mrp/costPrice/unit/lowStock
 * DELETE /api/inventory/products/:id           — delete (blocked if used in bills)
 * POST   /api/inventory/products/:id/adjust-stock  — add / sell / adjust stock qty
 * GET    /api/inventory/products/:id/logs      — full stock audit trail
 */

import { Router } from 'express';
import {
  getProducts,
  getLowStock,
  getProductById,
  addProduct,
  editProduct,
  removeProduct,
  adjustProductStock,
  getProductLogs,
} from './inventory.controller';

const router = Router();

// ── Specific paths must come BEFORE /:id ─────────────────────────────────────
router.get('/products/low-stock', getLowStock);

// ── Products CRUD ─────────────────────────────────────────────────────────────
router.get('/products',     getProducts);
router.post('/products',    addProduct);
router.get('/products/:id', getProductById);
router.patch('/products/:id',  editProduct);
router.delete('/products/:id', removeProduct);

// ── Stock management ──────────────────────────────────────────────────────────
router.post('/products/:id/adjust-stock', adjustProductStock);
router.get('/products/:id/logs',          getProductLogs);

export default router;
