import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Zod validation errors → readable field messages
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // Generic errors
  const message =
    err instanceof Error ? err.message : 'Internal server error';

  console.error('[error]', err);
  res.status(500).json({ success: false, message });
}
