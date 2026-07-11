import type { User } from '@redstone/shared';

export interface DesktopSession {
  user: User;
}

export interface DesktopFile {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lastSyncedAt: string | null;
  baseUpdatedAt: string | null;
  dirty: number;
  conflictJson: string | null;
}

export type DesktopConflict =
  | { kind: 'remote-update'; file: import('@redstone/shared').FileWithRelations }
  | { kind: 'remote-delete' };

export interface DesktopSyncResult {
  status: 'synced' | 'offline' | 'partial';
  errors: string[];
}

export interface DesktopBridge {
  auth: {
    getSession(): Promise<DesktopSession | null>;
    login(email: string, password: string): Promise<DesktopSession>;
    logout(): Promise<void>;
  };
  files: {
    list(query?: string): Promise<DesktopFile[]>;
    get(id: string): Promise<DesktopFile | null>;
    create(): Promise<DesktopFile>;
    update(id: string, changes: { title?: string; content?: string; folderId?: string | null }): Promise<DesktopFile>;
    delete(id: string): Promise<void>;
    resolveConflict(id: string, resolution: 'local' | 'remote'): Promise<void>;
    sync(): Promise<DesktopSyncResult>;
  };
}

declare global {
  interface Window {
    redstone: DesktopBridge;
  }
}
