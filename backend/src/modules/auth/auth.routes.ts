/**
 * Auth Routes
 * POST /api/auth/register  — create new owner account + return JWT
 * POST /api/auth/login     — verify credentials + return JWT
 * GET  /api/auth/me        — return current user profile (protected)
 */

import { Router } from 'express';
import { register, login, me } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        authenticate, me);  // only this route needs auth

export default router;
