"use client"

import * as React from "react"
import { FileList } from "@/components/features/file-browser/file-list"
import { Sidebar } from "@/components/features/file-browser/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, User, LogOut, Loader2, X } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { filesApi, searchApi } from "@/lib/api-client"
import { useFiles } from "@/lib/hooks/use-files"
import type { SearchFile } from "@/lib/types"

export default function Home() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { mutate } = useFiles()
  const [isCreating, setIsCreating] = React.useState(false)
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<SearchFile[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
    router.refresh()
  }

  const handleNewFile = async () => {
    setIsCreating(true)
    try {
      const response = await filesApi.create({
        title: "Untitled",
        content: "# Untitled\n\nStart writing your markdown here...",
        folderId: selectedFolderId || undefined,
      })
      await mutate() // Refresh file list
      router.push(`/files/${response.file.id}`)
    } catch (error) {
      console.error("Failed to create file:", error)
      alert("Failed to create file. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  React.useEffect(() => {
    const trimmedQuery = searchQuery.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    let isActive = true
    setIsSearching(true)

    const timeout = setTimeout(async () => {
      try {
        const response = await searchApi.search(trimmedQuery)
        if (!isActive) return
        setSearchResults(response.files)
        setSearchError(null)
      } catch (error) {
        console.error("Failed to search files:", error)
        if (!isActive) return
        setSearchResults([])
        setSearchError("Failed to search files. Please try again.")
      } finally {
        if (isActive) setIsSearching(false)
      }
    }, 300)

    return () => {
      isActive = false
      clearTimeout(timeout)
    }
  }, [searchQuery])

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const handleResultClick = (fileId: string) => {
    router.push(`/files/${fileId}`)
  }

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const escaped = escapeRegExp(query)
    const regex = new RegExp(`(${escaped})`, "ig")
    const parts = text.split(regex)
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-amber-200/70 px-0.5 text-foreground"
        >
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    )
  }

  const getSnippet = (content: string, query: string, maxLength = 160) => {
    if (!content) return ""
    if (!query) return content.slice(0, maxLength)
    const lower = content.toLowerCase()
    const matchIndex = lower.indexOf(query.toLowerCase())
    if (matchIndex === -1) return content.slice(0, maxLength)

    const contextBefore = 60
    const contextAfter = 80
    const start = Math.max(0, matchIndex - contextBefore)
    const end = Math.min(content.length, matchIndex + query.length + contextAfter)
    const prefix = start > 0 ? "…" : ""
    const suffix = end < content.length ? "…" : ""

    return `${prefix}${content.slice(start, end)}${suffix}`
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

  const showSearchResults = searchQuery.trim().length > 0

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onFolderSelect={setSelectedFolderId} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search files..."
                className="w-full rounded-lg bg-background pl-8 pr-8 md:w-[200px] lg:w-[320px]"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <div className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center text-muted-foreground">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              size="sm" 
              onClick={handleNewFile}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  New File
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <User className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {showSearchResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for "{searchQuery.trim()}"
                </span>
                {searchError ? <span className="text-destructive">{searchError}</span> : null}
              </div>
              {isSearching && searchResults.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : null}
              {!isSearching && !searchError && searchResults.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No matches found. Try a different query.
                </div>
              ) : null}
              <div className="space-y-3">
                {searchResults.map((file) => {
                  const snippet = getSnippet(file.content, searchQuery.trim())
                  return (
                    <button
                      type="button"
                      key={file.id}
                      className="w-full rounded-lg border bg-background p-4 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => handleResultClick(file.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-medium">
                            {highlightMatch(file.title, searchQuery.trim())}
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {file.folder?.name ? `Folder: ${file.folder.name}` : "No folder"} · Edited{" "}
                            {formatDate(file.updatedAt)}
                          </p>
                        </div>
                      </div>
                      {snippet ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                          {highlightMatch(snippet, searchQuery.trim())}
                        </p>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <FileList folderId={selectedFolderId} />
          )}
        </div>
      </main>
    </div>
  )
}
