import { describe, expect, it } from 'vitest';
import type { ApiResponse } from '../index';

describe('ApiResponse', () => {
  it('narrows on success', () => {
    const r: ApiResponse<{ ok: boolean }> = { success: true, message: 'ok', data: { ok: true } };
    if (r.success) expect(r.data.ok).toBe(true);
    else throw new Error('unreachable');
  });
});
