/**
 * inventory.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure business logic — no req/res here.
 * Controller calls these; service talks to Prisma.
 */

import { prisma } from '../../config/prisma';
import type { CreateProductInput, UpdateProductInput, AdjustStockInput } from './inventory.schema';

// ── List Products ─────────────────────────────────────────────────────────────

export async function listProducts(shopId: string) {
  const products = await prisma.product.findMany({
    where: { shopId },
    orderBy: { name: 'asc' },
    select: {
      id:        true,
      name:      true,
      unit:      true,
      mrp:       true,
      costPrice: true,
      stock:     true,
      lowStock:  true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Attach a convenience flag for low-stock alerting
  return products.map((p) => ({
    ...p,
    isLowStock: p.stock <= p.lowStock,
  }));
}

// ── Get Single Product ────────────────────────────────────────────────────────

export async function getProduct(productId: string, shopId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
    select: {
      id:        true,
      name:      true,
      unit:      true,
      mrp:       true,
      costPrice: true,
      stock:     true,
      lowStock:  true,
      createdAt: true,
      updatedAt: true,
      stockLogs: {
        orderBy: { createdAt: 'desc' },
        take:    20,
        select: {
          id:        true,
          type:      true,
          qty:       true,
          note:      true,
          createdAt: true,
        },
      },
    },
  });

  if (!product) throw new Error('Product not found');

  return { ...product, isLowStock: product.stock <= product.lowStock };
}

// ── Create Product ────────────────────────────────────────────────────────────

export async function createProduct(shopId: string, input: CreateProductInput) {
  // Ensure shop exists
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error('Shop not found. Please set up your shop first.');

  const product = await prisma.product.create({
    data: {
      shopId,
      name:      input.name,
      unit:      input.unit,
      mrp:       input.mrp,
      costPrice: input.costPrice,
      stock:     input.stock,
      lowStock:  input.lowStock,
    },
    select: {
      id:        true,
      name:      true,
      unit:      true,
      mrp:       true,
      costPrice: true,
      stock:     true,
      lowStock:  true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Log initial stock as an ADD entry if stock > 0
  if (product.stock > 0) {
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        type:      'ADD',
        qty:       product.stock,
        note:      'Initial stock on product creation',
      },
    });
  }

  return { ...product, isLowStock: product.stock <= product.lowStock };
}

// ── Update Product ────────────────────────────────────────────────────────────

export async function updateProduct(
  productId: string,
  shopId: string,
  input: UpdateProductInput,
) {
  // Verify ownership
  const existing = await prisma.product.findFirst({ where: { id: productId, shopId } });
  if (!existing) throw new Error('Product not found');

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(input.name      !== undefined && { name:      input.name }),
      ...(input.unit      !== undefined && { unit:      input.unit }),
      ...(input.mrp       !== undefined && { mrp:       input.mrp }),
      ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
      ...(input.lowStock  !== undefined && { lowStock:  input.lowStock }),
      // NOTE: stock is intentionally NOT updated here.
      // Use the /adjust-stock endpoint to modify stock levels with proper logging.
    },
    select: {
      id:        true,
      name:      true,
      unit:      true,
      mrp:       true,
      costPrice: true,
      stock:     true,
      lowStock:  true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ...product, isLowStock: product.stock <= product.lowStock };
}

// ── Delete Product ────────────────────────────────────────────────────────────

export async function deleteProduct(productId: string, shopId: string) {
  // Verify ownership
  const existing = await prisma.product.findFirst({ where: { id: productId, shopId } });
  if (!existing) throw new Error('Product not found');

  // Prevent deletion if product is used in any bill
  const linkedBillItem = await prisma.billItem.findFirst({ where: { productId } });
  if (linkedBillItem) {
    throw new Error(
      'Cannot delete product — it is referenced in existing bills. Deactivate it instead.',
    );
  }

  // Delete inventory logs first (no cascade configured in schema)
  await prisma.inventoryLog.deleteMany({ where: { productId } });
  await prisma.product.delete({ where: { id: productId } });

  return { deleted: true, id: productId };
}

// ── Adjust Stock ──────────────────────────────────────────────────────────────

export async function adjustStock(
  productId: string,
  shopId: string,
  input: AdjustStockInput,
) {
  // Verify ownership
  const product = await prisma.product.findFirst({ where: { id: productId, shopId } });
  if (!product) throw new Error('Product not found');

  // Calculate new stock level based on adjustment type
  let newStock: number;
  switch (input.type) {
    case 'ADD':
      newStock = product.stock + input.qty;
      break;
    case 'SELL':
      newStock = product.stock - input.qty;
      if (newStock < 0) {
        throw new Error(
          `Insufficient stock. Available: ${product.stock} ${product.unit}`,
        );
      }
      break;
    case 'ADJUST':
      // ADJUST sets the stock to the exact qty provided
      newStock = input.qty;
      break;
  }

  // Transactionally update stock + log the change
  const [updatedProduct, log] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data:  { stock: newStock },
      select: {
        id:        true,
        name:      true,
        unit:      true,
        mrp:       true,
        costPrice: true,
        stock:     true,
        lowStock:  true,
        updatedAt: true,
      },
    }),
    prisma.inventoryLog.create({
      data: {
        productId,
        type: input.type,
        qty:  input.qty,
        note: input.note ?? null,
      },
      select: {
        id:        true,
        type:      true,
        qty:       true,
        note:      true,
        createdAt: true,
      },
    }),
  ]);

  return {
    product: { ...updatedProduct, isLowStock: updatedProduct.stock <= updatedProduct.lowStock },
    log,
  };
}

// ── Get Stock Logs ────────────────────────────────────────────────────────────

export async function getStockLogs(productId: string, shopId: string) {
  // Verify ownership
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
    select: { id: true, name: true, unit: true },
  });
  if (!product) throw new Error('Product not found');

  const logs = await prisma.inventoryLog.findMany({
    where:   { productId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      type:      true,
      qty:       true,
      note:      true,
      createdAt: true,
    },
  });

  return { product, logs };
}

// ── Low-Stock Summary ─────────────────────────────────────────────────────────

export async function getLowStockProducts(shopId: string) {
  const products = await prisma.product.findMany({
    where: { shopId },
    select: {
      id:       true,
      name:     true,
      unit:     true,
      stock:    true,
      lowStock: true,
    },
  });

  return products.filter((p) => p.stock <= p.lowStock);
}
