"use client"

import * as React from "react"
import { FileText, MoreVertical, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { File } from "@/lib/types"

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
            await mutate() // Refresh the file list
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
            <div className={cn("flex items-center justify-center p-8", className)} {...props}>
                <span className="text-sm text-muted-foreground">No files found. Create a new file to get started.</span>
            </div>
        )
    }

    return (
        <div className={cn("grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)} {...props}>
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
    file: File
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

    return (
        <Card
            className="overflow-hidden transition-all hover:shadow-md cursor-pointer focus-within:ring-2 focus-within:ring-ring"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Open ${file.title}`}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <CardTitle className="text-base font-medium truncate" title={file.title}>
                        {file.title}
                    </CardTitle>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
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
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="text-xs text-muted-foreground">
                    Edited {formatDate(file.updatedAt)}
                </div>
            </CardContent>
        </Card>
    )
}
