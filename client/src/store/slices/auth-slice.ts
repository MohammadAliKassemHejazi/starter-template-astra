import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AuthSessionDto, LoginInput, Permission, RegisterInput, UserDto } from '@project/shared';
import { toThunkFailure, type ThunkFailure } from '../../interfaces/api-error';
import { fetchMeRequest, loginRequest, logoutRequest, registerRequest } from '../../services/auth-service';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';

export interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  permissions: Permission[];
  error: string | null;
}

export const initialAuthState: AuthState = { status: 'idle', user: null, permissions: [], error: null };

export const register = createAsyncThunk<UserDto, RegisterInput, { rejectValue: ThunkFailure }>(
  'auth/register',
  async (input, { rejectWithValue }) => {
    try {
      return await registerRequest(input);
    } catch (e) {
      return rejectWithValue(toThunkFailure(e));
    }
  },
);

export const login = createAsyncThunk<AuthSessionDto, LoginInput, { rejectValue: ThunkFailure }>(
  'auth/login',
  async (input, { rejectWithValue }) => {
    try {
      return await loginRequest(input);
    } catch (e) {
      return rejectWithValue(toThunkFailure(e));
    }
  },
);

export const fetchMe = createAsyncThunk<AuthSessionDto, void, { rejectValue: ThunkFailure }>(
  'auth/fetchMe',
  async (_arg, { rejectWithValue }) => {
    try {
      return await fetchMeRequest();
    } catch (e) {
      return rejectWithValue(toThunkFailure(e));
    }
  },
);

export const logout = createAsyncThunk<void, void>('auth/logout', async () => {
  try {
    await logoutRequest();
  } catch {
    // Logout is idempotent; local state is cleared regardless of the network outcome.
  }
});

function applySession(state: AuthState, session: AuthSessionDto): void {
  state.status = 'authenticated';
  state.user = session.user;
  state.permissions = session.permissions;
  state.error = null;
}

function clearSession(state: AuthState): void {
  state.status = 'anonymous';
  state.user = null;
  state.permissions = [];
}

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    /** Dispatched when refresh fails: the session is gone. */
    sessionExpired: (state) => {
      clearSession(state);
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.error = action.payload?.message ?? 'Registration failed';
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        clearSession(state);
        state.error = action.payload?.message ?? 'Login failed';
      })
      .addCase(fetchMe.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(fetchMe.rejected, (state) => {
        clearSession(state);
      })
      // Logout resets everything, success or not, so no stale identity survives.
      .addCase(logout.fulfilled, (state) => {
        clearSession(state);
        state.error = null;
      });
  },
});

export const { sessionExpired, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
