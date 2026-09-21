import type { FieldError } from '@project/shared';

/** Expected, client-safe failure. Anything else is a 500 with a generic message. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const unauthorized = (message = 'Authentication required'): AppError => new AppError(401, message);
export const forbidden = (message = 'Forbidden'): AppError => new AppError(403, message);
export const notFound = (message = 'Not found'): AppError => new AppError(404, message);
export const conflict = (message: string): AppError => new AppError(409, message);
export const badRequest = (message: string, errors?: FieldError[]): AppError => new AppError(400, message, errors);
