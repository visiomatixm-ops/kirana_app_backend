/**
 * auth.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles HTTP layer only — validates input, calls service, sends response.
 */

import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import { registerUser, loginUser, getCurrentUser } from './auth.service';
import { ok, created, fail, serverError } from '../../utils/response';

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed');
    return;
  }

  try {
    const result = await registerUser(parsed.data);
    created(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    fail(res, message);
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed');
    return;
  }

  try {
    const result = await loginUser(parsed.data);
    ok(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    fail(res, message, 401);
  }
}

// GET /api/auth/me  (protected — req.user set by auth middleware)
export async function me(req: Request, res: Response) {
  try {
    const user = await getCurrentUser(req.user!.userId);
    ok(res, user);
  } catch (err) {
    serverError(res);
  }
}
