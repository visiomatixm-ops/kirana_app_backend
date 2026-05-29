import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  // Check DB availability, but do not prevent the API from listening.
  // Route handlers will still return JSON errors if the DB is unavailable.
  prisma.$connect()
    .then(() => {
      console.log('Database connected');
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
    });

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
