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
} from './types';

// Detect if running on emulator/device for localhost
// Android Emulator uses 10.0.2.2 for localhost
const LOCAHOST_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
// TODO: Replace with environment variable or production URL
const API_BASE_URL = LOCAHOST_URL;

const TOKEN_KEY = 'redstone_jwt_token';

/**
 * Token management
 */
export const tokenStorage = {
    get: async () => {
        try {
            return await SecureStore.getItemAsync(TOKEN_KEY);
        } catch {
            return null;
        }
    },
    set: async (token: string) => {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
        } catch {
            // ignore
        }
    },
    remove: async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch {
            // ignore
        }
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
    const token = await tokenStorage.get();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            // Handle 401 Unauthorized globally if needed (e.g. clear token)
            if (response.status === 401) {
                // Option: emit event or just let caller handle
                // For now, let's just throw
            }

            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json() as ApiError;
                errorMessage = errorData.error || errorMessage;
            } catch {
                // If JSON parsing fails, use the default error message
            }
            throw new Error(errorMessage);
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
    delete: (id: string) => apiDelete<SuccessResponse>(`/files/${id}`),
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
