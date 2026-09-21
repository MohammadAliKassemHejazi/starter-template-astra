import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema } from './common';

export const registerSchema = z
  .object({ email: emailSchema, password: passwordSchema, name: nameSchema })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

// Login skips the min-length policy (generic failure path) but caps length (Argon2 DoS).
export const loginSchema = z
  .object({ email: emailSchema, password: z.string().min(1).max(128) })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;
