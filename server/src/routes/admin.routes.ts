import { Router } from 'express';
import {
  assignRolesSchema,
  createRoleSchema,
  idParamSchema,
  paginationQuerySchema,
  Permission,
  setRolePermissionsSchema,
  updateRoleSchema,
} from '@project/shared';
import * as c from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { csrfProtection } from '../middlewares/csrf';
import { requirePermission, requireSelfOrPermission } from '../middlewares/requirePermission';
import { validate } from '../middlewares/validate';

const id = validate({ params: idParamSchema });

/** Every route: authenticate (+ csrf on unsafe methods) + requirePermission. */
export const usersRouter = Router();
usersRouter.use(authenticate, csrfProtection);
usersRouter.get('/', requirePermission(Permission.UsersRead), validate({ query: paginationQuerySchema }), c.listUsers);
usersRouter.get('/:id', id, requireSelfOrPermission(Permission.UsersRead), c.getUser);
// PATCH: self (name/password) needs no permission; others need users:write (enforced in the controller).
usersRouter.patch('/:id', id, c.patchUser);
usersRouter.delete('/:id', id, requirePermission(Permission.UsersDelete), c.deleteUser);
usersRouter.put('/:id/roles', id, requirePermission(Permission.UsersAssignRole), validate({ body: assignRolesSchema }), c.assignRoles);

export const rolesRouter = Router();
rolesRouter.use(authenticate, csrfProtection);
rolesRouter.get('/', requirePermission(Permission.RolesRead), c.listRoles);
rolesRouter.post('/', requirePermission(Permission.RolesWrite), validate({ body: createRoleSchema }), c.createRole);
rolesRouter.patch('/:id', id, requirePermission(Permission.RolesWrite), validate({ body: updateRoleSchema }), c.updateRole);
rolesRouter.delete('/:id', id, requirePermission(Permission.RolesWrite), c.deleteRole);
rolesRouter.put(
  '/:id/permissions',
  id,
  requirePermission(Permission.RolesWrite),
  validate({ body: setRolePermissionsSchema }),
  c.setRolePermissions,
);

export const permissionsRouter = Router();
permissionsRouter.use(authenticate);
permissionsRouter.get('/', requirePermission(Permission.RolesRead), c.listPermissions);
