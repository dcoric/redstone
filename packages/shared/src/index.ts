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
  folder?: Pick<Folder, 'id' | 'name'> | null;
  tags?: Array<{ tag: Tag }>;
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

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}

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

export interface FoldersListResponse {
  folders: Folder[];
}

export interface FolderResponse {
  folder: Folder;
}

export interface TagsListResponse {
  tags: Tag[];
}

export interface TagResponse {
  tag: Tag;
}

export interface SearchFile extends File {
  folder?: Pick<Folder, 'id' | 'name'> | null;
}

export interface SearchResponse {
  files: SearchFile[];
  query: string;
}

export interface SyncCollection<T> {
  upserted: T[];
  deleted: string[];
}

export interface SyncResponse {
  files: SyncCollection<FileWithRelations>;
  folders: SyncCollection<Folder>;
  syncedAt: string;
}

export interface SuccessResponse {
  message: string;
}

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
  baseUpdatedAt?: string;
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

export const SHARED_PKG_NAME = '@redstone/shared';
