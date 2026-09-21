import { z } from 'zod';

const boolFlag = (fallback: boolean) =>
  z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true'));

const envSchema = z.object({
  // No default: a forgotten NODE_ENV must never silently mean "development" (insecure cookies, docs exposed).
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/, 'e.g. 15m').default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  ARGON2_MEMORY_KIB: z.coerce.number().int().min(8).default(19456),
  ARGON2_TIME_COST: z.coerce.number().int().min(2).default(2),
  ALLOW_REGISTRATION: boolFlag(true),
  CLIENT_ORIGIN: z.string().min(1, 'CLIENT_ORIGIN is required'),
  TRUST_PROXY: z.string().optional(),
  RATE_LIMIT_GENERAL_MAX: z.coerce.number().int().min(1).default(300),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).default(20),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().min(1).default(5),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900_000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/** Family (absolute session) lifetime: refresh rotation can never extend past this. */
export const FAMILY_MAX_DAYS = 30;

function parseClientOrigin(raw: string): string {
  if (raw === '*' || raw.includes(',') || raw.includes(' ')) {
    throw new Error('CLIENT_ORIGIN must be exactly one origin (no "*", no lists)');
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('CLIENT_ORIGIN must be an absolute origin such as http://localhost:3000');
  }
  if (url.origin !== raw) throw new Error(`CLIENT_ORIGIN must be a bare origin; use ${url.origin}`);
  return url.origin;
}

function parseTrustProxy(raw: string | undefined, isProd: boolean): boolean | number {
  if (raw === undefined) {
    if (isProd) throw new Error('TRUST_PROXY must be set explicitly in production (false or a hop count)');
    return false;
  }
  if (raw === 'false') return false;
  if (/^\d+$/.test(raw)) return Number(raw);
  throw new Error('TRUST_PROXY must be "false" or a hop count; "true" (trust everything) is rejected');
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${detail}`);
  }
  const e = parsed.data;
  const isProd = e.NODE_ENV === 'production';
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    jwtSecret: e.JWT_ACCESS_SECRET,
    accessTtl: e.ACCESS_TOKEN_TTL,
    refreshTtlDays: e.REFRESH_TOKEN_TTL_DAYS,
    argon2: { memoryCost: e.ARGON2_MEMORY_KIB, timeCost: e.ARGON2_TIME_COST },
    allowRegistration: e.ALLOW_REGISTRATION,
    clientOrigin: parseClientOrigin(e.CLIENT_ORIGIN),
    trustProxy: parseTrustProxy(e.TRUST_PROXY, isProd),
    rateLimit: {
      generalMax: e.RATE_LIMIT_GENERAL_MAX,
      authMax: e.RATE_LIMIT_AUTH_MAX,
      loginMax: e.RATE_LIMIT_LOGIN_MAX,
      windowMs: e.RATE_LIMIT_WINDOW_MS,
    },
    logLevel: e.LOG_LEVEL,
    /** Secure cookies (and __Host-/__Secure- prefixes) everywhere except local dev/test over http. */
    cookieSecure: e.NODE_ENV === 'production',
    isProd,
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;
export const config: AppConfig = loadConfig();
