import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Permission, createRoleSchema, type PermissionDto, type RoleDto } from '@project/shared';
import { Can } from '../../common/Can';
import { Modal } from '../../common/Modal';
import { TextField } from '../../common/TextField';
import { ApiError, errorMessage } from '../../../interfaces/api-error';
import { createRole, listPermissions, listRoles, setRolePermissions } from '../../../services/admin-service';
import { fromServerErrors, toFieldErrors } from '../../../utils/zod-field-errors';

function CreateRoleDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const description = String(form.get('description') ?? '');
    const parsed = createRoleSchema.safeParse({
      name: form.get('name'),
      ...(description.trim() ? { description } : {}),
    });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setFieldErrors({});
    setError(null);
    setIsSaving(true);
    try {
      await createRole(parsed.data);
      onCreated();
    } catch (e) {
      setIsSaving(false);
      if (e instanceof ApiError) setFieldErrors(fromServerErrors(e.errors));
      setError(errorMessage(e));
    }
  };

  return (
    <Modal title="Create role" onClose={onClose}>
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        {error ? (
          <p role="alert" className="alert-error">
            {error}
          </p>
        ) : null}
        <TextField id="role-name" name="name" label="Name" error={fieldErrors.name} data-autofocus />
        <TextField id="role-description" name="description" label="Description (optional)" error={fieldErrors.description} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            Create role
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditPermissionsDialog({
  role,
  permissions,
  onClose,
  onSaved,
}: {
  role: RoleDto;
  permissions: PermissionDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set((role.permissions ?? []).map((p) => p.id)));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      await setRolePermissions(role.id, { permissionIds: [...selected] });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
      setIsSaving(false);
    }
  };

  return (
    <Modal title={`Permissions for ${role.name}`} onClose={onClose}>
      {error ? (
        <p role="alert" className="alert-error mb-3">
          {error}
        </p>
      ) : null}
      <fieldset className="space-y-2">
        <legend className="sr-only">Permissions</legend>
        {permissions.map((permission) => (
          <label key={permission.id} className="flex items-center gap-2 text-sm text-slate-900">
            <input type="checkbox" checked={selected.has(permission.id)} onChange={() => toggle(permission.id)} />
            <code>{permission.key}</code>
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-primary" disabled={isSaving} onClick={() => void save()}>
          Save permissions
        </button>
      </div>
    </Modal>
  );
}

export function RolesAdmin() {
  const [roles, setRoles] = useState<RoleDto[] | null>(null);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<RoleDto | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const [r, p] = await Promise.all([listRoles(), listPermissions()]);
      setRoles(r);
      setPermissions(p);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Roles</h1>
        <Can permission={Permission.RolesWrite}>
          <button type="button" className="btn-primary" onClick={() => setIsCreating(true)}>
            Create role
          </button>
        </Can>
      </div>
      {error ? (
        <p role="alert" className="alert-error mb-4">
          {error}
        </p>
      ) : null}
      {roles === null && !error ? <p role="status">Loading roles…</p> : null}
      {roles ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">Roles and their permissions</caption>
            <thead>
              <tr>
                <th scope="col" className="table-cell font-semibold">Role</th>
                <th scope="col" className="table-cell font-semibold">Description</th>
                <th scope="col" className="table-cell font-semibold">Permissions</th>
                <th scope="col" className="table-cell font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <th scope="row" className="table-cell font-medium">
                    {role.name}
                    {role.isSystem ? <span className="ml-2 text-xs text-slate-700">(system)</span> : null}
                  </th>
                  <td className="table-cell">{role.description ?? ''}</td>
                  <td className="table-cell">{(role.permissions ?? []).map((p) => p.key).join(', ') || 'None'}</td>
                  <td className="table-cell">
                    <Can permission={Permission.RolesWrite}>
                      <button type="button" className="btn-secondary" disabled={role.isSystem} onClick={() => setEditing(role)}>
                        Edit permissions<span className="sr-only"> of {role.name}</span>
                      </button>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {isCreating ? (
        <CreateRoleDialog
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            void load();
          }}
        />
      ) : null}
      {editing ? (
        <EditPermissionsDialog
          role={editing}
          permissions={permissions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      ) : null}
    </main>
  );
}
