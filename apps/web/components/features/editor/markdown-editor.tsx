"use client"

import * as React from "react"
import CodeMirror from "@uiw/react-codemirror"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { oneDark } from "@codemirror/theme-one-dark"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import { cn } from "@/lib/utils"

interface MarkdownEditorProps {
    initialContent?: string
    onChange?: (value: string) => void
    readOnly?: boolean
    className?: string
}

export function MarkdownEditor({
    initialContent = "",
    onChange,
    readOnly = false,
    className,
}: MarkdownEditorProps) {
    const [content, setContent] = React.useState(initialContent)
    const [isPreview, setIsPreview] = React.useState(false) // For mobile or toggle

    // Update content when initialContent changes (e.g., when loading a different file)
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

    return (
        <div className={cn("grid h-full w-full grid-cols-1 md:grid-cols-2 divide-x", className)}>
            {/* Editor Pane */}
            <div className={cn("relative h-full overflow-hidden bg-[#282c34]", isPreview ? "hidden md:block" : "block")}>
                <CodeMirror
                    value={content}
                    height="100%"
                    theme={oneDark}
                    extensions={[
                        markdown({ base: markdownLanguage, codeLanguages: languages }),
                    ]}
                    onChange={handleChange}
                    readOnly={readOnly}
                    className="h-full text-base"
                />
            </div>

            {/* Preview Pane */}
            <div className={cn("h-full overflow-auto bg-background p-8 prose dark:prose-invert max-w-none", !isPreview ? "hidden md:block" : "block")}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    )
}
