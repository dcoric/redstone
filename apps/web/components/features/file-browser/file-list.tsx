"use client"

import * as React from "react"
import { MoreVertical, Loader2, Check, FileText, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFiles } from "@/lib/hooks/use-files"
import { useFolders } from "@/lib/hooks/use-folders"
import { filesApi } from "@/lib/api-client"
import { buildFolderTree, flattenFolderTree } from "@/lib/folder-tree"
import { useRouter } from "next/navigation"
import type { FileWithRelations } from "@/lib/types"

interface FileListProps extends React.HTMLAttributes<HTMLDivElement> {
    folderId?: string | null
}

export function FileList({ className, folderId, ...props }: FileListProps) {
    const { files, isLoading, isError, mutate } = useFiles({ folderId: folderId || undefined })
    const { folders } = useFolders()
    const router = useRouter()
    const [movingFileId, setMovingFileId] = React.useState<string | null>(null)

    const foldersFlat = React.useMemo(
        () => flattenFolderTree(buildFolderTree(folders)),
        [folders]
    )

    const handleMove = async (fileId: string, targetFolderId: string | null) => {
        setMovingFileId(fileId)
        try {
            await filesApi.update(fileId, { folderId: targetFolderId })
            await mutate()
        } catch (error) {
            console.error("Failed to move file:", error)
            alert("Failed to move file. Please try again.")
        } finally {
            setMovingFileId(null)
        }
    }

    const handleDelete = async (fileId: string) => {
        if (!confirm("Are you sure you want to delete this file?")) {
            return
        }

        try {
            await filesApi.delete(fileId)
            await mutate()
        } catch (error) {
            console.error("Failed to delete file:", error)
            alert("Failed to delete file. Please try again.")
        }
    }

    const handleFileClick = (fileId: string) => {
        router.push(`/files/${fileId}`)
    }

    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center p-8", className)} {...props}>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
            </div>
        )
    }

    if (isError) {
        return (
            <div className={cn("flex items-center justify-center p-8", className)} {...props}>
                <span className="text-sm text-destructive">Failed to load files. Please try again.</span>
            </div>
        )
    }

    if (files.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)} {...props}>
                <FileText className="mb-4 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">No files in this folder</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a note or import markdown to get started</p>
            </div>
        )
    }

    return (
        <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3", className)} {...props}>
            {files.map((file) => (
                <FileCard
                    key={file.id}
                    file={file}
                    foldersFlat={foldersFlat}
                    isMoving={movingFileId === file.id}
                    onMove={handleMove}
                    onDelete={handleDelete}
                    onClick={handleFileClick}
                />
            ))}
        </div>
    )
}

function FileCard({
    file,
    foldersFlat,
    isMoving,
    onMove,
    onDelete,
    onClick,
}: {
    file: FileWithRelations
    foldersFlat: Array<{ folder: { id: string; name: string }; depth: number }>
    isMoving: boolean
    onMove: (fileId: string, folderId: string | null) => void
    onDelete: (id: string) => void
    onClick: (id: string) => void
}) {
    const currentFolderId = file.folderId ?? null

    const handleMove = (e: React.MouseEvent, targetFolderId: string | null) => {
        e.stopPropagation()
        if (targetFolderId === currentFolderId) return
        onMove(file.id, targetFolderId)
    }
    const handleClick = () => onClick(file.id)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const preview = (file.content || '').replace(/^#+\s*/gm, '').trim().slice(0, 180)
    const tags = file.tags?.map((t) => t.tag) ?? []

    return (
        <article
            className="group flex cursor-pointer flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-black/20 focus-within:ring-2 focus-within:ring-primary"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Open ${file.title}`}
        >
            <div className="mb-4 flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger disabled={isMoving}>
                                {isMoving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Moving...
                                    </>
                                ) : (
                                    "Move to folder"
                                )}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                                <DropdownMenuItem
                                    onClick={(e) => handleMove(e, null)}
                                    disabled={currentFolderId === null}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currentFolderId === null ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    No folder
                                </DropdownMenuItem>
                                {foldersFlat.map(({ folder, depth }) => (
                                    <DropdownMenuItem
                                        key={folder.id}
                                        onClick={(e) => handleMove(e, folder.id)}
                                        disabled={folder.id === currentFolderId}
                                        style={{ paddingLeft: `${8 + depth * 12}px` }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 shrink-0",
                                                folder.id === currentFolderId ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span className="truncate">{folder.name}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(file.id)
                            }}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-primary line-clamp-1">
                {file.title}
            </h3>
            {preview && (
                <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">{preview}</p>
            )}
            <div className="mt-auto space-y-3">
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 4).map((tag) => (
                            <span
                                key={tag.id}
                                className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {file.folder?.name && (
                        <span className="flex items-center gap-1">
                            <Folder className="h-3.5 w-3.5" />
                            {file.folder.name}
                        </span>
                    )}
                    <span>Edited {formatDate(file.updatedAt)}</span>
                </div>
            </div>
        </article>
    )
}
