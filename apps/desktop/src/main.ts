import path from 'node:path';
import { app, BrowserWindow, ipcMain, safeStorage, session } from 'electron';
import started from 'electron-squirrel-startup';
import { DesktopApiClient, DesktopApiError } from './api-client';
import { CredentialStore } from './credential-store';
import { VaultDatabase } from './vault-database';
import { syncVault } from './sync';
import type { User } from '@redstone/shared';

if (started) app.quit();

const apiBaseUrl = process.env.REDSTONE_API_URL?.replace(/\/$/, '')
  ?? (app.isPackaged
    ? 'https://redstone.citadel.red/api'
    : 'http://localhost:3000/api');

let credentials: CredentialStore;
let vault: VaultDatabase;
const api = new DesktopApiClient(apiBaseUrl);

interface StoredAuth {
  token: string;
  user: User;
}

async function readStoredAuth(): Promise<StoredAuth | null> {
  const value = await credentials.read();
  if (!value) return null;
  try {
    return JSON.parse(value) as StoredAuth;
  } catch {
    await credentials.clear();
    return null;
  }
}

function assertTrustedSender(url: string): void {
  if (url.startsWith('file://')) return;
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    const expectedOrigin = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin;
    if (new URL(url).origin === expectedOrigin) return;
  }
  throw new Error('Blocked IPC call from an untrusted renderer');
}

function registerIpc(): void {
  ipcMain.handle('auth:get-session', async (event) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    const stored = await readStoredAuth();
    if (!stored) return null;
    try {
      const { user } = await api.me(stored.token);
      await credentials.save(JSON.stringify({ token: stored.token, user }));
      return { user };
    } catch (error) {
      if (error instanceof DesktopApiError && error.status === 401) {
        await credentials.clear();
        return null;
      }
      return { user: stored.user };
    }
  });

  ipcMain.handle('auth:login', async (event, email: unknown, password: unknown) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email and password are required');
    }
    const response = await api.login(email, password);
    await credentials.save(JSON.stringify({
      token: response.token,
      user: response.user,
    }));
    return { user: response.user };
  });

  ipcMain.handle('auth:logout', async (event) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    await credentials.clear();
  });

  ipcMain.handle('files:list', (event, query: unknown) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    if (query !== undefined && typeof query !== 'string') throw new Error('Invalid search query');
    return vault.list(query ?? '');
  });

  ipcMain.handle('files:get', (event, id: unknown) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    if (typeof id !== 'string') throw new Error('Invalid file ID');
    return vault.get(id);
  });

  ipcMain.handle('files:create', (event) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    return vault.create();
  });

  ipcMain.handle('files:update', (event, id: unknown, changes: unknown) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    if (typeof id !== 'string' || !changes || typeof changes !== 'object') {
      throw new Error('Invalid file update');
    }
    const candidate = changes as Record<string, unknown>;
    const update: { title?: string; content?: string; folderId?: string | null } = {};
    if (candidate.title !== undefined) {
      if (typeof candidate.title !== 'string') throw new Error('Invalid title');
      update.title = candidate.title;
    }
    if (candidate.content !== undefined) {
      if (typeof candidate.content !== 'string') throw new Error('Invalid content');
      update.content = candidate.content;
    }
    if (candidate.folderId !== undefined) {
      if (candidate.folderId !== null && typeof candidate.folderId !== 'string') {
        throw new Error('Invalid folder ID');
      }
      update.folderId = candidate.folderId as string | null;
    }
    return vault.update(id, update);
  });

  ipcMain.handle('files:delete', (event, id: unknown) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    if (typeof id !== 'string') throw new Error('Invalid file ID');
    vault.softDelete(id);
  });

  ipcMain.handle(
    'files:resolve-conflict',
    (event, id: unknown, resolution: unknown) => {
      assertTrustedSender(event.senderFrame?.url ?? '');
      if (
        typeof id !== 'string'
        || (resolution !== 'local' && resolution !== 'remote')
      ) {
        throw new Error('Invalid conflict resolution');
      }
      vault.resolveConflict(id, resolution);
    }
  );

  ipcMain.handle('files:sync', async (event) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    const stored = await readStoredAuth();
    return syncVault(vault, api, stored?.token ?? null);
  });
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b1326',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    const currentOrigin = new URL(mainWindow.webContents.getURL()).origin;
    if (new URL(targetUrl).origin !== currentOrigin) event.preventDefault();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
}

app.whenReady().then(() => {
  credentials = new CredentialStore(
    path.join(app.getPath('userData'), 'credentials.json'),
    safeStorage
  );
  vault = new VaultDatabase(path.join(app.getPath('userData'), 'vault.sqlite'));
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  vault?.close();
});
