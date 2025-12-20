"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { MarkdownEditor } from "@/components/features/editor/markdown-editor"
import { ArrowLeft, Save, Loader2, Tag as TagIcon, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useFile } from "@/lib/hooks/use-files"
import { useTags } from "@/lib/hooks/use-tags"
import { filesApi, tagsApi } from "@/lib/api-client"

export default function FilePage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const { file, isLoading, isError, mutate } = useFile(id)
    const { tags: availableTags, mutate: mutateTags } = useTags()
    
    const [content, setContent] = React.useState("")
    const [title, setTitle] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [hasChanges, setHasChanges] = React.useState(false)
    const [tagInput, setTagInput] = React.useState("")
    const [isAddingTag, setIsAddingTag] = React.useState(false)
    const [isRemovingTag, setIsRemovingTag] = React.useState<string | null>(null)
    const [showTagInput, setShowTagInput] = React.useState(false)

    const currentTags = file?.tags?.map(ft => ft.tag) || []

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

    const handleAddTag = React.useCallback(async (tagName: string) => {
        if (!id || !tagName.trim()) return

        setIsAddingTag(true)
        try {
            await tagsApi.addToFile(id, tagName.trim())
            await mutate() // Refresh file data
            await mutateTags() // Refresh tags list
            setTagInput("")
            setShowTagInput(false)
        } catch (error) {
            console.error("Failed to add tag:", error)
            alert("Failed to add tag. Please try again.")
        } finally {
            setIsAddingTag(false)
        }
    }, [id, mutate, mutateTags])

    const handleRemoveTag = React.useCallback(async (tagId: string) => {
        if (!id) return

        setIsRemovingTag(tagId)
        try {
            await tagsApi.removeFromFile(id, tagId)
            await mutate() // Refresh file data
            await mutateTags() // Refresh tags list
        } catch (error) {
            console.error("Failed to remove tag:", error)
            alert("Failed to remove tag. Please try again.")
        } finally {
            setIsRemovingTag(null)
        }
    }, [id, mutate, mutateTags])

    const filteredTags = React.useMemo(() => {
        const lowerQuery = tagInput.toLowerCase().trim()
        if (!lowerQuery) return availableTags
        return availableTags.filter(tag => 
            tag.name.toLowerCase().includes(lowerQuery) &&
            !currentTags.some(ct => ct.id === tag.id)
        )
    }, [availableTags, tagInput, currentTags])

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            handleAddTag(tagInput)
        } else if (e.key === 'Escape') {
            setShowTagInput(false)
            setTagInput("")
        }
    }

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
            <header className="flex flex-col border-b bg-muted/40">
                <div className="flex h-14 items-center justify-between px-4">
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
                </div>
                {/* Tags Section */}
                <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                    {currentTags.map((tag) => (
                        <div
                            key={tag.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                            <TagIcon className="h-3 w-3" />
                            <span>{tag.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag.id)}
                                disabled={isRemovingTag === tag.id}
                                className="rounded-full hover:bg-primary/20 p-0.5 transition-colors disabled:opacity-50"
                                aria-label={`Remove tag ${tag.name}`}
                            >
                                {isRemovingTag === tag.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <X className="h-3 w-3" />
                                )}
                            </button>
                        </div>
                    ))}
                    {showTagInput ? (
                        <div className="relative">
                            <Input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagInputKeyDown}
                                onBlur={() => {
                                    if (!tagInput.trim()) {
                                        setShowTagInput(false)
                                    }
                                }}
                                placeholder="Type tag name..."
                                className="h-7 w-32 text-xs"
                                autoFocus
                            />
                            {filteredTags.length > 0 && tagInput.trim() && (
                                <div className="absolute top-full left-0 z-10 mt-1 max-h-32 w-48 overflow-y-auto rounded-md border bg-background shadow-md">
                                    {filteredTags.slice(0, 5).map((tag) => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                handleAddTag(tag.name)
                                            }}
                                            className="w-full px-2 py-1.5 text-left text-xs hover:bg-muted"
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowTagInput(true)}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/30 px-2.5 py-1 text-xs text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                            <span>Add tag</span>
                        </button>
                    )}
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
