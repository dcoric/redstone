import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from './contracts';

const bridge: DesktopBridge = {
  auth: {
    getSession: () => ipcRenderer.invoke('auth:get-session'),
    login: (email, password) => ipcRenderer.invoke('auth:login', email, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  files: {
    list: (query) => ipcRenderer.invoke('files:list', query),
    get: (id) => ipcRenderer.invoke('files:get', id),
    create: () => ipcRenderer.invoke('files:create'),
    update: (id, changes) => ipcRenderer.invoke('files:update', id, changes),
    delete: (id) => ipcRenderer.invoke('files:delete', id),
    resolveConflict: (id, resolution) =>
      ipcRenderer.invoke('files:resolve-conflict', id, resolution),
    sync: () => ipcRenderer.invoke('files:sync'),
  },
};

contextBridge.exposeInMainWorld('redstone', bridge);
