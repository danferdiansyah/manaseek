// Prisma stops loading .env once a config file exists, so load it here.
// dotenv is a no-op when the file is absent, which is what CI needs.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Replaces the `prisma` key in package.json, which Prisma 7 drops.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx --env-file-if-exists=.env prisma/seed.ts',
  },
});
