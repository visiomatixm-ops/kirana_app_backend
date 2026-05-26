/**
 * auth.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles HTTP layer only — validates input, calls service, sends response.
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { registerSchema, loginSchema } from './auth.schema';
import { registerUser, loginUser, loginWithGoogle, getCurrentUser, uploadProfilePhoto, removeProfilePhoto } from './auth.service';
import { ok, created, fail, serverError } from '../../utils/response';

const googleSchema = z.object({
  idToken: z.string({ required_error: 'idToken is required' }).min(1, 'idToken is required'),
});

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

// POST /api/auth/google
export async function googleLogin(req: Request, res: Response) {
  const parsed = googleSchema.safeParse(req.body);
  if (!parsed.success) {
    fail(res, 'Validation failed');
    return;
  }

  try {
    const result = await loginWithGoogle(parsed.data);
    ok(res, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google login failed';
    const status = message.includes('configured') ? 500 : 400;
    fail(res, message, status);
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

// POST /api/auth/avatar  (protected — multipart upload)
export async function uploadAvatar(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    fail(res, 'No file uploaded. Send image as multipart/form-data field "avatar"');
    return;
  }

  try {
    const user = await uploadProfilePhoto(req.user!.userId, file);
    ok(res, user);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Avatar upload failed';
    fail(res, message);
  }
}

// DELETE /api/auth/avatar
export async function removeAvatar(req: Request, res: Response) {
  try {
    const user = await removeProfilePhoto(req.user!.userId);
    ok(res, user);
  } catch {
    serverError(res);
  }
}
