import { screen } from '@testing-library/react';
import { Permission } from '@project/shared';
import { describe, expect, it } from 'vitest';
import { Can } from '../components/common/Can';
import { renderWithStore } from '../utils/render-with-store';
import { useCan } from './use-can';

function Probe({ permission }: { permission: Permission }) {
  return <p>{useCan(permission) ? 'yes' : 'no'}</p>;
}

describe('useCan / <Can>', () => {
  it('is true only for held permissions of an authenticated user', () => {
    renderWithStore(<Probe permission={Permission.UsersRead} />, { status: 'authenticated', permissions: [Permission.UsersRead] });
    expect(screen.getByText('yes')).toBeInTheDocument();
  });

  it('is false for a missing permission', () => {
    renderWithStore(<Probe permission={Permission.RolesWrite} />, { status: 'authenticated', permissions: [Permission.UsersRead] });
    expect(screen.getByText('no')).toBeInTheDocument();
  });

  it('is false when not authenticated even if stale permissions remain', () => {
    renderWithStore(<Probe permission={Permission.UsersRead} />, { status: 'anonymous', permissions: [Permission.UsersRead] });
    expect(screen.getByText('no')).toBeInTheDocument();
  });

  it('<Can> renders children or fallback', () => {
    renderWithStore(
      <>
        <Can permission={Permission.UsersRead}><span>allowed</span></Can>
        <Can permission={Permission.RolesWrite} fallback={<span>denied</span>}>
          <span>hidden</span>
        </Can>
      </>,
      { status: 'authenticated', permissions: [Permission.UsersRead] },
    );
    expect(screen.getByText('allowed')).toBeInTheDocument();
    expect(screen.getByText('denied')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });
});
