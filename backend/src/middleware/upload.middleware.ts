/**
 * upload.middleware.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Multer config for file uploads (logo + signature).
 *
 * Files are stored in memory as Buffer so we can forward them to
 * Cloudinary (or any storage) without writing to disk.
 * Max size: 5 MB per file.
 * Allowed types: image/jpeg, image/png, image/webp.
 */

import multer from 'multer';
import type { Request } from 'express';
import { fail } from '../utils/response';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES      = 5 * 1024 * 1024; // 5 MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req: Request, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

/**
 * Convert an uploaded file buffer to a base64 data-URI.
 * Useful when Cloudinary SDK is not configured — store inline for demo.
 */
export function bufferToDataUri(file: Express.Multer.File): string {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

/**
 * Try to upload to Cloudinary if env vars are present,
 * otherwise fall back to a base64 data-URI (dev/demo mode).
 */
export async function storeFile(
  file: Express.Multer.File,
  folder: string,
  publicId: string,
): Promise<string> {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  const hasCloudinary =
    CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET;

  if (hasCloudinary) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cloudinary = require('cloudinary').v2 as {
      config: (opts: Record<string, string>) => void;
      uploader: {
        upload_stream: (
          opts: Record<string, unknown>,
          cb: (err: Error | null, res: { secure_url: string } | undefined) => void,
        ) => { end: (buf: Buffer) => void };
      };
    };

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME!,
      api_key:    CLOUDINARY_API_KEY!,
      api_secret: CLOUDINARY_API_SECRET!,
    });

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, public_id: publicId, overwrite: true },
        (err: Error | null, res: { secure_url: string } | undefined) => {
          if (err || !res) return reject(err ?? new Error('Upload failed'));
          resolve(res);
        },
      );
      stream.end(file.buffer);
    });

    return result.secure_url;
  }

  // Dev fallback: return base64 data-URI
  console.warn('[upload] Cloudinary not configured — using base64 data-URI');
  return bufferToDataUri(file);
}
