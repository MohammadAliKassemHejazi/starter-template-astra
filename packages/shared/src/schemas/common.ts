import { z } from 'zod';

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export const emailSchema = z.string().trim().toLowerCase().max(254).email();

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`);

export const nameSchema = z.string().trim().min(1).max(100);

export const uuidSchema = z.string().uuid();
