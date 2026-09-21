import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from '../store';
import { initialAuthState, type AuthState } from '../store/slices/auth-slice';

/** Test helper: render inside a real store seeded with the given auth state. */
export function renderWithStore(ui: ReactElement, auth: Partial<AuthState> = {}) {
  const store = makeStore({ auth: { ...initialAuthState, ...auth } });
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
