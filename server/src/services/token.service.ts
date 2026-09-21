import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { QueryTypes, type Transaction } from 'sequelize';
import { z } from 'zod';
import { config, FAMILY_MAX_DAYS } from '../config';
import { sequelize } from '../db/sequelize';
import { audit } from '../utils/logger';

const DAY_MS = 86_400_000;
const ALG = 'HS256' as const;

export interface AccessClaims {
  sub: string;
  fid: string;
}

export interface ClientMeta {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

const claimsSchema = z.object({ sub: z.string().uuid(), fid: z.string().uuid(), exp: z.number() });

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign({ fid: claims.fid }, config.jwtSecret, {
    algorithm: ALG,
    subject: claims.sub,
    expiresIn: config.accessTtl as jwt.SignOptions['expiresIn'],
  });
}

/** Pins HS256 and requires `exp`. Returns null on any failure. `ignoreExpiration` is only for CSRF binding. */
export function verifyAccessToken(token: string, opts: { ignoreExpiration?: boolean } = {}): AccessClaims | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [ALG],
      ignoreExpiration: opts.ignoreExpiration ?? false,
    });
    const parsed = claimsSchema.safeParse(payload);
    return parsed.success ? { sub: parsed.data.sub, fid: parsed.data.fid } : null;
  } catch {
    return null;
  }
}

const hashToken = (raw: string): string => createHash('sha256').update(raw).digest('hex');
const newRawToken = (): string => randomBytes(32).toString('base64url');

const cleanUa = (ua?: string): string | null =>
  // eslint-disable-next-line no-control-regex
  ua ? ua.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 255) : null;
const cleanIp = (ip?: string): string | null => (ip && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null);

interface IssuedRefresh {
  raw: string;
  familyId: string;
}

async function insertToken(
  t: Transaction,
  p: { userId: string; familyId: string; familyExpiresAt: Date; meta: ClientMeta },
): Promise<{ raw: string; id: string }> {
  const raw = newRawToken();
  const id = randomUUID();
  const ttlEnd = new Date(Date.now() + config.refreshTtlDays * DAY_MS);
  const expiresAt = ttlEnd < p.familyExpiresAt ? ttlEnd : p.familyExpiresAt;
  await sequelize.query(
    `INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, expires_at, family_expires_at, user_agent, ip)
     VALUES (:id, :userId, :familyId, :hash, :expiresAt, :familyExpiresAt, :ua, :ip)`,
    {
      replacements: {
        id,
        userId: p.userId,
        familyId: p.familyId,
        hash: hashToken(raw),
        expiresAt,
        familyExpiresAt: p.familyExpiresAt,
        ua: cleanUa(p.meta.userAgent),
        ip: cleanIp(p.meta.ip),
      },
      transaction: t,
    },
  );
  return { raw, id };
}

/** Starts a new session family (login). */
export async function startSession(userId: string, meta: ClientMeta): Promise<IssuedRefresh> {
  return sequelize.transaction(async (t) => {
    const familyId = randomUUID();
    const { raw } = await insertToken(t, {
      userId,
      familyId,
      familyExpiresAt: new Date(Date.now() + FAMILY_MAX_DAYS * DAY_MS),
      meta,
    });
    return { raw, familyId };
  });
}

export interface RotationResult {
  userId: string;
  familyId: string;
  raw: string;
}

interface ClaimedRow {
  id: string;
  user_id: string;
  family_id: string;
  family_expires_at: Date;
}

/**
 * Atomic rotation: ONE conditional UPDATE claims the presented token (unused, unrevoked, unexpired,
 * family within its absolute lifetime). Zero rows affected means invalid, or reuse of a spent token,
 * which revokes the whole family.
 */
