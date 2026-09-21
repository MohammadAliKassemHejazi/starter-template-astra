import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import swaggerDocument from '../../swagger.json';

describe('OpenAPI document', () => {
  it('is a valid OpenAPI 3 spec', async () => {
    const api = await SwaggerParser.validate(JSON.parse(JSON.stringify(swaggerDocument)));
    expect('openapi' in api && api.openapi.startsWith('3.')).toBe(true);
  });

  it('documents every implemented route', () => {
    const documented = Object.entries(swaggerDocument.paths).flatMap(([p, ops]) => Object.keys(ops).map((m) => `${m.toUpperCase()} ${p}`));
    const implemented = [
      'GET /api/health',
      'GET /api/auth/csrf', 'POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/refresh', 'POST /api/auth/logout', 'GET /api/auth/me',
      'GET /api/users', 'GET /api/users/{id}', 'PATCH /api/users/{id}', 'DELETE /api/users/{id}', 'PUT /api/users/{id}/roles',
      'GET /api/roles', 'POST /api/roles', 'PATCH /api/roles/{id}', 'DELETE /api/roles/{id}', 'PUT /api/roles/{id}/permissions',
      'GET /api/permissions',
    ];
    expect(documented.sort()).toEqual(implemented.sort());
  });

  it('serves the docs UI outside production', async () => {
    const res = await request(createApp()).get('/api/docs/');
    expect(res.status).toBe(200);
  });
});

describe('response envelope', () => {
  it('health, 404, malformed JSON and oversized bodies all use the envelope', async () => {
    const app = createApp();
    const health = await request(app).get('/api/health');
    expect(health.body).toMatchObject({ success: true, message: expect.any(String), data: { status: 'ok' } });
    const nf = await request(app).get('/api/does-not-exist');
    expect(nf.status).toBe(404);
    expect(nf.body).toMatchObject({ success: false });
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"broken');
    expect(bad.status).toBe(400);
    expect(bad.body).toMatchObject({ success: false, message: 'Malformed JSON body' });
    const big = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(20_000) });
    expect(big.status).toBe(413);
    expect(big.body.success).toBe(false);
  });

  it('sets security headers and pins CORS to the client origin only', async () => {
    const app = createApp();
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    expect(ok.headers.vary).toMatch(/Origin/);
    expect(ok.headers['x-content-type-options']).toBe('nosniff');
    const evil = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(evil.headers['access-control-allow-origin']).toBeUndefined();
    const pre = await request(app).options('/api/auth/login').set('Origin', 'http://localhost:3000').set('Access-Control-Request-Method', 'POST');
    expect(pre.headers['access-control-allow-headers']).toBe('X-CSRF-Token,Content-Type');
  });
});
