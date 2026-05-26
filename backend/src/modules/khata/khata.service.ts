/**
 * khata.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure business logic — no req/res here.
 * Controller calls these; service talks to Prisma.
 */

import { prisma } from '../../config/prisma';
import type { CreateKhataInput, UpdateKhataInput, AddPaymentInput } from './khata.schema';

// ── Reusable select objects ───────────────────────────────────────────────────

const KHATA_SELECT = {
  id:            true,
  shopId:        true,
  customerName:  true,
  customerPhone: true,
  pendingAmount: true,
  address:       true,
  note:          true,
  createdAt:     true,
  updatedAt:     true,
} as const;

const PAYMENT_SELECT = {
  id:        true,
  khataId:   true,
  amount:    true,
  note:      true,
  createdAt: true,
} as const;

// ── List All Khata ────────────────────────────────────────────────────────────

export async function listKhata(shopId: string) {
  return prisma.khata.findMany({
    where:   { shopId },
    orderBy: { createdAt: 'desc' },
    select:  KHATA_SELECT,
  });
}

// ── Get Single Khata (with full payment history) ──────────────────────────────

export async function getKhata(khataId: string, shopId: string) {
  const khata = await prisma.khata.findFirst({
    where:  { id: khataId, shopId },
    select: {
      ...KHATA_SELECT,
      payments: {
        orderBy: { createdAt: 'desc' },
        select:  PAYMENT_SELECT,
      },
    },
  });

  if (!khata) throw new Error('Khata entry not found');
  return khata;
}

// ── Create Khata ──────────────────────────────────────────────────────────────

export async function createKhata(shopId: string, input: CreateKhataInput) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error('Shop not found. Please set up your shop first.');

  return prisma.khata.create({
    data: {
      shopId,
      customerName:  input.customerName,
      customerPhone: input.customerPhone,
      pendingAmount: input.pendingAmount,
      address:       input.address ?? null,
      note:          input.note    ?? null,
    },
    select: KHATA_SELECT,
  });
}

// ── Update Khata ──────────────────────────────────────────────────────────────

export async function updateKhata(
  khataId: string,
  shopId:  string,
  input:   UpdateKhataInput,
) {
  const existing = await prisma.khata.findFirst({ where: { id: khataId, shopId } });
  if (!existing) throw new Error('Khata entry not found');

  return prisma.khata.update({
    where: { id: khataId },
    data: {
      ...(input.customerName  !== undefined && { customerName:  input.customerName }),
      ...(input.customerPhone !== undefined && { customerPhone: input.customerPhone }),
      ...(input.address       !== undefined && { address:       input.address }),
      ...(input.note          !== undefined && { note:          input.note }),
      // NOTE: pendingAmount is NOT updatable here.
      // Use POST /khata/:id/payment to reduce the pending balance.
    },
    select: KHATA_SELECT,
  });
}

// ── Delete Khata ──────────────────────────────────────────────────────────────

export async function deleteKhata(khataId: string, shopId: string) {
  const existing = await prisma.khata.findFirst({ where: { id: khataId, shopId } });
  if (!existing) throw new Error('Khata entry not found');

  // Delete payment history first, then the khata record — atomic
  await prisma.$transaction([
    prisma.khataPayment.deleteMany({ where: { khataId } }),
    prisma.khata.delete({ where: { id: khataId } }),
  ]);

  return { deleted: true, id: khataId };
}

// ── Add Payment ───────────────────────────────────────────────────────────────

export async function addPayment(
  khataId: string,
  shopId:  string,
  input:   AddPaymentInput,
) {
  const khata = await prisma.khata.findFirst({ where: { id: khataId, shopId } });
  if (!khata) throw new Error('Khata entry not found');

  // Guard: nothing left to pay
  if (khata.pendingAmount <= 0) {
    throw new Error('No pending amount remaining for this khata entry');
  }

  // Guard: prevent overpayment
  if (input.amount > khata.pendingAmount) {
    throw new Error(
      `Payment amount (₹${input.amount}) exceeds pending balance (₹${khata.pendingAmount})`,
    );
  }

  // Round to 2 decimal places to avoid floating-point drift
  const newPendingAmount = parseFloat((khata.pendingAmount - input.amount).toFixed(2));

  // Atomic: record payment + reduce pending amount in one transaction
  const [payment, updatedKhata] = await prisma.$transaction([
    prisma.khataPayment.create({
      data:   { khataId, amount: input.amount, note: input.note ?? null },
      select: PAYMENT_SELECT,
    }),
    prisma.khata.update({
      where:  { id: khataId },
      data:   { pendingAmount: newPendingAmount },
      select: KHATA_SELECT,
    }),
  ]);

  return { payment, khata: updatedKhata };
}