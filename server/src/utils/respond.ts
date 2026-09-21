import type { Response } from 'express';
import type { ApiResponse } from '@project/shared';

export function sendSuccess<T>(res: Response, data: T, message = 'OK', status = 200): Response {
  const body: ApiResponse<T> = { success: true, message, data };
  return res.status(status).json(body);
}
