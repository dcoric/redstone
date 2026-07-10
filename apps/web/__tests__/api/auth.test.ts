import { describe, expect, it } from 'vitest';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { GET as meGET } from '@/app/api/auth/me/route';
import { apiRequest, jsonBody, readJson } from '../helpers';

describe('POST /api/auth/login', () => {
  it('returns 400 when email or password is missing', async () => {
    const response = await loginPOST(
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: jsonBody({ email: 'test@redstone.app' }),
      })
    );

    expect(response.status).toBe(400);
    const body = await readJson<{ error: string }>(response);
    expect(body.error).toMatch(/required/i);
  });

  it('returns 401 for invalid credentials', async () => {
    const response = await loginPOST(
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: jsonBody({
          email: 'test@redstone.app',
          password: 'wrong-password',
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns a JWT for valid seed credentials', async () => {
    const response = await loginPOST(
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: jsonBody({
          email: 'test@redstone.app',
          password: 'password123',
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await readJson<{
      token: string;
      user: { id: string; email: string };
    }>(response);
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe('test@redstone.app');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a valid session', async () => {
    const response = await meGET(apiRequest('/api/auth/me'));
    expect(response.status).toBe(401);
  });

  it('returns the current user for a valid JWT', async () => {
    const loginResponse = await loginPOST(
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: jsonBody({
          email: 'test@redstone.app',
          password: 'password123',
        }),
      })
    );
    const login = await readJson<{ token: string }>(loginResponse);

    const response = await meGET(
      apiRequest('/api/auth/me', { token: login.token })
    );
    expect(response.status).toBe(200);
    const body = await readJson<{
      user: { email: string; createdAt: string; updatedAt: string };
    }>(response);
    expect(body.user.email).toBe('test@redstone.app');
    expect(body.user.createdAt).toBeTruthy();
    expect(body.user.updatedAt).toBeTruthy();
  });
});

describe('POST /api/auth/register', () => {
  it('returns 400 when password is too short', async () => {
    const response = await registerPOST(
      apiRequest('/api/auth/register', {
        method: 'POST',
        body: jsonBody({
          email: `short-pw-${Date.now()}@redstone.app`,
          password: '12345',
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('creates a new user', async () => {
    const email = `vitest-${Date.now()}@redstone.app`;
    const response = await registerPOST(
      apiRequest('/api/auth/register', {
        method: 'POST',
        body: jsonBody({
          email,
          password: 'password123',
          name: 'Vitest User',
        }),
      })
    );

    expect(response.status).toBe(201);
    const body = await readJson<{ user: { email: string } }>(response);
    expect(body.user.email).toBe(email);
  });
});
