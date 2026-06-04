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
import admin from "../../config/firebase";
import { prisma } from "../../config/prisma";
import { signToken } from "../../utils/jwt";
import bcrypt from "bcryptjs";

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
  console.log(req.body);
  const parsed = googleSchema.safeParse(req.body);
  
  if (!parsed.success) {
    fail(res, 'Validation failed');
    return;
  }

  try {
    const result = await loginWithGoogle(parsed.data);
    ok(res, result);
  } catch (err) {
    const errorCode =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    const message =
      errorCode === 'P1001'
        ? 'Database unavailable. Please check the database connection.'
        : err instanceof Error ? err.message : 'Google login failed';
    const lower = message.toLowerCase();

    // If server is misconfigured, this shouldn't be a generic 500
    const status =
      errorCode === 'P1001' ? 503 : lower.includes('not configured') ? 503 : lower.includes('configured') ? 500 : 400;

    // Ensure we can see the real reason of the error in server logs
    console.error('[googleLogin] failed:', {
      message,
      hasErr: err instanceof Error,
      err,
    });

    fail(res, message, status);
  }
}

export async function firebasePhoneLogin(
  req: Request,
  res: Response
) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      fail(res, "Firebase token required");
      return;
    }

    const decoded =
      await admin
        .auth()
        .verifyIdToken(idToken);

    const phone =
      decoded.phone_number;

    if (!phone) {
      fail(
        res,
        "Phone number not found"
      );
      return;
    }

    let user =
      await prisma.user.findUnique({
        where: { phone },
      });

    if (!user) {

      const passwordHash =
        await bcrypt.hash(
          Math.random()
            .toString(36),
          10
        );

      user =
        await prisma.user.create({
          data: {
            phone,
            name:
              `User-${phone.slice(-4)}`,
            passwordHash,
            role: "OWNER",
          },
        });

    }

    const token =
      signToken({
        userId: user.id,
        shopId: user.shopId,
        role: user.role,
      });

    ok(res, {
      token,
      user,
    });

  } catch (err) {

    console.error(err);

    fail(
      res,
      "Firebase login failed"
    );

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
