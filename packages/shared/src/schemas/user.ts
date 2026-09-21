import { z } from 'zod';
import { emailSchema, nameSchema, passwordSchema, uuidSchema } from './common';

export const updateSelfSchema = z
  .object({
    name: nameSchema.optional(),
    newPassword: passwordSchema.optional(),
    currentPassword: z.string().min(1).max(128).optional(),
  })
  .strict()
  .refine((v) => v.name !== undefined || v.newPassword !== undefined, {
    message: 'Nothing to update',
  })
  .refine((v) => v.newPassword === undefined || v.currentPassword !== undefined, {
    message: 'currentPassword is required to set a new password',
    path: ['currentPassword'],
  });
export type UpdateSelfInput = z.infer<typeof updateSelfSchema>;

export const adminUpdateUserSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const assignRolesSchema = z.object({ roleIds: z.array(uuidSchema).max(50) }).strict();
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
