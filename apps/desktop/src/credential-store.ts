import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface SecretCipher {
  encryptStringAsync(value: string): Promise<Buffer>;
  decryptStringAsync(value: Buffer): Promise<{
    result: string;
    shouldReEncrypt: boolean;
  }>;
}

export class CredentialStore {
  constructor(
    private readonly filePath: string,
    private readonly cipher: SecretCipher
  ) {}

  async save(token: string): Promise<void> {
    const encrypted = await this.cipher.encryptStringAsync(token);
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      JSON.stringify({ encryptedToken: encrypted.toString('base64') }),
      { encoding: 'utf8', mode: 0o600 }
    );
  }

  async read(): Promise<string | null> {
    try {
      const contents = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(contents) as { encryptedToken?: string };
      if (!parsed.encryptedToken) return null;
      const decrypted = await this.cipher.decryptStringAsync(
        Buffer.from(parsed.encryptedToken, 'base64')
      );
      if (decrypted.shouldReEncrypt) await this.save(decrypted.result);
      return decrypted.result;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      await this.clear();
      return null;
    }
  }

  async clear(): Promise<void> {
    await rm(this.filePath, { force: true });
  }
}
