import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureValues = vi.hoisted(() => new Map<string, string>());

vi.mock('expo-secure-store', () => ({
    getItemAsync: vi.fn(async (key: string) => secureValues.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
        secureValues.set(key, value);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
        secureValues.delete(key);
    }),
}));

vi.mock('react-native', () => ({
    Platform: { OS: 'ios' },
}));

import { sessionStorage } from '../api-client';
import type { AuthSession } from '../api-client';

const session: AuthSession = {
    token: 'jwt-token',
    user: {
        id: 'user-1',
        email: 'mobile@redstone.app',
        name: 'Mobile User',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    },
};

describe('mobile session storage', () => {
    beforeEach(() => {
        secureValues.clear();
    });

    it('persists and restores a complete auth session', async () => {
        await sessionStorage.set(session);
        await expect(sessionStorage.get()).resolves.toEqual(session);
    });

    it('removes malformed session data', async () => {
        secureValues.set('redstone_auth_session', '{not-json');
        await expect(sessionStorage.get()).resolves.toBeNull();
        expect(secureValues.has('redstone_auth_session')).toBe(false);
    });

    it('removes the stored session on sign out', async () => {
        await sessionStorage.set(session);
        await sessionStorage.remove();
        await expect(sessionStorage.get()).resolves.toBeNull();
    });
});
