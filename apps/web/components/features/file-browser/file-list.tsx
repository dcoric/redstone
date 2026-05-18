"use client"

import * as React from "react"
import { MoreVertical, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFiles } from "@/lib/hooks/use-files"
import { filesApi } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import type { FileWithRelations } from "@/lib/types"

interface FileListProps extends React.HTMLAttributes<HTMLDivElement> {
    folderId?: string | null
}

export function FileList({ className, folderId, ...props }: FileListProps) {
    const { files, isLoading, isError, mutate } = useFiles({ folderId: folderId || undefined })
    const router = useRouter()

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
                <span className="material-symbols-outlined mb-4 text-4xl text-muted-foreground">description</span>
                <p className="text-sm font-medium">No files in this folder</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a note or import markdown to get started</p>
            </div>
        )
    }

    return (
        <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3", className)} {...props}>
            {files.map((file) => (
                <FileCard key={file.id} file={file} onDelete={handleDelete} onClick={handleFileClick} />
            ))}
        </div>
    )
}

function FileCard({
    file,
    onDelete,
    onClick
}: {
    file: FileWithRelations
    onDelete: (id: string) => void
    onClick: (id: string) => void
}) {
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
                <span className="material-symbols-outlined text-3xl text-primary">description</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                            <span className="material-symbols-outlined text-sm">folder</span>
                            {file.folder.name}
                        </span>
                    )}
                    <span>Edited {formatDate(file.updatedAt)}</span>
                </div>
            </div>
        </article>
    )
}
