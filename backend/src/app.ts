import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import api from './router';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', api);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
