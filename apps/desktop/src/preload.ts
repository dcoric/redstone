import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from './contracts';

const bridge: DesktopBridge = {
  auth: {
    getSession: () => ipcRenderer.invoke('auth:get-session'),
    login: (email, password) => ipcRenderer.invoke('auth:login', email, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
};

contextBridge.exposeInMainWorld('redstone', bridge);
