import { NextRequest } from 'next/server';

const BASE_URL = 'http://localhost:3000';

export function apiRequest(
  path: string,
  init?: RequestInit & { token?: string }
): NextRequest {
  const { token, headers, ...rest } = init ?? {};
  const mergedHeaders = new Headers(headers);

  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (rest.body && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  return new NextRequest(`${BASE_URL}${path}`, {
    ...rest,
    headers: mergedHeaders,
  });
}

export function jsonBody(data: unknown): string {
  return JSON.stringify(data);
}

export async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
