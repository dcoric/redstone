"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { MarkdownEditor } from "@/components/features/editor/markdown-editor"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function FilePage() {
    const params = useParams()
    const id = params?.id as string

    // Mock content fetching based on ID
    const initialContent = `# File ${id}\n\nStart writing your markdown here...`

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b px-4 bg-muted/40">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <span className="font-semibold">File {id}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </header>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden">
                <MarkdownEditor initialContent={initialContent} />
            </div>
        </div>
    )
}
