/**
 * Shared TypeScript types for the Redstone application
 * These mirror the Prisma schema and API responses
 */

// ============================================================================
// Database Models (matching Prisma schema)
// ============================================================================

export interface User {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface File {
    id: string;
    title: string;
    content: string;
    folderId: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    lastSynced: string;
}

export interface FileWithRelations extends File {
    folder?: {
        id: string;
        name: string;
    } | null;
    tags?: Array<{
        tag: Tag;
    }>;
}

export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    children?: Folder[];
    fileCount?: number;
}

export interface Tag {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    fileCount?: number;
}

export interface FileVersion {
    id: string;
    fileId: string;
    content: string;
    createdAt: string;
}

export interface FileTag {
    fileId: string;
    tagId: string;
    createdAt: string;

}

// ============================================================================
// API Response Types
// ============================================================================

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiError {
    error: string;
}

// Auth responses
export interface LoginResponse {
    token: string;
    user: User;
}

export interface RegisterResponse {
    user: User;
}

// File responses
export interface FilesListResponse {
    files: File[];
    pagination: Pagination;
}

export interface FileResponse {
    file: FileWithRelations;
}

export interface FileVersionsResponse {
    versions: FileVersion[];
}

// Folder responses
export interface FoldersListResponse {
    folders: Folder[];
}

export interface FolderResponse {
    folder: Folder;
}

// Tag responses
export interface TagsListResponse {
    tags: Tag[];
}

export interface TagResponse {
    tag: Tag;
}

// Search responses
export interface SearchFile extends File {
    folder?: {
        id: string;
        name: string;
    } | null;
}

export interface SearchResponse {
    files: SearchFile[];
    query: string;
}

// Sync responses
export interface SyncResponse {
    files: File[];
    folders: Folder[];
    tags: Tag[];
    deletedFiles: string[];
    deletedFolders: string[];
    timestamp: string;
}

// Generic success response
export interface SuccessResponse {
    message: string;
}

// ============================================================================
// Request Payload Types
// ============================================================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
}

export interface CreateFileRequest {
    title: string;
    content?: string;
    folderId?: string | null;
}

export interface UpdateFileRequest {
    title?: string;
    content?: string;
    folderId?: string | null;
}

export interface CreateFolderRequest {
    name: string;
    parentId?: string | null;
}

export interface UpdateFolderRequest {
    name?: string;
    parentId?: string | null;
}

export interface AddTagToFileRequest {
    tagName: string;
}

export interface FilesListParams {
    page?: number;
    limit?: number;
    folderId?: string;
    search?: string;
}

export interface SyncParams {
    since?: string;
}
