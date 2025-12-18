"use client"

import * as React from "react"
import { FileList } from "@/components/features/file-browser/file-list"
import { Sidebar } from "@/components/features/file-browser/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, User, LogOut, Loader2 } from "lucide-react"
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
import { filesApi } from "@/lib/api-client"
import { useFiles } from "@/lib/hooks/use-files"

export default function Home() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { mutate } = useFiles()
  const [isCreating, setIsCreating] = React.useState(false)
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)

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
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
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
          <FileList folderId={selectedFolderId} />
        </div>
      </main>
    </div>
  )
}
