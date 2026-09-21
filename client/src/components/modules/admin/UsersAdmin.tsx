import { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { Permission, type PaginatedData, type RoleDto, type UserDto } from '@project/shared';
import { Can } from '../../common/Can';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { Modal } from '../../common/Modal';
import { useCan } from '../../../hooks/use-can';
import { errorMessage } from '../../../interfaces/api-error';
import { assignUserRoles, deleteUser, listRoles, listUsers, updateUser } from '../../../services/admin-service';
import { useAppSelector } from '../../../store';

const PAGE_SIZE = 20;

function RolesDialog({ user, onClose, onSaved }: { user: UserDto; onClose: () => void; onSaved: (u: UserDto) => void }) {
  const [roles, setRoles] = useState<RoleDto[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(user.roles.map((r) => r.id)));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listRoles().then(setRoles, (e: unknown) => setError(errorMessage(e)));
  }, []);

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
      onSaved(await assignUserRoles(user.id, { roleIds: [...selected] }));
    } catch (e) {
      setError(errorMessage(e));
      setIsSaving(false);
    }
  };

  return (
    <Modal title={`Roles for ${user.email}`} onClose={onClose}>
      {error ? (
        <p role="alert" className="alert-error mb-3">
          {error}
        </p>
      ) : null}
      {roles === null && !error ? <p role="status">Loading roles…</p> : null}
      <fieldset className="space-y-2">
        <legend className="sr-only">Assigned roles</legend>
        {(roles ?? []).map((role) => (
          <label key={role.id} className="flex items-center gap-2 text-sm text-slate-900">
            <input type="checkbox" checked={selected.has(role.id)} onChange={() => toggle(role.id)} />
            {role.name}
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-primary" disabled={isSaving || roles === null} onClick={() => void save()}>
          Save roles
        </button>
      </div>
    </Modal>
  );
}

export function UsersAdmin() {
  const currentUserId = useAppSelector((s) => s.auth.user?.id);
  const canReadRoles = useCan(Permission.RolesRead);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedData<UserDto> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<UserDto | null>(null);
  const [rolesFor, setRolesFor] = useState<UserDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const load = useCallback(async (p: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await listUsers(p, PAGE_SIZE));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const replaceUser = (updated: UserDto): void => {
    setData((prev) => (prev ? { ...prev, items: prev.items.map((u) => (u.id === updated.id ? updated : u)) } : prev));
  };

  const toggleActive = async (user: UserDto): Promise<void> => {
    setError(null);
    setStatusMessage('');
    try {
      const updated = await updateUser(user.id, { isActive: !user.isActive });
      replaceUser(updated);
      setStatusMessage(`${updated.email} ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteUser(pendingDelete.id);
      setPendingDelete(null);
      await load(page);
      headingRef.current?.focus();
    } catch (e) {
      setPendingDelete(null);
      setError(errorMessage(e));
    } finally {
      setIsDeleting(false);
    }
  };

  const pagination = data?.pagination;

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-5xl p-4">
      <Head>
        <title>Users | Project</title>
      </Head>
      <h1 ref={headingRef} tabIndex={-1} className="mb-4 text-2xl font-bold text-slate-900">
        Users
      </h1>
      <p role="status" className="sr-only">
        {statusMessage}
      </p>
      {error ? (
        <p role="alert" className="alert-error mb-4">
          {error}
        </p>
      ) : null}
      {isLoading ? <p role="status">Loading users…</p> : null}
      {data ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">Users, page {pagination?.currentPage}</caption>
            <thead>
              <tr>
                <th scope="col" className="table-cell font-semibold">Name</th>
                <th scope="col" className="table-cell font-semibold">Email</th>
                <th scope="col" className="table-cell font-semibold">Roles</th>
                <th scope="col" className="table-cell font-semibold">Status</th>
                <th scope="col" className="table-cell font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id}>
                  <th scope="row" className="table-cell font-medium">{user.name}</th>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">{user.roles.map((r) => r.name).join(', ') || 'None'}</td>
                  <td className="table-cell">{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-2">
                      <Can permission={Permission.UsersWrite}>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={user.id === currentUserId}
                          onClick={() => void toggleActive(user)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                          <span className="sr-only"> {user.email}</span>
                        </button>
                      </Can>
                      {canReadRoles ? (
                        <Can permission={Permission.UsersAssignRole}>
                          <button type="button" className="btn-secondary" disabled={user.id === currentUserId} onClick={() => setRolesFor(user)}>
                            Roles<span className="sr-only"> for {user.email}</span>
                          </button>
                        </Can>
                      ) : null}
                      <Can permission={Permission.UsersDelete}>
                        <button type="button" className="btn-danger" disabled={user.id === currentUserId} onClick={() => setPendingDelete(user)}>
                          Delete<span className="sr-only"> {user.email}</span>
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {pagination ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center gap-3">
          <button type="button" className="btn-secondary" disabled={page <= 1 || isLoading} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="text-sm text-slate-800">
            Page {pagination.currentPage} of {Math.max(pagination.totalPages, 1)} ({pagination.totalItems} users)
          </span>
          <button type="button" className="btn-secondary" disabled={page >= pagination.totalPages || isLoading} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </nav>
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete user"
          message={`Permanently delete ${pendingDelete.email}? This cannot be undone.`}
          confirmLabel="Delete user"
          isPending={isDeleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
      {rolesFor ? (
        <RolesDialog
          user={rolesFor}
          onClose={() => setRolesFor(null)}
          onSaved={(u) => {
            replaceUser(u);
            setRolesFor(null);
          }}
        />
      ) : null}
    </main>
  );
}
