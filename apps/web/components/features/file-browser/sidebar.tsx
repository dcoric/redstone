"use client"

import * as React from "react"
import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
// import useSWR from 'swr' // Will be used later

type FolderNode = {
    id: string
    name: string
    children?: FolderNode[]
}

// Mock data for initial dev
const mockFolders: FolderNode[] = [
    {
        id: "1",
        name: "Personal",
        children: [
            { id: "1-1", name: "Journal" },
            { id: "1-2", name: "Recipes" },
        ],
    },
    {
        id: "2",
        name: "Work",
        children: [
            { id: "2-1", name: "Projects" },
            { id: "2-2", name: "Meeting Notes" },
        ],
    },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className, ...props }: SidebarProps) {
    return (
        <div className={cn("w-64 border-r bg-muted/10 pb-12", className)} {...props}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Folders
                    </h2>
                    <div className="space-y-1">
                        {mockFolders.map((folder) => (
                            <FolderItem key={folder.id} folder={folder} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function FolderItem({ folder, depth = 0 }: { folder: FolderNode; depth?: number }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const hasChildren = folder.children && folder.children.length > 0

    return (
        <div>
            <button
                onClick={() => hasChildren && setIsOpen(!isOpen)}
                className={cn(
                    "group flex w-full items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    depth > 0 && "ml-4"
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
            </button>
            {isOpen && hasChildren && (
                <div className="mt-1">
                    {folder.children?.map((child) => (
                        <FolderItem key={child.id} folder={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}
