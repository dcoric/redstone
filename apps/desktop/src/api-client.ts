import type {
  CurrentUserResponse,
  FileResponse,
  LoginResponse,
  SyncResponse,
  UpdateFileRequest,
} from '@redstone/shared';

export class DesktopApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: unknown) {
    super(message);
    this.name = 'DesktopApiError';
  }
}

async function readError(response: Response): Promise<{ message: string; details?: unknown }> {
  try {
    const body = (await response.json()) as { error?: string };
    return {
      message: body.error ?? `Request failed with status ${response.status}`,
      details: body,
    };
  } catch {
    return { message: `Request failed with status ${response.status}` };
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
      const error = await readError(response);
      throw new DesktopApiError(error.message, response.status, error.details);
    }
    return response.json() as Promise<LoginResponse>;
  }

  async me(token: string): Promise<CurrentUserResponse> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await readError(response);
      throw new DesktopApiError(error.message, response.status, error.details);
    }
    return response.json() as Promise<CurrentUserResponse>;
  }

  async createFile(token: string, title: string, content: string): Promise<FileResponse> {
    return this.request<FileResponse>(token, '/files', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  }

  async updateFile(token: string, id: string, changes: UpdateFileRequest): Promise<FileResponse> {
    return this.request<FileResponse>(token, `/files/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
  }

  async deleteFile(token: string, id: string, baseUpdatedAt: string | null): Promise<void> {
    const query = baseUpdatedAt
      ? `?baseUpdatedAt=${encodeURIComponent(baseUpdatedAt)}`
      : '';
    await this.request(token, `/files/${encodeURIComponent(id)}${query}`, {
      method: 'DELETE',
    });
  }

  async pull(token: string, since: string): Promise<SyncResponse> {
    return this.request<SyncResponse>(
      token,
      `/sync?since=${encodeURIComponent(since)}`,
      {}
    );
  }

  private async request<T>(token: string, route: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${route}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
    if (!response.ok) {
      const error = await readError(response);
      throw new DesktopApiError(error.message, response.status, error.details);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
