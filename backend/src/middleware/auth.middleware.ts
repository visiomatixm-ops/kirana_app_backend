import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../utils/jwt';
import { unauthorized } from '../utils/response';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

// Extend Express Request to carry the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const INVENTORY_PRODUCT_ROUTE = /^\/inventory\/products(\/|$)/;

function isInventoryProductBypassRoute(req: Request): boolean {
  const bypassMethods = ['GET', 'PATCH', 'DELETE'];
  return bypassMethods.includes(req.method) && INVENTORY_PRODUCT_ROUTE.test(req.path);
}

function allowsDevInventoryBypass(req: Request): boolean {
  return env.NODE_ENV === 'development' && isInventoryProductBypassRoute(req);
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  // Local dev only: allow unauthenticated GETs for inventory product routes
  if (allowsDevInventoryBypass(req)) {
    try {
      let shop = await prisma.shop.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!shop) {
        shop = await prisma.shop.create({
          data: {
            name: 'Default Dev Shop',
          },
          select: { id: true },
        });
      }
      req.user = {
        userId: 'dev-bypass',
        shopId: shop.id,
        role: 'owner',
      };
      next();
      return;
    } catch (err) {
      console.error('Dev auth bypass error:', err);
      unauthorized(res, 'Dev auth bypass failed');
      return;
    }
  }

  if (!header?.startsWith('Bearer ')) {
    unauthorized(res);
    return;
  }

  const token = header.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    unauthorized(res, 'Invalid or expired token');
  }
}
