import type { CurrentUserResponse, LoginResponse } from '@redstone/shared';

export class DesktopApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'DesktopApiError';
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export class DesktopApiClient {
  constructor(private readonly baseUrl: string) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new DesktopApiError(await readError(response), response.status);
    }
    return response.json() as Promise<LoginResponse>;
  }

  async me(token: string): Promise<CurrentUserResponse> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new DesktopApiError(await readError(response), response.status);
    }
    return response.json() as Promise<CurrentUserResponse>;
  }
}
