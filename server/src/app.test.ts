import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app';

describe('GET /api/health', () => {
  it('returns the ApiResponse envelope', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});
