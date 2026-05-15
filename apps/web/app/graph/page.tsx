"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { ArrowLeft, Filter, X, Tag, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFiles } from "@/lib/hooks/use-files"
import { useTags } from "@/lib/hooks/use-tags"
import { useFolders } from "@/lib/hooks/use-folders"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })

interface GraphNode {
  id: string
  label: string
  folder: string
  tags: string[]
}

interface GraphEdge {
  source: string
  target: string
}

export default function GraphPage() {
  const router = useRouter()
  const { files } = useFiles()
  const { tags } = useTags()
  const { folders } = useFolders()

  const [graphData, setGraphData] = React.useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] })
  const [filterTag, setFilterTag] = React.useState<string | null>(null)
  const [filterFolder, setFilterFolder] = React.useState<string | null>(null)
  const [showFilters, setShowFilters] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const params = new URLSearchParams()
    if (filterTag) params.set("tag", filterTag)
    if (filterFolder) params.set("folder", filterFolder)

    fetch(`/api/graph?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch(console.error)
  }, [filterTag, filterFolder])

  const filteredNodes = React.useMemo(() => {
    if (!searchQuery) return graphData.nodes
    return graphData.nodes.filter((node) =>
      node.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [graphData.nodes, searchQuery])

  const filteredEdges = React.useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    return graphData.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )
  }, [graphData.edges, filteredNodes])

  const handleNodeClick = (node: GraphNode) => {
    const file = files.find((f: any) => f.title.toLowerCase() === node.label.toLowerCase())
    if (file) {
      router.push(`/files/${file.id}`)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b px-4 bg-muted/40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-semibold">Graph View</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 h-8 text-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {showFilters && (
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                <Tag className="h-3 w-3 inline mr-1" />
                Filter by Tag
              </label>
              <select
                className="h-8 px-2 text-sm border rounded bg-background"
                value={filterTag || ""}
                onChange={(e) => setFilterTag(e.target.value || null)}
              >
                <option value="">All tags</option>
                {tags.map((tag: any) => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                <Folder className="h-3 w-3 inline mr-1" />
                Filter by Folder
              </label>
              <select
                className="h-8 px-2 text-sm border rounded bg-background"
                value={filterFolder || ""}
                onChange={(e) => setFilterFolder(e.target.value || null)}
              >
                <option value="">All folders</option>
                {folders.map((folder: any) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            {(filterTag || filterFolder) && (
              <button
                onClick={() => {
                  setFilterTag(null)
                  setFilterFolder(null)
                }}
                className="self-end h-8 px-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <ForceGraph2D
          graphData={{ nodes: filteredNodes, links: filteredEdges }}
          nodeLabel="label"
          nodeColor={() => "#64748b"}
          nodeVal={6}
          nodeRelSize={3}
          linkColor={() => "#e2e8f0"}
          linkWidth={1}
          onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
          backgroundColor="#0f172a"
        />
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-xs text-muted-foreground">
          <div className="font-medium mb-1">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span>Default</span>
          </div>
          {filterTag && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Tag: {filterTag}</span>
            </div>
          )}
          {filterFolder && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Filtered by folder</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
