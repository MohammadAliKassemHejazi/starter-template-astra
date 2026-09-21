import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  adminUpdateUserSchema,
  updateSelfSchema,
  type AssignRolesInput,
  type CreateRoleInput,
  type PaginationQuery,
  type SetRolePermissionsInput,
  type UpdateRoleInput,
} from '@project/shared';
import { Permission } from '@project/shared';
import * as roleService from '../services/role.service';
import * as userService from '../services/user.service';
import { badRequest, forbidden, unauthorized } from '../utils/app-error';
import { sendSuccess } from '../utils/respond';
import { zodToFieldErrors } from '../middlewares/validate';

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap =
  (fn: Handler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const actorOf = (req: Request): userService.Actor => {
  if (!req.auth) throw unauthorized();
  return req.auth;
};
const idOf = (req: Request): string => String(req.params.id);

export const listUsers = wrap(async (req, res) =>
  sendSuccess(res, await userService.listUsers(req.query as unknown as PaginationQuery)),
);
export const getUser = wrap(async (req, res) => sendSuccess(res, await userService.getUser(idOf(req))));

/**
 * Self vs admin: on your own record only name/password (updateSelfSchema, strict); on anyone else's
 * record `users:write` and the admin schema (name/email/isActive). Never both.
 */
export const patchUser = wrap(async (req, res) => {
  const actor = actorOf(req);
  if (idOf(req) === actor.userId) {
    const parsed = updateSelfSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Validation failed', zodToFieldErrors(parsed.error));
    return sendSuccess(res, await userService.updateSelf(actor, parsed.data), 'Updated');
  }
  if (!actor.permissions.has(Permission.UsersWrite)) throw forbidden();
  const parsed = adminUpdateUserSchema.safeParse(req.body);
  if (!parsed.success) throw badRequest('Validation failed', zodToFieldErrors(parsed.error));
  return sendSuccess(res, await userService.adminUpdateUser(actor, idOf(req), parsed.data), 'Updated');
});

export const deleteUser = wrap(async (req, res) => {
  await userService.deleteUser(actorOf(req), idOf(req));
  return sendSuccess(res, null, 'Deleted');
});

export const assignRoles = wrap(async (req, res) =>
  sendSuccess(res, await userService.assignRoles(actorOf(req), idOf(req), (req.body as AssignRolesInput).roleIds), 'Roles updated'),
);

export const listRoles = wrap(async (_req, res) => sendSuccess(res, await roleService.listRoles()));
export const listPermissions = wrap(async (_req, res) => sendSuccess(res, await roleService.listPermissions()));
export const createRole = wrap(async (req, res) =>
  sendSuccess(res, await roleService.createRole(actorOf(req), req.body as CreateRoleInput), 'Role created', 201),
);
export const updateRole = wrap(async (req, res) =>
  sendSuccess(res, await roleService.updateRole(actorOf(req), idOf(req), req.body as UpdateRoleInput), 'Role updated'),
);
export const deleteRole = wrap(async (req, res) => {
  await roleService.deleteRole(actorOf(req), idOf(req));
  return sendSuccess(res, null, 'Role deleted');
});
export const setRolePermissions = wrap(async (req, res) =>
  sendSuccess(
    res,
    await roleService.setRolePermissions(actorOf(req), idOf(req), req.body as SetRolePermissionsInput),
    'Role permissions updated',
  ),
);
