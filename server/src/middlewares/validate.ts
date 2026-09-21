import type { RequestHandler } from 'express';
import type { FieldError } from '@project/shared';
import type { ZodError, ZodTypeAny } from 'zod';
import { badRequest } from '../utils/app-error';

export function zodToFieldErrors(err: ZodError): FieldError[] {
  return err.issues.map((i) => ({ field: i.path.join('.') || '_', issue: i.message }));
}

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** Validates with the shared strict Zod schemas; the parsed (trimmed/lowercased) value replaces the input. */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    for (const key of ['params', 'query', 'body'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key] ?? {});
      if (!result.success) return next(badRequest('Validation failed', zodToFieldErrors(result.error)));
      if (key === 'query') Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
      else req[key] = result.data as never;
    }
    next();
  };
