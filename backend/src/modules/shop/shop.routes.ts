/**
 * Shop Routes  — all protected by authenticate (applied in router.ts)
 *
 * GET    /api/shop               — get my shop profile
 * POST   /api/shop               — create shop (first-time setup)
 * PATCH  /api/shop               — update shop details
 * POST   /api/shop/logo          — upload shop logo
 * DELETE /api/shop/logo          — remove shop logo
 * POST   /api/shop/signature     — upload owner signature
 * DELETE /api/shop/signature     — remove signature
 */

import { Router } from 'express';
import { upload } from '../../middleware/upload.middleware';
import {
  getShopHandler,
  createShopHandler,
  updateShopHandler,
  uploadLogoHandler,
  uploadSignatureHandler,
  removeLogoHandler,
  removeSignatureHandler,
} from './shop.controller';

const router = Router();

router.get('/',    getShopHandler);
router.post('/',   createShopHandler);
router.patch('/',  updateShopHandler);

// File uploads — single file, field name must match
router.post('/logo',      upload.single('logo'),      uploadLogoHandler);
router.delete('/logo',                                removeLogoHandler);
router.post('/signature', upload.single('signature'), uploadSignatureHandler);
router.delete('/signature',                           removeSignatureHandler);

export default router;
