/**
 * auth.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure business logic — no req/res here.
 * Controller calls these; service talks to Prisma.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { signToken } from '../../utils/jwt';
import type { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 10;

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

// ── Get current user ──────────────────────────────────────────────────────────

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      name:      true,
      phone:     true,
      role:      true,
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
