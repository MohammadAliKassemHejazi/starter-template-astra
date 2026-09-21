import type { AuthSessionDto, LoginInput, Permission, RegisterInput, UserDto } from '@project/shared';
import { QueryTypes, UniqueConstraintError } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { Role, User, UserRole } from '../models';
import { conflict, notFound, unauthorized } from '../utils/app-error';
import { toUserDto } from '../utils/dto';
import { audit, hashForLog } from '../utils/logger';
import { hashPassword, verifyAgainstDummy, verifyPassword } from '../utils/password';
import {
  revokeFamilyByToken,
  rotateRefreshToken,
  signAccessToken,
  startSession,
  type ClientMeta,
} from './token.service';

const GENERIC_LOGIN_ERROR = 'Invalid email or password';

export async function loadUserWithRoles(id: string): Promise<User | null> {
  return User.findByPk(id, { include: [{ model: Role, as: 'roles' }] });
}

export async function permissionsForUser(userId: string): Promise<Permission[]> {
  const rows = await sequelize.query<{ key: string }>(
    `SELECT DISTINCT p.key FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = :userId ORDER BY p.key`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );
  return rows.map((r) => r.key as Permission);
}

export async function buildSession(userId: string): Promise<AuthSessionDto> {
  const [user, permissions] = await Promise.all([loadUserWithRoles(userId), permissionsForUser(userId)]);
  if (!user) throw notFound('User not found');
  return { user: toUserDto(user), permissions };
}

/** Registration never logs the user in and never accepts roles (schema is strict). */
export async function register(input: RegisterInput, meta: ClientMeta): Promise<UserDto> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await sequelize.transaction(async (t) => {
      const created = await User.create({ email: input.email, passwordHash, name: input.name }, { transaction: t });
      const defaultRole = await Role.findOne({ where: { name: 'user' }, transaction: t });
      if (!defaultRole) throw new Error('default "user" role is missing; run the seeder');
      await UserRole.create({ userId: created.id, roleId: defaultRole.id }, { transaction: t });
      return created;
    });
    audit('user_registered', { targetId: user.id, ip: meta.ip });
    const full = await loadUserWithRoles(user.id);
    return toUserDto(full ?? user);
  } catch (err) {
    if (err instanceof UniqueConstraintError) throw conflict('An account with this email already exists');
    throw err;
  }
}

export interface LoginResult {
  session: AuthSessionDto;
  familyId: string;
  accessToken: string;
  refreshToken: string;
}

export async function login(input: LoginInput, meta: ClientMeta): Promise<LoginResult> {
  const user = await User.findOne({ where: { email: input.email } });
  // ALWAYS one full verification with identical argon2 params, whether the user exists/is active or not.
  const ok = user ? await verifyPassword(user.passwordHash, input.password) : await verifyAgainstDummy(input.password);
  if (!user || !ok || !user.isActive) {
    audit('login_failed', { emailRef: hashForLog(input.email), ip: meta.ip });
    throw unauthorized(GENERIC_LOGIN_ERROR);
  }
  await user.update({ lastLoginAt: new Date() });
  const { raw, familyId } = await startSession(user.id, meta);
  audit('login_succeeded', { actorId: user.id, ip: meta.ip });
  return {
    session: await buildSession(user.id),
    familyId,
    accessToken: signAccessToken({ sub: user.id, fid: familyId }),
    refreshToken: raw,
  };
}

export async function refresh(rawToken: string | undefined, meta: ClientMeta): Promise<{ accessToken: string; refreshToken: string }> {
  if (!rawToken) throw unauthorized('Session expired');
  const rotated = await rotateRefreshToken(rawToken, meta);
  if (!rotated) throw unauthorized('Session expired');
  return {
    accessToken: signAccessToken({ sub: rotated.userId, fid: rotated.familyId }),
    refreshToken: rotated.raw,
  };
}

/** Idempotent; needs only the refresh cookie. */
export async function logout(rawToken: string | undefined, meta: ClientMeta): Promise<void> {
  const owner = rawToken ? await revokeFamilyByToken(rawToken) : null;
  audit('logout', { actorId: owner?.userId ?? null, targetId: owner?.userId ?? null, ip: meta.ip });
}
