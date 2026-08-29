"use client"

import React from "react"

import { useState } from "react"
import { Message, Source } from "@/lib/types"
import { cn } from "@/lib/utils"
import { User, FileText, ChevronDown, ChevronUp, Bot, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ChatMessageProps {
  message: Message
}

// Process markdown to clean HTML
function processMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listType: "ul" | "ol" | null = null

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType
      elements.push(
        <ListTag key={`list-${elements.length}`} className="my-2 ml-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-foreground/90" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ListTag>
      )
      listItems = []
      listType = null
    }
  }

  const formatInlineText = (text: string): string => {
    // Bold: **text** or __text__
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    formatted = formatted.replace(/__(.*?)__/g, "<strong>$1</strong>")
    // Italic: *text* or _text_ (but not inside bold)
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    // Inline code: `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    return formatted
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    // Skip empty lines but flush list
    if (trimmedLine === "") {
      flushList()
      elements.push(<div key={`br-${index}`} className="h-2" />)
      return
    }

    // Horizontal rule
    if (trimmedLine === "---" || trimmedLine === "***") {
      flushList()
      elements.push(<hr key={`hr-${index}`} className="my-4 border-border" />)
      return
    }

    // Headers: # ## ### etc - convert to styled text (no # symbols)
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/)
    if (headerMatch) {
      flushList()
      const level = headerMatch[1].length
      const text = formatInlineText(headerMatch[2])
      const sizeClasses: Record<number, string> = {
        1: "text-xl font-bold mt-4 mb-2",
        2: "text-lg font-bold mt-3 mb-2",
        3: "text-base font-semibold mt-3 mb-1",
        4: "text-sm font-semibold mt-2 mb-1",
        5: "text-sm font-medium mt-2 mb-1",
        6: "text-xs font-medium mt-2 mb-1",
      }
      elements.push(
        <div
          key={`h-${index}`}
          className={cn("text-foreground", sizeClasses[level])}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )
      return
    }

    // Unordered list: - or * or bullet
    const ulMatch = trimmedLine.match(/^[-*]\s+(.*)$/)
    if (ulMatch) {
      if (listType !== "ul") flushList()
      listType = "ul"
      listItems.push(formatInlineText(ulMatch[1]))
      return
    }

    // Ordered list: 1. 2. etc
    const olMatch = trimmedLine.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      if (listType !== "ol") flushList()
      listType = "ol"
      listItems.push(formatInlineText(olMatch[1]))
      return
    }

    // Checkbox items: - [ ] or - [x]
    const checkMatch = trimmedLine.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (checkMatch) {
      flushList()
      const checked = checkMatch[1].toLowerCase() === "x"
      const text = formatInlineText(checkMatch[2])
      elements.push(
        <div key={`check-${index}`} className="flex items-center gap-2 my-1">
          <span className={cn("text-sm", checked ? "text-primary" : "text-muted-foreground")}>
            {checked ? "checked" : "unchecked"}
          </span>
          <span className="text-foreground/90" dangerouslySetInnerHTML={{ __html: text }} />
        </div>
      )
      return
    }

    // Regular paragraph
    flushList()
    const text = formatInlineText(trimmedLine)
    elements.push(
      <p
        key={`p-${index}`}
        className="text-foreground/90 leading-relaxed my-1"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  })

  flushList()
  return elements
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  
  // Check if content is long (more than ~150 chars or has multiple lines)
  const isLongContent = isUser && (message.content.length > 150 || message.content.split('\n').length > 3)

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6",
        isUser ? "flex-row-reverse bg-transparent" : "flex-row bg-muted/50 rounded-2xl my-2"
      )}
    >
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={cn(
        "flex-1 space-y-2 overflow-hidden",
        isUser ? "text-right" : "text-left"
      )}>
        {!isUser && (
          <div className="font-medium text-sm text-foreground">
            Pluang Copilot
          </div>
        )}

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-2",
            isUser ? "justify-end" : "justify-start"
          )}>
            {message.images.map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg"}
                alt={`Uploaded image ${index + 1}`}
                className="max-w-xs rounded-lg border border-border"
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "max-w-none",
          isUser && "inline-block bg-secondary/50 rounded-2xl px-4 py-2 text-left"
        )}>
          {isUser ? (
            <div className="relative">
              <div className={cn(
                "text-foreground/90 leading-relaxed whitespace-pre-wrap",
                !isExpanded && isLongContent && "line-clamp-3"
              )}>
                {message.content}
              </div>
              {isLongContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-0">{processMarkdown(message.content)}</div>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sources
            </div>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSource(source)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <FileText className="h-3 w-3" />
                  <span>{source.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Source Detail Dialog */}
      <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedSource?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {selectedSource?.content}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
