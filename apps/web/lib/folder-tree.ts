import type { Folder } from '@/lib/types';

export type FolderTreeNode = Folder & { children: FolderTreeNode[] };

export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const folderMap = new Map<string, FolderTreeNode>();
  const rootFolders: FolderTreeNode[] = [];

  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  folders.forEach((folder) => {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        rootFolders.push(node);
      }
    } else {
      rootFolders.push(node);
    }
  });

  return rootFolders;
}

export function flattenFolderTree(
  tree: FolderTreeNode[],
  depth = 0,
  result: Array<{ folder: Folder; depth: number }> = []
): Array<{ folder: Folder; depth: number }> {
  tree.forEach((node) => {
    result.push({ folder: node, depth });
    if (node.children.length > 0) {
      flattenFolderTree(node.children, depth + 1, result);
    }
  });
  return result;
}