export async function rotateRefreshToken(rawToken: string, meta: ClientMeta): Promise<RotationResult | null> {
  const hash = hashToken(rawToken);
  return sequelize.transaction(async (t): Promise<RotationResult | null> => {
    // Lock order user -> tokens (same as every revoke path). A concurrent password change / deactivation /
    // role change holds this row FOR UPDATE, so rotation waits and then cannot mint a token that the
    // revocation's snapshot missed.
    const owner = await sequelize.query<{ user_id: string }>('SELECT user_id FROM refresh_tokens WHERE token_hash = :hash', {
      replacements: { hash },
      type: QueryTypes.SELECT,
      transaction: t,
    });
    if (!owner[0]) return null;
    await sequelize.query('SELECT id FROM users WHERE id = :id FOR SHARE', {
      replacements: { id: owner[0].user_id },
      type: QueryTypes.SELECT,
      transaction: t,
    });
    const claimed = await sequelize.query<ClaimedRow>(
      `UPDATE refresh_tokens SET used_at = now()
       WHERE token_hash = :hash AND used_at IS NULL AND revoked_at IS NULL
         AND expires_at > now() AND family_expires_at > now()
       RETURNING id, user_id, family_id, family_expires_at`,
      { replacements: { hash }, type: QueryTypes.SELECT, transaction: t },
    );
    const row = claimed[0];
    if (!row) {
      const seen = await sequelize.query<{ user_id: string; family_id: string; used_at: Date | null }>(
        `SELECT user_id, family_id, used_at FROM refresh_tokens
         WHERE token_hash = :hash AND revoked_at IS NULL AND used_at IS NOT NULL AND family_expires_at > now()`,
        { replacements: { hash }, type: QueryTypes.SELECT, transaction: t },
      );
      const reused = seen[0];
      if (reused) {
        await revokeFamily(reused.family_id, t);
        audit('refresh_reuse_detected', { targetId: reused.user_id, familyId: reused.family_id, ip: meta.ip });
      }
      return null;
    }

    const active = await sequelize.query<{ is_active: boolean }>(
      'SELECT is_active FROM users WHERE id = :id',
      { replacements: { id: row.user_id }, type: QueryTypes.SELECT, transaction: t },
    );
    if (!active[0]?.is_active) {
      await revokeFamily(row.family_id, t);
      return null;
    }

    const next = await insertToken(t, {
      userId: row.user_id,
      familyId: row.family_id,
      familyExpiresAt: new Date(row.family_expires_at),
      meta,
    });
    await sequelize.query('UPDATE refresh_tokens SET replaced_by_id = :next WHERE id = :id', {
      replacements: { next: next.id, id: row.id },
      transaction: t,
    });
    return { userId: row.user_id, familyId: row.family_id, raw: next.raw };
  });
}

async function revokeFamily(familyId: string, t?: Transaction): Promise<void> {
  await sequelize.query('UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = :familyId AND revoked_at IS NULL', {
    replacements: { familyId },
    ...(t ? { transaction: t } : {}),
  });
}

/** Revokes by presented refresh token (logout works from the refresh cookie alone). Idempotent. */
export async function revokeFamilyByToken(rawToken: string): Promise<{ userId: string } | null> {
  const owner = await sequelize.query<{ user_id: string }>(
    `WITH fam AS (SELECT family_id, user_id FROM refresh_tokens WHERE token_hash = :hash),
     revoked AS (
       UPDATE refresh_tokens SET revoked_at = now()
       WHERE revoked_at IS NULL AND family_id IN (SELECT family_id FROM fam) RETURNING 1
     )
     SELECT user_id FROM fam`,
    { replacements: { hash: hashToken(rawToken) }, type: QueryTypes.SELECT },
  );
  return owner[0] ? { userId: owner[0].user_id } : null;
}

export async function revokeAllForUser(userId: string, t: Transaction, exceptFamilyId?: string): Promise<void> {
  await sequelize.query(
    `UPDATE refresh_tokens SET revoked_at = now()
     WHERE user_id = :userId AND revoked_at IS NULL AND (:except::uuid IS NULL OR family_id <> :except::uuid)`,
    { replacements: { userId, except: exceptFamilyId ?? null }, transaction: t },
  );
}

/** Retention: purge expired/revoked tokens older than 30 days. */
export async function purgeExpiredTokens(): Promise<void> {
  await sequelize.query(
    `DELETE FROM refresh_tokens
     WHERE (expires_at < now() - interval '30 days') OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '30 days')`,
  );
}
