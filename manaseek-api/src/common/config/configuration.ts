import { z } from 'zod';

const booleanish = z
  .string()
  .optional()
  .transform((value) => value === 'true' || value === '1');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default('api'),
  CORS_ORIGINS: z.string().default('*'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_TTL must look like 15m, 24h or 7d')
    .default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // Every OAuth client that may call us: web, Android and iOS each have their
  // own client id, and all of them are valid `aud` values on a Google ID token.
  GOOGLE_CLIENT_IDS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((id) => id.trim()).filter(Boolean)),
  // Lets a developer mint a session without real Google credentials.
  AUTH_DEV_LOGIN: booleanish,

  PUSH_PROVIDER: z.enum(['noop', 'fcm']).default('noop'),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),

  // Set false on serverless hosts and drive tasks through the internal endpoint.
  SCHEDULER_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== 'false'),
  INTERNAL_TASK_TOKEN: z.string().min(24).optional(),

  BOOKING_REQUEST_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  NEARBY_DEFAULT_RADIUS_KM: z.coerce.number().positive().default(10),
  NEARBY_MAX_RADIUS_KM: z.coerce.number().positive().default(50),

  SWAGGER_ENABLED: booleanish,
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env = parsed.data;

  if (env.NODE_ENV === 'production') {
    if (env.AUTH_DEV_LOGIN) {
      throw new Error('AUTH_DEV_LOGIN must not be enabled in production');
    }
    if (env.GOOGLE_CLIENT_IDS.length === 0) {
      throw new Error('GOOGLE_CLIENT_IDS is required in production');
    }
  }

  return env;
}
