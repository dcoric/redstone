import type { LocalFolder } from './db';

export interface FolderOption {
    folder: LocalFolder;
    depth: number;
}

export function flattenFolders(folders: LocalFolder[]): FolderOption[] {
    const children = new Map<string | null, LocalFolder[]>();
    const knownIds = new Set(folders.map((folder) => folder.id));

    for (const folder of folders) {
        const parentId = folder.parent_id && knownIds.has(folder.parent_id)
            ? folder.parent_id
            : null;
        const siblings = children.get(parentId) ?? [];
        siblings.push(folder);
        children.set(parentId, siblings);
    }

    for (const siblings of children.values()) {
        siblings.sort((left, right) => left.name.localeCompare(right.name));
    }

    const result: FolderOption[] = [];
    const visit = (parentId: string | null, depth: number) => {
        for (const folder of children.get(parentId) ?? []) {
            result.push({ folder, depth });
            visit(folder.id, depth + 1);
        }
    };

    visit(null, 0);
    return result;
}
