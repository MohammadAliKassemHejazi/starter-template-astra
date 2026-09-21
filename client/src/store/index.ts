import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { setAuthFailureHandler } from '../services/http-client';
import authReducer, { sessionExpired } from './slices/auth-slice';

const rootReducer = combineReducers({ auth: authReducer });
export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({ reducer: rootReducer, ...(preloadedState ? { preloadedState } : {}) });
  // A refresh failure anywhere in the app clears the Redux auth state.
  setAuthFailureHandler(() => store.dispatch(sessionExpired()));
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
