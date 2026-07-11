import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CredentialStore, type SecretCipher } from '../credential-store';

const cipher: SecretCipher = {
  encryptStringAsync: async (value) => Buffer.from(`encrypted:${value}`),
  decryptStringAsync: async (value) => ({
    result: value.toString().replace(/^encrypted:/, ''),
    shouldReEncrypt: false,
  }),
};

describe('CredentialStore', () => {
  it('persists only encrypted token material', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'redstone-credentials-'));
    const filePath = path.join(directory, 'credentials.json');
    const store = new CredentialStore(filePath, cipher);

    await store.save('secret-jwt');

    expect(await store.read()).toBe('secret-jwt');
    expect(await readFile(filePath, 'utf8')).not.toContain('secret-jwt');
  });

  it('clears malformed credential files', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'redstone-credentials-'));
    const store = new CredentialStore(path.join(directory, 'missing.json'), cipher);
    await expect(store.read()).resolves.toBeNull();
    await expect(store.clear()).resolves.toBeUndefined();
  });
});
