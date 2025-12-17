"use client"

import { FileList } from "@/components/features/file-browser/file-list"
import { Sidebar } from "@/components/features/file-browser/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
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
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New File
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <FileList />
        </div>
      </main>
    </div>
  )
}
