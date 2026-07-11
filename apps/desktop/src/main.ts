import path from 'node:path';
import { app, BrowserWindow, ipcMain, safeStorage, session } from 'electron';
import started from 'electron-squirrel-startup';
import { DesktopApiClient, DesktopApiError } from './api-client';
import { CredentialStore } from './credential-store';

if (started) app.quit();

const apiBaseUrl = process.env.REDSTONE_API_URL?.replace(/\/$/, '')
  ?? (app.isPackaged
    ? 'https://redstone.citadel.red/api'
    : 'http://localhost:3000/api');

let credentials: CredentialStore;
const api = new DesktopApiClient(apiBaseUrl);

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
    const token = await credentials.read();
    if (!token) return null;
    try {
      const { user } = await api.me(token);
      return { user };
    } catch (error) {
      if (error instanceof DesktopApiError && error.status === 401) {
        await credentials.clear();
        return null;
      }
      throw error;
    }
  });

  ipcMain.handle('auth:login', async (event, email: unknown, password: unknown) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email and password are required');
    }
    const response = await api.login(email, password);
    await credentials.save(response.token);
    return { user: response.user };
  });

  ipcMain.handle('auth:logout', async (event) => {
    assertTrustedSender(event.senderFrame?.url ?? '');
    await credentials.clear();
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
