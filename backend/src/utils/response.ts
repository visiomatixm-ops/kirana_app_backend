import type { Response } from 'express';

/** Send a success response */
export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/** Send a created response */
export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

/** Send an error response */
export function fail(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

/** 401 Unauthorized */
export function unauthorized(res: Response, message = 'Unauthorized') {
  return fail(res, message, 401);
}

/** 404 Not Found */
export function notFound(res: Response, message = 'Not found') {
  return fail(res, message, 404);
}

/** 500 Server Error */
export function serverError(res: Response, message = 'Internal server error') {
  return fail(res, message, 500);
}
