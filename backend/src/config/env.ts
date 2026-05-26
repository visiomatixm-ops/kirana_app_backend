import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT:             z.string().default('3000'),
  NODE_ENV:         z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL:     z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET:       z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN:   z.string().default('7d'),
  CORS_ORIGINS:     z.string().default('http://localhost:5173'),
  GMAIL_USER:        z.string().optional(),
  GMAIL_PASSWORD:    z.string().optional(),
  GOOGLE_CLIENT_ID:  z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
