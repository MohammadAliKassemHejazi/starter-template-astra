import { z } from 'zod';

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const idParamSchema = z.object({ id: z.string().uuid() }).strict();
export type IdParam = z.infer<typeof idParamSchema>;
