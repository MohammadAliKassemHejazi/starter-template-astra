import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { logger, sanitizeForLog } from '../utils/logger';
import { sendError } from '../utils/respond';
import { zodToFieldErrors } from './validate';

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 404, 'Not found');
};

interface HttpishError {
  type?: string;
  status?: number;
  statusCode?: number;
}

/**
 * Final error boundary. NEVER logs req.body or Zod input values; only the error name/message and stack.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof AppError) return void sendError(res, err.status, err.message, err.errors);
  if (err instanceof ZodError) return void sendError(res, 400, 'Validation failed', zodToFieldErrors(err));

  const http = err as HttpishError;
  if (http.type === 'entity.too.large') return void sendError(res, 413, 'Request body too large');
  if (http.type === 'entity.parse.failed') return void sendError(res, 400, 'Malformed JSON body');

  const e = err instanceof Error ? err : new Error(String(err));
  logger.error('unhandled_error', {
    name: e.name,
    message: sanitizeForLog(e.message, 500),
    stack: e.stack,
    method: req.method,
    path: sanitizeForLog(req.path),
  });
  sendError(res, 500, 'Internal server error');
};
