import type { Response } from 'express';
import type { ApiFailure, ApiResponse, FieldError, Paginated } from '@project/shared';

export function sendSuccess<T>(res: Response, data: T, message = 'OK', status = 200): Response {
  const body: ApiResponse<T> = { success: true, message, data };
  return res.status(status).json(body);
}

export function sendError(res: Response, status: number, message: string, errors?: FieldError[]): Response {
  const body: ApiFailure = { success: false, message, ...(errors && errors.length ? { errors } : {}) };
  return res.status(status).json(body);
}

export function paginate<T>(items: T[], page: number, pageSize: number, totalItems: number): Paginated<T> {
  return {
    items,
    pagination: { currentPage: page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) },
  };
}
