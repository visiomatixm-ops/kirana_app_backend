import { Router } from 'express';
import authRoutes      from './modules/auth/auth.routes';
import shopRoutes      from './modules/shop/shop.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import customersRoutes from './modules/customers/customers.routes';
import billingRoutes   from './modules/billing/billing.routes';
import reportsRoutes   from './modules/reports/reports.routes';
import { authenticate } from './middleware/auth.middleware';
import khataRoutes from './modules/khata/khata.routes';

const api = Router();

// ── Public ─────────────────────────────────────────────────────────────────
api.use('/auth', authRoutes);

// ── Protected (JWT required for everything below) ───────────────────────────
api.use(authenticate);
api.use('/shop',      shopRoutes);
api.use('/inventory', inventoryRoutes);
api.use('/customers', customersRoutes);
api.use('/bills',     billingRoutes);
api.use('/reports',   reportsRoutes);
api.use('/khata', khataRoutes);

export default api;
