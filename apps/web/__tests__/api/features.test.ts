import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@redstone/database';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as filesPOST } from '@/app/api/files/route';
import { DELETE as fileDELETE } from '@/app/api/files/[id]/route';
import { GET as tagsGET } from '@/app/api/tags/route';
import { POST as addTagPOST } from '@/app/api/files/[id]/tags/route';
import { DELETE as removeTagDELETE } from '@/app/api/files/[id]/tags/[tagId]/route';
import { GET as graphGET } from '@/app/api/graph/route';
import { GET as syncGET } from '@/app/api/sync/route';
import { POST as attachmentsPOST } from '@/app/api/attachments/route';
import { GET as eventsGET } from '@/app/api/events/route';
import { apiRequest, jsonBody, readJson } from '../helpers';

let authToken: string;
let welcomeFileId: string;

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
  const body = await readJson<{ token: string; user: { id: string } }>(response);
  authToken = body.token;

  const welcomeFile = await prisma.file.findFirstOrThrow({
    where: {
      userId: body.user.id,
      title: 'Welcome to Redstone',
      deletedAt: null,
    },
  });
  welcomeFileId = welcomeFile.id;
});

describe('tags API', () => {
  it('lists, adds, and removes tags', async () => {
    const initialResponse = await tagsGET(
      apiRequest('/api/tags', { token: authToken })
    );
    expect(initialResponse.status).toBe(200);
    const initial = await readJson<{ tags: { name: string }[] }>(initialResponse);
    expect(initial.tags.some((tag) => tag.name === 'welcome')).toBe(true);

    const syncCursor = new Date(Date.now() - 1000).toISOString();
    const tagName = `vitest-${Date.now()}`;
    const addResponse = await addTagPOST(
      apiRequest(`/api/files/${welcomeFileId}/tags`, {
        method: 'POST',
        token: authToken,
        body: jsonBody({ tagName }),
      }),
      { params: Promise.resolve({ id: welcomeFileId }) }
    );
    expect(addResponse.status).toBe(201);
    const added = await readJson<{ tag: { id: string; name: string } }>(addResponse);
    expect(added.tag.name).toBe(tagName);

    const syncResponse = await syncGET(
      apiRequest(`/api/sync?since=${encodeURIComponent(syncCursor)}`, {
        token: authToken,
      })
    );
    const changes = await readJson<{
      files: {
        upserted: Array<{
          id: string;
          tags: Array<{ tag: { name: string } }>;
        }>;
      };
    }>(syncResponse);
    const changedFile = changes.files.upserted.find(
      (file) => file.id === welcomeFileId
    );
    expect(changedFile?.tags.some((fileTag) => fileTag.tag.name === tagName)).toBe(true);

    const removeResponse = await removeTagDELETE(
      apiRequest(`/api/files/${welcomeFileId}/tags/${added.tag.id}`, {
        method: 'DELETE',
        token: authToken,
      }),
      { params: Promise.resolve({ id: welcomeFileId, tagId: added.tag.id }) }
    );
    expect(removeResponse.status).toBe(200);
  });
});

describe('graph API', () => {
  it('returns an edge for a wiki link between files', async () => {
    const suffix = Date.now();
    const targetTitle = `Graph Target ${suffix}`;
    const targetResponse = await filesPOST(
      apiRequest('/api/files', {
        method: 'POST',
        token: authToken,
        body: jsonBody({ title: targetTitle, content: '' }),
      })
    );
    const target = await readJson<{ file: { id: string } }>(targetResponse);

    const sourceResponse = await filesPOST(
      apiRequest('/api/files', {
        method: 'POST',
        token: authToken,
        body: jsonBody({
          title: `Graph Source ${suffix}`,
          content: `Links to [[${targetTitle}]]`,
        }),
      })
    );
    const source = await readJson<{ file: { id: string } }>(sourceResponse);

    const graphResponse = await graphGET(
      apiRequest('/api/graph', { token: authToken })
    );
    expect(graphResponse.status).toBe(200);
    const graph = await readJson<{
      edges: Array<{ source: string; target: string }>;
    }>(graphResponse);
    expect(graph.edges).toContainEqual({
      source: source.file.id,
      target: target.file.id,
    });

    for (const id of [source.file.id, target.file.id]) {
      await fileDELETE(
        apiRequest(`/api/files/${id}`, { method: 'DELETE', token: authToken }),
        { params: Promise.resolve({ id }) }
      );
    }
  });
});

describe('sync API', () => {
  it('validates the cursor and returns incremental changes', async () => {
    const missingCursor = await syncGET(
      apiRequest('/api/sync', { token: authToken })
    );
    expect(missingCursor.status).toBe(400);

    const response = await syncGET(
      apiRequest('/api/sync?since=1970-01-01T00:00:00.000Z', {
        token: authToken,
      })
    );
    expect(response.status).toBe(200);
    const body = await readJson<{
      files: { upserted: Array<{ id: string }>; deleted: string[] };
      folders: { upserted: Array<{ id: string }>; deleted: string[] };
      syncedAt: string;
    }>(response);
    expect(body.files.upserted.some((file) => file.id === welcomeFileId)).toBe(true);
    expect(body.folders.upserted.length).toBeGreaterThan(0);
    expect(new Date(body.syncedAt).toString()).not.toBe('Invalid Date');
  });
});

describe('attachments API', () => {
  it('uploads an allowed file and records its metadata', async () => {
    const formData = new FormData();
    formData.set(
      'file',
      new File([new Uint8Array([137, 80, 78, 71])], 'tiny.png', {
        type: 'image/png',
      })
    );

    const response = await attachmentsPOST(
      apiRequest('/api/attachments', {
        method: 'POST',
        token: authToken,
        body: formData,
      })
    );
    expect(response.status).toBe(201);
    const body = await readJson<{
      attachment: { id: string; storedFilename: string; mimeType: string };
    }>(response);
    expect(body.attachment.mimeType).toBe('image/png');

    await prisma.attachment.delete({ where: { id: body.attachment.id } });
    await fs.unlink(
      path.join(process.cwd(), 'public', 'uploads', body.attachment.storedFilename)
    );
  });
});

describe('events API', () => {
  it('opens an authenticated event stream and emits the connection event', async () => {
    const response = await eventsGET(
      apiRequest('/api/events', { token: authToken })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');

    const reader = response.body!.getReader();
    const firstChunk = await reader.read();
    expect(new TextDecoder().decode(firstChunk.value)).toContain(
      '"event":"connected"'
    );
    await reader.cancel();
  });
});
