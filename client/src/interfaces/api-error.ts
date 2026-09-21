import type { FieldError } from '@project/shared';

export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldError[];

  constructor(message: string, status: number, errors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export function errorMessage(error: unknown, fallback = 'Something went wrong, please try again'): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Serializable rejection payload for thunks (Error instances are not Redux-safe). */
export interface ThunkFailure {
  message: string;
  status: number;
  errors: FieldError[];
}

export function toThunkFailure(error: unknown): ThunkFailure {
  if (error instanceof ApiError) return { message: error.message, status: error.status, errors: error.errors };
  return { message: 'Something went wrong, please try again', status: 0, errors: [] };
}
