import type { User } from '@redstone/shared';

export interface DesktopSession {
  user: User;
}

export interface DesktopBridge {
  auth: {
    getSession(): Promise<DesktopSession | null>;
    login(email: string, password: string): Promise<DesktopSession>;
    logout(): Promise<void>;
  };
}

declare global {
  interface Window {
    redstone: DesktopBridge;
  }
}
