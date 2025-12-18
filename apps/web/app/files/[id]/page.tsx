"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { MarkdownEditor } from "@/components/features/editor/markdown-editor"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useFile } from "@/lib/hooks/use-files"
import { filesApi } from "@/lib/api-client"

export default function FilePage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const { file, isLoading, isError, mutate } = useFile(id)
    
    const [content, setContent] = React.useState("")
    const [title, setTitle] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [hasChanges, setHasChanges] = React.useState(false)

    // Update content when file loads
    React.useEffect(() => {
        if (file) {
            setContent(file.content)
            setTitle(file.title)
            setHasChanges(false)
        }
    }, [file])

    const handleContentChange = React.useCallback((value: string) => {
        setContent(value)
        setHasChanges(value !== file?.content || title !== file?.title)
    }, [file, title])

    const handleTitleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        setHasChanges(newTitle !== file?.title || content !== file?.content)
    }, [file, content])

    const handleSave = React.useCallback(async () => {
        if (!id || !file) return

        setIsSaving(true)
        try {
            await filesApi.update(id, {
                title: title || file.title,
                content: content,
            })
            await mutate() // Refresh file data
            setHasChanges(false)
        } catch (error) {
            console.error("Failed to save file:", error)
            alert("Failed to save file. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }, [id, file, title, content, mutate])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading file...</span>
                </div>
            </div>
        )
    }

    if (isError || !file) {
        return (
            <div className="flex h-screen flex-col bg-background">
                <header className="flex h-14 items-center border-b px-4 bg-muted/40">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                </header>
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm text-destructive mb-2">Failed to load file</p>
                        <Button variant="outline" onClick={() => router.push("/")}>
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b px-4 bg-muted/40">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        className="flex-1 bg-transparent border-none outline-none font-semibold text-base px-2 py-1 rounded hover:bg-muted/50 focus:bg-muted/50 focus:ring-1 focus:ring-ring min-w-0"
                        placeholder="Untitled"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <span className="text-xs text-muted-foreground">Unsaved changes</span>
                    )}
                    <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden">
                <MarkdownEditor 
                    initialContent={content}
                    onChange={handleContentChange}
                />
            </div>
        </div>
    )
}
