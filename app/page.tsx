"use client"

import { useState, useEffect } from "react"
import { Chat, ClaimRecord } from "@/lib/types"
import { getChats, createChat, deleteChat, getChat } from "@/lib/chat-store"
import { migrateClaimsFromChats, seedSampleClaims } from "@/lib/claim-store"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { HistoryPanel } from "@/components/history-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false)
  const [claims, setClaims] = useState<ClaimRecord[]>([])

  // Load chats from localStorage on mount, create default if none exist
  useEffect(() => {
    const storedChats = getChats()
    setClaims(seedSampleClaims(migrateClaimsFromChats(storedChats)))
    
    if (storedChats.length > 0) {
      // If there are existing chats, select the most recent one
      setChats(storedChats)
      setCurrentChatId(storedChats[0].id)
      setCurrentChat(storedChats[0])
    } else {
      // Create a default chat so user sees the greeting window immediately
      const defaultChat = createChat()
      setChats([defaultChat])
      setCurrentChatId(defaultChat.id)
      setCurrentChat(defaultChat)
    }
  }, [])

  const handleNewChat = () => {
    const newChat = createChat()
    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    setCurrentChat(newChat)
    setMobileMenuOpen(false)
  }

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
    const chat = getChat(chatId)
    setCurrentChat(chat)
    setMobileMenuOpen(false)
  }

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId)
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    
    if (currentChatId === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId)
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id)
        setCurrentChat(remainingChats[0])
      } else {
        // Create a new chat if all are deleted
        const newChat = createChat()
        setChats([newChat])
        setCurrentChatId(newChat.id)
        setCurrentChat(newChat)
      }
    }
  }

  const handleChatUpdate = (updatedChat: Chat) => {
    setCurrentChat(updatedChat)
    setChats((prev) =>
      prev.map((c) => (c.id === updatedChat.id ? updatedChat : c))
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex">
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenHistory={() => setHistoryPanelOpen(true)}
          claims={claims}
        />
      </div>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full z-50 md:hidden">
            <ChatSidebar
              chats={chats}
              currentChatId={currentChatId}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              isCollapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              onOpenHistory={() => {
                setMobileMenuOpen(false)
                setHistoryPanelOpen(true)
              }}
              claims={claims}
            />
          </div>
        </>
      )}

      {/* History Panel */}
      {historyPanelOpen && (
        <HistoryPanel
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onClose={() => setHistoryPanelOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface chat={currentChat} onChatUpdate={handleChatUpdate} onClaimCreated={(claim) => setClaims(current => [claim, ...current.filter(item => item.claimId !== claim.claimId)])} />
      </main>
    </div>
  )
}
