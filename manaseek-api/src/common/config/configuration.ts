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

  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  OTP_DEV_BYPASS_CODE: z.string().optional(),

  PUSH_PROVIDER: z.enum(['noop', 'fcm']).default('noop'),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),

  SMS_PROVIDER: z.enum(['noop', 'fonnte']).default('noop'),
  FONNTE_TOKEN: z.string().optional(),

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

  if (env.NODE_ENV === 'production' && env.OTP_DEV_BYPASS_CODE) {
    throw new Error('OTP_DEV_BYPASS_CODE must not be set in production');
  }

  return env;
}
