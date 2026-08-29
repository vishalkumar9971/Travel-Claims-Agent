"use client"

import { useState, useMemo } from "react"
import { Chat } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  X,
  Search,
  MessageSquare,
  Trash2,
  Calendar,
} from "lucide-react"

interface HistoryPanelProps {
  chats: Chat[]
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onClose: () => void
}

export function HistoryPanel({
  chats,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onClose,
}: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredChat, setHoveredChat] = useState<string | null>(null)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats
    
    const query = searchQuery.toLowerCase()
    return chats.filter((chat) => {
      // Search in title
      if (chat.title.toLowerCase().includes(query)) return true
      // Search in messages
      return chat.messages.some((msg) =>
        msg.content.toLowerCase().includes(query)
      )
    })
  }, [chats, searchQuery])

  // Group filtered chats by date
  const groupedChats = useMemo(() => {
    return filteredChats.reduce((groups, chat) => {
      const dateKey = formatDate(chat.updatedAt)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(chat)
      return groups
    }, {} as Record<string, Chat[]>)
  }, [filteredChats])

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l border-border shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Chat History</h2>
            <span className="text-sm text-muted-foreground">
              ({chats.length} {chats.length === 1 ? "chat" : "chats"})
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {Object.keys(groupedChats).length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No chats found matching your search" : "No chat history yet"}
                </p>
              </div>
            ) : (
              Object.entries(groupedChats).map(([date, dateChats]) => (
                <div key={date} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {date}
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-2">
                    {dateChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={cn(
                          "group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          currentChatId === chat.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-accent"
                        )}
                        onClick={() => handleSelectChat(chat.id)}
                        onMouseEnter={() => setHoveredChat(chat.id)}
                        onMouseLeave={() => setHoveredChat(null)}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-10 w-10 rounded-full shrink-0",
                          currentChatId === chat.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-10">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium line-clamp-2 break-words">
                              {chat.title}
                            </h3>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(chat.updatedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {chat.messages.length > 0
                              ? chat.messages[chat.messages.length - 1].content.substring(0, 60) + 
                                (chat.messages[chat.messages.length - 1].content.length > 60 ? "..." : "")
                              : "No messages yet"}
                          </p>
                          <div className="text-xs text-muted-foreground/60 mt-1">
                            {chat.messages.length} {chat.messages.length === 1 ? "message" : "messages"}
                          </div>
                        </div>
                        {hoveredChat === chat.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteChat(chat.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
