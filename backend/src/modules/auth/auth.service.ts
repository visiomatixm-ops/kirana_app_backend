/**
 * auth.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure business logic — no req/res here.
 * Controller calls these; service talks to Prisma.
 */

import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../config/prisma';
import { storeFile } from '../../middleware/upload.middleware';
import { signToken } from '../../utils/jwt';
import type { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 10;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client();

type GoogleLoginInput = {
  idToken: string;
};

// ── Register ──────────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  // Prevent duplicate phone numbers
  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
  });
  if (existing) {
    throw new Error('An account with this phone number already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name:         input.name,
      phone:        input.phone,
      passwordHash,
      role:         'OWNER',
    },
    select: {
      id:        true,
      name:      true,
      phone:     true,
      role:      true,
      avatarUrl: true,
      shopId:    true,
      createdAt: true,
    },
  });

  const token = signToken({
    userId: user.id,
    shopId: user.shopId,
    role:   user.role,
  });

  return { user, token };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { phone: input.phone },
    select: {
      id:           true,
      name:         true,
      phone:        true,
      role:         true,
      avatarUrl:    true,
      shopId:       true,
      passwordHash: true,
      createdAt:    true,
    },
  });

  if (!user) {
    throw new Error('Invalid phone number or password');
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new Error('Invalid phone number or password');
  }

  const token = signToken({
    userId: user.id,
    shopId: user.shopId,
    role:   user.role,
  });

  // Never send passwordHash to client
  const { passwordHash: _removed, ...safeUser } = user;

  return { user: safeUser, token };
}

// ── Google OAuth Login ───────────────────────────────────────────────────────

export async function loginWithGoogle(input: GoogleLoginInput) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google client ID is not configured');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: input.idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    if (err instanceof Error) {
      const lower = err.message.toLowerCase();
      if (lower.includes('expired') || lower.includes('token used too late')) {
        throw new Error('Google ID token has expired');
      }
      if (lower.includes('invalid') || lower.includes('audience') || lower.includes('wrong number of segments')) {
        throw new Error('Invalid Google ID token');
      }
    }
    throw new Error('Google token verification failed');
  }

  if (!payload) {
    throw new Error('Google token verification failed');
  }

  const email = payload.email;
  const name = payload.name || 'Google User';
  const picture = payload.picture || null;

  if (!email) {
    throw new Error('Google account email is required');
  }

  const existingUser = await prisma.user.findUnique({
    where: { phone: email },
    select: {
      id:        true,
      name:      true,
      phone:     true,
      role:      true,
      avatarUrl: true,
      shopId:    true,
    },
  });

  const user = existingUser ?? await prisma.user.create({
    data: {
      name,
      phone: email,
      passwordHash: await bcrypt.hash(Math.random().toString(36).slice(2), SALT_ROUNDS),
      role: 'OWNER',
      avatarUrl: picture,
    },
    select: {
      id:        true,
      name:      true,
      phone:     true,
      role:      true,
      avatarUrl: true,
      shopId:    true,
    },
  });

  const token = signToken({
    userId: user.id,
    shopId: user.shopId,
    role:   user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email,
      name: user.name,
      avatar: user.avatarUrl ?? null,
    },
  };
}

// ── Get current user ──────────────────────────────────────────────────────────

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      name:      true,
      phone:     true,
      role:      true,
      avatarUrl: true,
      shopId:    true,
      createdAt: true,
      shop: {
        select: {
          id:      true,
          name:    true,
          gstin:   true,
          logoUrl: true,
        },
      },
    },
  });

  if (!user) throw new Error('User not found');
  return user;
}

// ── Upload profile photo ─────────────────────────────────────────────────────

export async function uploadProfilePhoto(
  userId: string,
  file: Express.Multer.File,
) {
  const avatarUrl = await storeFile(file, 'kirana/avatars', `user_${userId}_avatar`);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id:        true,
      name:      true,
      phone:     true,
      role:      true,
      avatarUrl: true,
      shopId:    true,
      createdAt: true,
      shop: {
        select: {
          id:      true,
          name:    true,
          gstin:   true,
          logoUrl: true,
        },
      },
    },
  });

  return user;
}

// ── Remove profile photo ────────────────────────────────────────────────────

export async function removeProfilePhoto(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
    select: {
      id:        true,
      name:      true,
      phone:     true,
      role:      true,
      avatarUrl: true,
      shopId:    true,
      createdAt: true,
      shop: {
        select: {
          id:      true,
          name:    true,
          gstin:   true,
          logoUrl: true,
        },
      },
    },
  });

  return user;
}
