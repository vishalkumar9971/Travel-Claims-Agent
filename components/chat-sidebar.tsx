"use client"

import { useState } from "react"
import { Chat, ClaimRecord } from "@/lib/types"
import { ClaimsPanel } from "@/components/claims-panel"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  MessageSquarePlus,
  History,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ClipboardList,
} from "lucide-react"

const MAX_RECENT_CHATS = 12

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onOpenHistory: () => void
  claims: ClaimRecord[]
}

export function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse,
  onOpenHistory,
  claims,
}: ChatSidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null)
  const [claimsOpen, setClaimsOpen] = useState(false)

  // Only show the 12 most recent chats
  const recentChats = chats.slice(0, MAX_RECENT_CHATS)
  const hasMoreChats = chats.length > MAX_RECENT_CHATS

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  // Group recent chats by date
  const groupedChats = recentChats.reduce((groups, chat) => {
    const dateKey = formatDate(chat.updatedAt)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(chat)
    return groups
  }, {} as Record<string, Chat[]>)

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-72"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sidebar-primary" />
              <span className="font-semibold text-sidebar-foreground">TR Agent</span>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onNewChat}
                className={cn(
                  "w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <MessageSquarePlus className="h-4 w-4" />
                {!isCollapsed && <span>New Chat</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">New Chat</TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild><Button variant="outline" onClick={() => setClaimsOpen(true)} className={cn("mt-2 w-full justify-start gap-2", isCollapsed && "justify-center px-0")}><ClipboardList className="h-4 w-4" />{!isCollapsed && <span>Claims {claims.length ? `(${claims.length})` : ""}</span>}</Button></TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">Claims</TooltipContent>}
          </Tooltip>
        </div>

        {/* Recent Chats Header */}
        {!isCollapsed && (
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
              Recent
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenHistory}
                  className="h-6 px-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <History className="h-3 w-3 mr-1" />
                  View All
                </Button>
              </TooltipTrigger>
              <TooltipContent>View all chat history</TooltipContent>
            </Tooltip>
          </div>
        )}

        {isCollapsed && (
          <div className="px-2 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenHistory}
                  className="w-full h-10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">View all history</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Chat List */}
        <ScrollArea className="flex-1 px-2">
          {Object.entries(groupedChats).map(([date, dateChats]) => (
            <div key={date} className="mb-4">
              {!isCollapsed && (
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                  {date}
                </div>
              )}
              {dateChats.map((chat) => (
                <Tooltip key={chat.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "group relative flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors mb-1",
                        currentChatId === chat.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                        isCollapsed && "justify-center"
                      )}
                      onClick={() => onSelectChat(chat.id)}
                      onMouseEnter={() => setHoveredChat(chat.id)}
                      onMouseLeave={() => setHoveredChat(null)}
                    >
                      {/* <MessageSquare className="h-4 w-4 shrink-0" /> */}
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 min-w-0 text-sm line-clamp-2 break-words pr-8">
                            {chat.title}
                          </span>
                          {hoveredChat === chat.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground/60 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteChat(chat.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{chat.title}</TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          ))}
          
          {recentChats.length === 0 && !isCollapsed && (
            <div className="px-4 py-8 text-center text-sm text-sidebar-foreground/50">
              No chat history yet.
              <br />
              Start a new conversation!
            </div>
          )}

          {/* Show "View All" prompt if there are more chats */}
          {hasMoreChats && !isCollapsed && (
            <div className="px-2 pb-4">
              <Button
                variant="ghost"
                className="w-full text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={onOpenHistory}
              >
                +{chats.length - MAX_RECENT_CHATS} more chats
              </Button>
            </div>
          )}
        </ScrollArea>
        <ClaimsPanel open={claimsOpen} onOpenChange={setClaimsOpen} claims={claims} />
      </div>
    </TooltipProvider>
  )
}
