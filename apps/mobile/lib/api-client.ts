/**
 * API Client utilities for making authenticated requests on mobile
 * Uses Expo SecureStore for JWT token storage
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
    LoginResponse,
    RegisterResponse,
    FilesListResponse,
    FileResponse,
    FileVersionsResponse,
    FoldersListResponse,
    FolderResponse,
    TagsListResponse,
    TagResponse,
    SearchResponse,
    SuccessResponse,
    CreateFileRequest,
    UpdateFileRequest,
    CreateFolderRequest,
    UpdateFolderRequest,
    FilesListParams,
    ApiError,
    SyncResponse,
    CurrentUserResponse,
    User,
} from './types';

// Detect if running on emulator/device for localhost
// Android Emulator uses 10.0.2.2 for localhost
const LOCALHOST_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? LOCALHOST_URL;

const SESSION_KEY = 'redstone_auth_session';

export interface AuthSession {
    token: string;
    user: User;
}

export class ApiClientError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'ApiClientError';
    }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
    unauthorizedHandler = handler;
}

/**
 * Token management
 */
export const sessionStorage = {
    get: async (): Promise<AuthSession | null> => {
        const value = await SecureStore.getItemAsync(SESSION_KEY);
        if (!value) return null;

        try {
            return JSON.parse(value) as AuthSession;
        } catch {
            await SecureStore.deleteItemAsync(SESSION_KEY);
            return null;
        }
    },
    set: async (session: AuthSession) => {
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    },
    remove: async () => {
        await SecureStore.deleteItemAsync(SESSION_KEY);
    },
};

/**
 * Base fetch function with error handling and auth header
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const session = await sessionStorage.get();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                await sessionStorage.remove();
                unauthorizedHandler?.();
            }

            let errorMessage = `HTTP error! status: ${response.status}`;
            let errorDetails: unknown;
            try {
                const errorData = await response.json() as ApiError;
                errorMessage = errorData.error || errorMessage;
                errorDetails = errorData;
            } catch {
                // If JSON parsing fails, use the default error message
            }
            throw new ApiClientError(errorMessage, response.status, errorDetails);
        }

        const data = await response.json();
        return data as T;
    } catch (error) {
        console.error(`API Call failed: ${endpoint}`, error);
        throw error;
    }
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T>(
    endpoint: string,
    body?: unknown
): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * PUT request
 */
export async function apiPut<T>(
    endpoint: string,
    body?: unknown
): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, { method: 'DELETE' });
}

/**
 * Auth API functions
 */
export const authApi = {
    login: (email: string, password: string) =>
        apiPost<LoginResponse>('/auth/login', { email, password }),
    register: (email: string, password: string, name?: string) =>
        apiPost<RegisterResponse>('/auth/register', { email, password, name }),
    me: () => apiGet<CurrentUserResponse>('/auth/me'),
};

/**
 * Files API functions
 */
export const filesApi = {
    list: (params?: FilesListParams) => {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', params.page.toString());
        if (params?.limit) query.set('limit', params.limit.toString());
        if (params?.folderId) query.set('folderId', params.folderId);
        if (params?.search) query.set('search', params.search);
        const queryString = query.toString();
        return apiGet<FilesListResponse>(
            `/files${queryString ? `?${queryString}` : ''}`
        );
    },
    get: (id: string) => apiGet<FileResponse>(`/files/${id}`),
    create: (data: CreateFileRequest) =>
        apiPost<FileResponse>('/files', data),
    update: (id: string, data: UpdateFileRequest) =>
        apiPut<FileResponse>(`/files/${id}`, data),
    delete: (id: string, baseUpdatedAt?: string | null) => {
        const query = baseUpdatedAt
            ? `?baseUpdatedAt=${encodeURIComponent(baseUpdatedAt)}`
            : '';
        return apiDelete<SuccessResponse>(`/files/${id}${query}`);
    },
    getVersions: (id: string) => apiGet<FileVersionsResponse>(`/files/${id}/versions`),
};

/**
 * Folders API functions
 */
export const foldersApi = {
    list: () => apiGet<FoldersListResponse>('/folders'),
    get: (id: string) => apiGet<FolderResponse>(`/folders/${id}`),
    create: (data: CreateFolderRequest) =>
        apiPost<FolderResponse>('/folders', data),
    update: (id: string, data: UpdateFolderRequest) =>
        apiPut<FolderResponse>(`/folders/${id}`, data),
    delete: (id: string) => apiDelete<SuccessResponse>(`/folders/${id}`),
};

/**
 * Tags API functions
 */
export const tagsApi = {
    list: () => apiGet<TagsListResponse>('/tags'),
    addToFile: (fileId: string, tagName: string) =>
        apiPost<TagResponse>(`/files/${fileId}/tags`, { tagName }),
    removeFromFile: (fileId: string, tagId: string) =>
        apiDelete<SuccessResponse>(`/files/${fileId}/tags/${tagId}`),
};

/**
 * Search API functions
 */
export const searchApi = {
    search: (query: string) =>
        apiGet<SearchResponse>(`/search?q=${encodeURIComponent(query)}`),
};

export const syncApi = {
    pull: (since: string) =>
        apiGet<SyncResponse>(`/sync?since=${encodeURIComponent(since)}`),
};
