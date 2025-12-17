"use client"

import * as React from "react"
import { FileText, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FileNode = {
    id: string
    title: string
    updatedAt: string
}

// Mock data
const mockFiles: FileNode[] = [
    { id: "1", title: "Project Plan.md", updatedAt: "2h ago" },
    { id: "2", title: "Meeting Notes.md", updatedAt: "5h ago" },
    { id: "3", title: "Ideas.md", updatedAt: "1d ago" },
]

interface FileListProps extends React.HTMLAttributes<HTMLDivElement> { }

export function FileList({ className, ...props }: FileListProps) {
    return (
        <div className={cn("grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)} {...props}>
            {mockFiles.map((file) => (
                <FileCard key={file.id} file={file} />
            ))}
        </div>
    )
}

function FileCard({ file }: { file: FileNode }) {
    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-base font-medium truncate" title={file.title}>
                        {file.title}
                    </CardTitle>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="text-xs text-muted-foreground">
                    Edited {file.updatedAt}
                </div>
            </CardContent>
        </Card>
    )
}
