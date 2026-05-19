import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../utils/jwt';
import { unauthorized } from '../utils/response';

// Extend Express Request to carry the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
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
