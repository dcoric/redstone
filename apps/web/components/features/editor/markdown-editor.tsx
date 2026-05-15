"use client"

import * as React from "react"
import CodeMirror from "@uiw/react-codemirror"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { oneDark } from "@codemirror/theme-one-dark"
import { vim } from "@replit/codemirror-vim"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import { cn } from "@/lib/utils"
import { wikiLinkAutocomplete, WikiLinkFile } from "./wiki-link-autocomplete"
import wikiLinkPlugin from "./wiki-link-remark-plugin"

interface MarkdownEditorProps {
    initialContent?: string
    onChange?: (value: string) => void
    readOnly?: boolean
    className?: string
    files?: WikiLinkFile[]
    onWikiLinkClick?: (title: string) => void
    vimMode?: boolean
}

export function MarkdownEditor({
    initialContent = "",
    onChange,
    readOnly = false,
    className,
    files = [],
    onWikiLinkClick,
    vimMode = false,
}: MarkdownEditorProps) {
    const [content, setContent] = React.useState(initialContent)
    const [isPreview, setIsPreview] = React.useState(false)

    React.useEffect(() => {
        setContent(initialContent)
    }, [initialContent])

    const handleChange = React.useCallback(
        (value: string) => {
            setContent(value)
            onChange?.(value)
        },
        [onChange]
    )

    const extensions = React.useMemo(() => {
        const exts: any[] = [
            markdown({ base: markdownLanguage, codeLanguages: languages }),
        ]
        if (files.length > 0) {
            exts.push(wikiLinkAutocomplete(files))
        }
        if (vimMode) {
            exts.push(vim())
        }
        return exts
    }, [files, vimMode])

    const handleLinkClick = React.useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
            if (href.startsWith("#wiki-link:")) {
                e.preventDefault()
                const title = decodeURIComponent(href.replace("#wiki-link:", ""))
                onWikiLinkClick?.(title)
            }
        },
        [onWikiLinkClick]
    )

    return (
        <div className={cn("grid h-full w-full grid-cols-1 md:grid-cols-2 divide-x", className)}>
            <div className={cn("relative h-full overflow-hidden bg-[#282c34]", isPreview ? "hidden md:block" : "block")}>
                <CodeMirror
                    value={content}
                    height="100%"
                    theme={oneDark}
                    extensions={extensions}
                    onChange={handleChange}
                    readOnly={readOnly}
                    className="h-full text-base"
                />
            </div>

            <div className={cn("h-full overflow-auto bg-background p-8 prose dark:prose-invert max-w-none", !isPreview ? "hidden md:block" : "block")}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, wikiLinkPlugin]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                        a: ({ href, className, children }) => {
                            const isWikiLink = href?.startsWith("#wiki-link:")
                            if (isWikiLink) {
                                return (
                                    <a
                                        href={href}
                                        onClick={(e) => handleLinkClick(e, href || "")}
                                        className={cn(
                                            "inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary hover:bg-primary/20 transition-colors cursor-pointer",
                                            className
                                        )}
                                    >
                                        <span>🔗</span>
                                        {children}
                                    </a>
                                )
                            }
                            return (
                                <a href={href} className={className}>
                                    {children}
                                </a>
                            )
                        },
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    )
}