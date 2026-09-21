import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models';
import { hashForLog, logger, redact, sanitizeForLog } from '../utils/logger';
import { makeClient, PASSWORD } from './helpers';

describe('log hygiene', () => {
  it('redacts credential-like keys, deeply', () => {
    const out = redact({ ok: 1, password: 'p', nested: { Authorization: 'Bearer x', refreshToken: 't', cookie: 'c', fine: 'y' } });
    expect(out).toEqual({ ok: 1, password: '[REDACTED]', nested: { Authorization: '[REDACTED]', refreshToken: '[REDACTED]', cookie: '[REDACTED]', fine: 'y' } });
  });

  it('strips control characters from client-supplied strings and hashes emails', () => {
    expect(sanitizeForLog('a\r\nb\u0000c')).toBe('a  b c');
    expect(hashForLog(' Alice@Example.com ')).toBe(hashForLog('alice@example.com'));
    expect(hashForLog('alice@example.com')).toMatch(/^[0-9a-f]{16}$/);
    expect(hashForLog('alice@example.com')).not.toContain('alice');
  });

  it('a 500 is generic to the client and the log never contains the request body', async () => {
    const spy = vi.spyOn(logger, 'error');
    const find = vi.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('db exploded'));
    const res = await makeClient(createApp()).post('/api/auth/login', { email: 'a@example.com', password: PASSWORD });
    find.mockRestore();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: 'Internal server error' });
    const logged = JSON.stringify(spy.mock.calls);
    expect(logged).toContain('db exploded');
    expect(logged).not.toContain(PASSWORD);
    spy.mockRestore();
    expect((await request(createApp()).get('/api/health')).status).toBe(200);
  });
});
