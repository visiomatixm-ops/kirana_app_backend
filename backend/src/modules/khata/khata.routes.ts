/**
 * Khata Routes  — all protected by authenticate (applied in router.ts)
 *
 * GET    /api/khata              — list all khata for shop
 * POST   /api/khata              — create new khata entry
 * GET    /api/khata/:id          — single khata + payment history
 * PATCH  /api/khata/:id          — update customer info / note / address
 * DELETE /api/khata/:id          — delete khata + payment history
 * POST   /api/khata/:id/payment  — record payment, reduce pending amount
 */

import { Router } from 'express';
import {
  getKhataList,
  getKhataById,
  addKhata,
  editKhata,
  removeKhata,
  addKhataPayment,
} from './khata.controller';

const router = Router();

// Specific paths BEFORE /:id
router.post('/:id/payment', addKhataPayment);

router.get('/',       getKhataList);
router.post('/',      addKhata);
router.get('/:id',    getKhataById);
router.patch('/:id',  editKhata);
router.delete('/:id', removeKhata);

export default router;