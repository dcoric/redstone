"use client"

import * as React from "react"
import { ChevronRight, Folder, FolderOpen, Loader2, Plus, Edit2, Trash2, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFolders } from "@/lib/hooks/use-folders"
import { foldersApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Folder as FolderType } from "@/lib/types"

type FolderWithChildren = Omit<FolderType, 'children'> & { children: FolderWithChildren[] }

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onFolderSelect?: (folderId: string | null) => void
}

export function Sidebar({ className, onFolderSelect, ...props }: SidebarProps) {
    const { folders, isLoading, isError, mutate } = useFolders()
    const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [newFolderName, setNewFolderName] = React.useState("")
    const [parentFolderId, setParentFolderId] = React.useState<string | null>(null)
    const [isCreating, setIsCreating] = React.useState(false)
    const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null)
    const [editingFolderName, setEditingFolderName] = React.useState("")
    const [deletingFolderId, setDeletingFolderId] = React.useState<string | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [folderToDelete, setFolderToDelete] = React.useState<{ id: string; name: string } | null>(null)

    const handleFolderClick = (folderId: string | null) => {
        const newSelection = selectedFolderId === folderId ? null : folderId
        setSelectedFolderId(newSelection)
        onFolderSelect?.(newSelection)
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return

        setIsCreating(true)
        try {
            await foldersApi.create({
                name: newFolderName.trim(),
                parentId: parentFolderId || null,
            })
            await mutate()
            setIsCreateDialogOpen(false)
            setNewFolderName("")
            setParentFolderId(null)
        } catch (error) {
            console.error("Failed to create folder:", error)
            alert("Failed to create folder. Please try again.")
        } finally {
            setIsCreating(false)
        }
    }

    const handleRenameFolder = async (folderId: string) => {
        if (!editingFolderName.trim()) {
            setEditingFolderId(null)
            return
        }

        try {
            await foldersApi.update(folderId, {
                name: editingFolderName.trim(),
            })
            await mutate()
            setEditingFolderId(null)
            setEditingFolderName("")
        } catch (error) {
            console.error("Failed to rename folder:", error)
            alert("Failed to rename folder. Please try again.")
        }
    }

    const handleDeleteClick = (folderId: string, folderName: string) => {
        setFolderToDelete({ id: folderId, name: folderName })
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!folderToDelete) return

        setIsDeleting(true)
        setDeletingFolderId(folderToDelete.id)
        try {
            await foldersApi.delete(folderToDelete.id)
            await mutate()
            if (selectedFolderId === folderToDelete.id) {
                setSelectedFolderId(null)
                onFolderSelect?.(null)
            }
            setDeleteDialogOpen(false)
            setFolderToDelete(null)
        } catch (error) {
            console.error("Failed to delete folder:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to delete folder"
            alert(errorMessage)
        } finally {
            setIsDeleting(false)
            setDeletingFolderId(null)
        }
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

    const folderTree = React.useMemo(
        () => buildFolderTree(folders ?? []),
        [folders]
    )

    const allFoldersFlat = React.useMemo(() => {
        const flatten = (folders: FolderWithChildren[], result: FolderWithChildren[] = []): FolderWithChildren[] => {
            folders.forEach(folder => {
                result.push(folder)
                if (folder.children && folder.children.length > 0) {
                    flatten(folder.children, result)
                }
            })
            return result
        }
        return flatten(folderTree)
    }, [folderTree])

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

    return (
        <div className={cn("w-64 border-r bg-muted/10 pb-12", className)} {...props}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-2 flex items-center justify-between px-4">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Folders
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setIsCreateDialogOpen(true)}
                            aria-label="Create new folder"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
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
                                onRename={(id, name) => {
                                    setEditingFolderId(id)
                                    setEditingFolderName(name)
                                }}
                                onDelete={handleDeleteClick}
                                deletingFolderId={deletingFolderId}
                                isDeleting={isDeleting}
                                editingFolderId={editingFolderId}
                                editingFolderName={editingFolderName}
                                onEditingFolderNameChange={setEditingFolderName}
                                onSaveRename={handleRenameFolder}
                                onCancelRename={() => {
                                    setEditingFolderId(null)
                                    setEditingFolderName("")
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Create Folder Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Enter a name for the new folder.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="folder-name" className="text-sm font-medium">
                                Folder Name
                            </label>
                            <Input
                                id="folder-name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="My Folder"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateFolder()
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="parent-folder" className="text-sm font-medium">
                                Parent Folder (optional)
                            </label>
                            <select
                                id="parent-folder"
                                value={parentFolderId || ""}
                                onChange={(e) => setParentFolderId(e.target.value || null)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Root (no parent)</option>
                                {allFoldersFlat.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateDialogOpen(false)
                                setNewFolderName("")
                                setParentFolderId(null)
                            }}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateFolder}
                            disabled={isCreating || !newFolderName.trim()}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Folder Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Folder</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{folderToDelete?.name}&quot;? This will only work if the folder is empty.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false)
                                setFolderToDelete(null)
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function FolderItem({
    folder,
    depth = 0,
    selectedFolderId,
    onSelect,
    onRename,
    onDelete,
    deletingFolderId,
    isDeleting,
    editingFolderId,
    editingFolderName,
    onEditingFolderNameChange,
    onSaveRename,
    onCancelRename,
}: {
    folder: FolderWithChildren
    depth?: number
    selectedFolderId: string | null
    onSelect: (folderId: string | null) => void
    onRename: (id: string, name: string) => void
    onDelete: (id: string, name: string) => void
    deletingFolderId: string | null
    isDeleting: boolean
    editingFolderId: string | null
    editingFolderName: string
    onEditingFolderNameChange: (name: string) => void
    onSaveRename: (id: string) => void
    onCancelRename: () => void
}) {
    const isThisDeleting = deletingFolderId === folder.id && isDeleting
    const [isOpen, setIsOpen] = React.useState(false)
    const [showMenu, setShowMenu] = React.useState(false)
    const hasChildren = folder.children && folder.children.length > 0
    const isSelected = selectedFolderId === folder.id
    const isEditing = editingFolderId === folder.id
    const renameTriggeredRef = React.useRef(false)

    const handleClick = (e: React.MouseEvent) => {
        // Don't select if clicking on menu button
        if ((e.target as HTMLElement).closest('[data-menu-trigger]')) {
            return
        }
        if (hasChildren) {
            setIsOpen(!isOpen)
        }
        onSelect(folder.id)
    }

    const handleRenameClick = () => {
        onRename(folder.id, folder.name)
        setShowMenu(false)
    }

    const handleDeleteClick = () => {
        onDelete(folder.id, folder.name)
        setShowMenu(false)
    }

    const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            renameTriggeredRef.current = true
            onSaveRename(folder.id)
        } else if (e.key === 'Escape') {
            onCancelRename()
        }
    }

    return (
        <div>
            <div
                className={cn(
                    "group flex w-full items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    depth > 0 && "ml-4",
                    isSelected && "bg-accent"
                )}
            >
                <button
                    onClick={handleClick}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleClick(e as any)
                        }
                    }}
                    className="flex flex-1 items-center min-w-0"
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
                    {isEditing ? (
                        <Input
                            value={editingFolderName}
                            onChange={(e) => onEditingFolderNameChange(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={() => {
                                setTimeout(() => {
                                    if (renameTriggeredRef.current) {
                                        renameTriggeredRef.current = false
                                        return
                                    }
                                    if (isEditing) {
                                        onSaveRename(folder.id)
                                    }
                                }, 200)
                            }}
                            className="h-6 px-1.5 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="truncate">{folder.name}</span>
                    )}
                    {!isEditing && folder.fileCount !== undefined && folder.fileCount > 0 && (
                        <span className="ml-auto mr-2 text-xs text-muted-foreground">
                            {folder.fileCount}
                        </span>
                    )}
                </button>
                {!isEditing && (
                    <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                        <DropdownMenuTrigger asChild data-menu-trigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleRenameClick}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDeleteClick}
                                className="text-destructive focus:text-destructive"
                                disabled={isThisDeleting}
                            >
                                {isThisDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            {isOpen && hasChildren && (
                <div className="mt-1">
                    {folder.children.map((child) => (
                        <FolderItem
                            key={child.id}
                            folder={child}
                            depth={depth + 1}
                            selectedFolderId={selectedFolderId}
                            onSelect={onSelect}
                            onRename={onRename}
                            onDelete={onDelete}
                            deletingFolderId={deletingFolderId}
                            isDeleting={isDeleting}
                            editingFolderId={editingFolderId}
                            editingFolderName={editingFolderName}
                            onEditingFolderNameChange={onEditingFolderNameChange}
                            onSaveRename={onSaveRename}
                            onCancelRename={onCancelRename}
                            />
                    ))}
                </div>
            )}
        </div>
    )
}
