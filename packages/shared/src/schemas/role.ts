import { z } from 'zod';
import { uuidSchema } from './common';

const roleName = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, 'Letters, digits, "_" and "-" only');
const description = z.string().trim().max(255);

export const createRoleSchema = z
  .object({ name: roleName, description: description.optional() })
  .strict();
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z
  .object({ name: roleName.optional(), description: description.optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const setRolePermissionsSchema = z
  .object({ permissionIds: z.array(uuidSchema).max(200) })
  .strict();
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;
