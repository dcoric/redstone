"use client"

import * as React from "react"
import { ChevronRight, Folder, FolderOpen, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFolders } from "@/lib/hooks/use-folders"
import type { Folder as FolderType } from "@/lib/types"

type FolderWithChildren = Omit<FolderType, 'children'> & { children: FolderWithChildren[] }

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onFolderSelect?: (folderId: string | null) => void
}

export function Sidebar({ className, onFolderSelect, ...props }: SidebarProps) {
    const { folders, isLoading, isError } = useFolders()
    const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)

    const handleFolderClick = (folderId: string | null) => {
        const newSelection = selectedFolderId === folderId ? null : folderId
        setSelectedFolderId(newSelection)
        onFolderSelect?.(newSelection)
    }

    const buildFolderTree = (folders: FolderType[]): FolderWithChildren[] => {
        const folderMap = new Map<string, FolderWithChildren>()
        const rootFolders: FolderWithChildren[] = []

        // First pass: create map of all folders with children array
        folders.forEach(folder => {
            folderMap.set(folder.id, { ...folder, children: [] })
        })

        // Second pass: build tree structure
        folders.forEach(folder => {
            const folderWithChildren = folderMap.get(folder.id)!
            if (folder.parentId) {
                const parent = folderMap.get(folder.parentId)
                if (parent) {
                    parent.children.push(folderWithChildren)
                } else {
                    // Parent not found, treat as root
                    rootFolders.push(folderWithChildren)
                }
            } else {
                rootFolders.push(folderWithChildren)
            }
        })

        return rootFolders
    }

    if (isLoading) {
        return (
            <div className={cn("w-64 border-r bg-muted/10 pb-12", className)} {...props}>
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className={cn("w-64 border-r bg-muted/10 pb-12", className)} {...props}>
                <div className="p-4">
                    <p className="text-sm text-destructive">Failed to load folders</p>
                </div>
            </div>
        )
    }

    const folderTree = buildFolderTree(folders)

    return (
        <div className={cn("w-64 border-r bg-muted/10 pb-12", className)} {...props}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Folders
                    </h2>
                    <div className="space-y-1">
                        <button
                            onClick={() => handleFolderClick(null)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleFolderClick(null)
                                }
                            }}
                            className={cn(
                                "group flex w-full items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                selectedFolderId === null && "bg-accent"
                            )}
                        >
                            <span className="mr-1 h-4 w-4" />
                            <Folder className="mr-2 h-4 w-4 shrink-0 fill-sky-500/20 text-sky-500" />
                            <span className="truncate">All Files</span>
                        </button>
                        {folderTree.map((folder) => (
                            <FolderItem 
                                key={folder.id} 
                                folder={folder} 
                                selectedFolderId={selectedFolderId}
                                onSelect={handleFolderClick}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function FolderItem({
    folder,
    depth = 0,
    selectedFolderId,
    onSelect
}: {
    folder: FolderWithChildren
    depth?: number
    selectedFolderId: string | null
    onSelect: (folderId: string | null) => void
}) {
    const [isOpen, setIsOpen] = React.useState(false)
    const hasChildren = folder.children && folder.children.length > 0
    const isSelected = selectedFolderId === folder.id

    const handleClick = () => {
        if (hasChildren) {
            setIsOpen(!isOpen)
        }
        onSelect(folder.id)
    }

    return (
        <div>
            <button
                onClick={handleClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleClick()
                    }
                }}
                className={cn(
                    "group flex w-full items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    depth > 0 && "ml-4",
                    isSelected && "bg-accent"
                )}
            >
                {hasChildren ? (
                    <ChevronRight
                        className={cn(
                            "mr-1 h-4 w-4 shrink-0 transition-transform",
                            isOpen && "rotate-90"
                        )}
                    />
                ) : (
                    <span className="mr-1 h-4 w-4" />
                )}

                {isOpen ? (
                    <FolderOpen className="mr-2 h-4 w-4 shrink-0 fill-sky-500/20 text-sky-500" />
                ) : (
                    <Folder className="mr-2 h-4 w-4 shrink-0 fill-sky-500/20 text-sky-500" />
                )}
                <span className="truncate">{folder.name}</span>
                {folder.fileCount !== undefined && folder.fileCount > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                        {folder.fileCount}
                    </span>
                )}
            </button>
            {isOpen && hasChildren && (
                <div className="mt-1">
                    {folder.children.map((child) => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            depth={depth + 1}
                            selectedFolderId={selectedFolderId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
