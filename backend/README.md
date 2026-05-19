# Kirana Enterprise — Backend API

Node.js + Express + TypeScript + Prisma + PostgreSQL

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 3. Generate Prisma client + run migrations
npm run db:generate
npm run db:migrate

# 4. Start dev server (hot reload)
npm run dev
```

Server starts at **http://localhost:3000**
Health check: **GET /health**

---

## Project Structure

```
src/
├── server.ts          ← entry point (starts HTTP server)
├── app.ts             ← Express app (middleware, routes)
├── router.ts          ← mounts all module routes under /api
├── config/
│   ├── env.ts         ← validated env vars (Zod)
│   └── prisma.ts      ← Prisma client singleton
├── middleware/
│   ├── auth.middleware.ts   ← JWT bearer token check
│   └── error.middleware.ts  ← global error + Zod error handler
├── utils/
│   ├── jwt.ts         ← signToken / verifyToken
│   └── response.ts    ← ok / fail / created / notFound helpers
├── types/
│   └── index.ts       ← shared TypeScript types
├── modules/
│   ├── auth/          ← register, login, me
│   ├── shop/          ← shop profile, logo, signature
│   ├── inventory/     ← products, stock logs
│   ├── customers/     ← khata, transactions
│   ├── billing/       ← bills, bill items
│   └── reports/       ← daily/weekly/monthly aggregates
└── prisma/
    └── schema.prisma  ← all DB models
```

## API Base URL

```
http://localhost:3000/api
```

## Module Build Order

1. `auth`      — register + login + JWT
2. `shop`      — profile setup
3. `inventory` — products + stock
4. `customers` — khata + transactions
5. `billing`   — bill generation
6. `reports`   — aggregate queries

## Useful Commands

```bash
npm run dev          # dev server with hot reload
npm run build        # compile TypeScript → dist/
npm run start        # run compiled dist/server.js
npm run db:migrate   # apply schema changes
npm run db:studio    # open Prisma Studio (visual DB browser)
npm run db:push      # push schema without migration (prototype only)
```
