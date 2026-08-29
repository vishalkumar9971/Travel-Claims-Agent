"use client"

import { useEffect, useRef, useState } from "react"
import { Chat, Message, Source } from "@/lib/types"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Button } from "@/components/ui/button"
import { searchKnowledgeBase } from "@/lib/knowledge-base"
import { addMessageToChat, clearChatMessages } from "@/lib/chat-store"
import {
  RotateCcw,
  BookOpen,
  TrendingUp,
  Shield,
  DollarSign,
  Smartphone,
} from "lucide-react"

interface ChatInterfaceProps {
  chat: Chat | null
  onChatUpdate: (chat: Chat) => void
}

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: "What assets can I invest in with Pluang?" },
  { icon: Shield, text: "Is Pluang licensed and safe to use?" },
  { icon: DollarSign, text: "What are the fees for trading US stocks?" },
  { icon: Smartphone, text: "How do I get started with Pluang?" },
]

export function ChatInterface({ chat, onChatUpdate }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chat?.messages, streamingContent])

  const handleSendMessage = async (content: string, images: string[]) => {
    if (!chat) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      images: images.length > 0 ? images : undefined,
      timestamp: Date.now(),
    }

    let updatedChat = addMessageToChat(chat.id, userMessage)
    if (updatedChat) {
      onChatUpdate(updatedChat)
    }

    setIsLoading(true)
    setStreamingContent("")

    try {
      // Build message history for API (including images)
      const messageHistory = updatedChat?.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.images && msg.images.length > 0 && { images: msg.images }),
      })) || []

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messageHistory,
          query: content,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""
      let sources: Source[] = []

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  fullContent += data.content
                  setStreamingContent(fullContent)
                }
                if (data.sources) {
                  sources = data.sources
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Create assistant message with final content
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: fullContent || "I apologize, but I couldn't generate a response. Please try again.",
        sources: sources.length > 0 ? sources : undefined,
        timestamp: Date.now(),
      }

      updatedChat = addMessageToChat(chat.id, assistantMessage)
      if (updatedChat) {
        onChatUpdate(updatedChat)
      }
    } catch (error) {
      // Fallback to local knowledge base search if API fails
      const sources = searchKnowledgeBase(content)
      const fallbackContent = sources.length > 0
        ? `Based on our knowledge base:\n\n${sources.map((s) => `**${s.title}:**\n${s.content}`).join("\n\n")}`
        : "I couldn't find specific information about that. Please ask about Pluang's products, fees, or services."

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: fallbackContent,
        sources: sources.length > 0 ? sources : undefined,
        timestamp: Date.now(),
      }

      updatedChat = addMessageToChat(chat.id, assistantMessage)
      if (updatedChat) {
        onChatUpdate(updatedChat)
      }
    }

    setIsLoading(false)
    setStreamingContent("")
  }

  const handleRestartChat = () => {
    if (!chat) return
    const clearedChat = clearChatMessages(chat.id)
    if (clearedChat) {
      onChatUpdate(clearedChat)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question, [])
  }

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">
            Pluang Support Copilot
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Select a chat from history or start a new conversation to get
            source-backed answers about Pluang.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-background h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-foreground">
            {chat.title === "New Chat" ? "Pluang Support Assistant" : chat.title}
          </h1>
        </div>
        {chat.messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestartChat}
            className="gap-2 bg-transparent"
          >
            <RotateCcw className="h-4 w-4" />
            Restart Chat
          </Button>
        )}
      </div>

      {/* Messages or Welcome Screen */}
      {chat.messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome to Pluang Support
              </h2>
              <p className="text-muted-foreground">
                Ask me anything about Pluang - Indonesia's leading multi-asset investment platform.
                I'll provide accurate, source-backed answers about products, fees, and services.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUGGESTED_QUESTIONS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(item.text)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Powered by Pluang knowledge base with{" "}
                <span className="text-primary font-medium">11 documents</span>{" "}
                indexed
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto pb-4 px-4">
            {chat.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {(isLoading || streamingContent) && (
              <div className="flex gap-4 px-4 py-6 bg-muted/50 rounded-lg my-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-medium text-sm text-foreground">
                    Pluang Copilot
                  </div>
                  {streamingContent ? (
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {streamingContent}
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0">
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
