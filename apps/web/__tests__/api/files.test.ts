import { beforeAll, describe, expect, it } from 'vitest';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { GET as filesGET, POST as filesPOST } from '@/app/api/files/route';
import {
  DELETE as fileDELETE,
  GET as fileGET,
  PUT as filePUT,
} from '@/app/api/files/[id]/route';
import { GET as foldersGET } from '@/app/api/folders/route';
import { GET as searchGET } from '@/app/api/search/route';
import { apiRequest, jsonBody, readJson } from '../helpers';

let authToken: string;

beforeAll(async () => {
  const response = await loginPOST(
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: jsonBody({
        email: 'test@redstone.app',
        password: 'password123',
      }),
    })
  );

  const body = await readJson<{ token: string }>(response);
  authToken = body.token;
});

describe('files API', () => {
  it('GET /api/files returns 401 without auth', async () => {
    const response = await filesGET(apiRequest('/api/files'));
    expect(response.status).toBe(401);
  });

  it('GET /api/files lists seeded files', async () => {
    const response = await filesGET(
      apiRequest('/api/files', { token: authToken })
    );

    expect(response.status).toBe(200);
    const body = await readJson<{ files: { title: string }[] }>(response);
    expect(body.files.length).toBeGreaterThan(0);
    expect(body.files.some((f) => f.title === 'Welcome to Redstone')).toBe(true);
  });

  it('POST /api/files creates, reads, updates, and deletes a file', async () => {
    const createResponse = await filesPOST(
      apiRequest('/api/files', {
        method: 'POST',
        token: authToken,
        body: jsonBody({
          title: `Vitest Note ${Date.now()}`,
          content: '# Hello from vitest',
        }),
      })
    );

    expect(createResponse.status).toBe(201);
    const created = await readJson<{
      file: { id: string; title: string; updatedAt: string };
    }>(
      createResponse
    );
    const fileId = created.file.id;

    const getResponse = await fileGET(
      apiRequest(`/api/files/${fileId}`, { token: authToken }),
      { params: Promise.resolve({ id: fileId }) }
    );
    expect(getResponse.status).toBe(200);

    const updateResponse = await filePUT(
      apiRequest(`/api/files/${fileId}`, {
        method: 'PUT',
        token: authToken,
        body: jsonBody({
          content: 'Updated content',
          baseUpdatedAt: created.file.updatedAt,
        }),
      }),
      { params: Promise.resolve({ id: fileId }) }
    );
    expect(updateResponse.status).toBe(200);

    const conflictResponse = await filePUT(
      apiRequest(`/api/files/${fileId}`, {
        method: 'PUT',
        token: authToken,
        body: jsonBody({
          content: 'Stale offline edit',
          baseUpdatedAt: '1970-01-01T00:00:00.000Z',
        }),
      }),
      { params: Promise.resolve({ id: fileId }) }
    );
    expect(conflictResponse.status).toBe(409);

    const foldersResponse = await foldersGET(
      apiRequest('/api/folders', { token: authToken })
    );
    const { folders } = await readJson<{ folders: { id: string; name: string }[] }>(
      foldersResponse
    );
    const targetFolder = folders.find((f) => f.name === 'My Notes');
    expect(targetFolder).toBeDefined();

    const moveResponse = await filePUT(
      apiRequest(`/api/files/${fileId}`, {
        method: 'PUT',
        token: authToken,
        body: jsonBody({ folderId: targetFolder!.id }),
      }),
      { params: Promise.resolve({ id: fileId }) }
    );
    expect(moveResponse.status).toBe(200);
    const moved = await readJson<{ file: { folderId: string | null } }>(moveResponse);
    expect(moved.file.folderId).toBe(targetFolder!.id);

    const deleteResponse = await fileDELETE(
      apiRequest(`/api/files/${fileId}`, {
        method: 'DELETE',
        token: authToken,
      }),
      { params: Promise.resolve({ id: fileId }) }
    );
    expect(deleteResponse.status).toBe(200);
  });
});

describe('folders API', () => {
  it('GET /api/folders returns a tree with seeded folder', async () => {
    const response = await foldersGET(
      apiRequest('/api/folders', { token: authToken })
    );

    expect(response.status).toBe(200);
    const body = await readJson<{ folders: { name: string }[] }>(response);
    expect(body.folders.some((f) => f.name === 'My Notes')).toBe(true);
  });
});

describe('search API', () => {
  it('GET /api/search returns 400 without query', async () => {
    const response = await searchGET(
      apiRequest('/api/search', { token: authToken })
    );
    expect(response.status).toBe(400);
  });

  it('GET /api/search finds seeded welcome note', async () => {
    const response = await searchGET(
      apiRequest('/api/search?q=Welcome', { token: authToken })
    );

    expect(response.status).toBe(200);
    const body = await readJson<{ files: { title: string }[] }>(response);
    expect(body.files.some((f) => f.title.includes('Welcome'))).toBe(true);
  });
});
