"use client"

import { useEffect, useRef, useState } from "react"
import { Chat, ClaimRecord, Message, Source } from "@/lib/types"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ClaimFormDialog, ClaimStatusDialog, ClaimSubmission } from "./claim-form-dialog"
import { Button } from "@/components/ui/button"
import { addMessageToChat } from "@/lib/chat-store"
import { getClaims, saveClaim } from "@/lib/claim-store"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import {
  BookOpen,
  TrendingUp,
  Shield,
  DollarSign,
  Smartphone,
} from "lucide-react"

interface ChatInterfaceProps {
  chat: Chat | null
  onChatUpdate: (chat: Chat) => void
  onClaimCreated: (claim: ClaimRecord) => void
}

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: "What is the daily meal allowance for travel?" },
  { icon: Shield, text: "What documents do I need for reimbursement?" },
  { icon: DollarSign, text: "What are the accommodation limits for domestic travel?" },
  { icon: Smartphone, text: "How do I submit a travel reimbursement claim?" },
]

export function ChatInterface({ chat, onChatUpdate, onClaimCreated }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [claimFormOpen, setClaimFormOpen] = useState(false)
  const [isClaimProcessing, setIsClaimProcessing] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
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
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "The Mistral agent is currently unavailable, so I can’t generate a verified response. Please try again in a moment.",
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



  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question, [])
  }

  const addLocalMessage = (role: "user" | "assistant", content: string) => {
    if (!chat) return
    const updated = addMessageToChat(chat.id, { id: `msg-${Date.now()}-${role}`, role, content, timestamp: Date.now() })
    if (updated) onChatUpdate(updated)
  }

  const handleClaimSubmit = async (claim: ClaimSubmission) => {
    setIsClaimProcessing(true)
    const total = claim.expenses.reduce((sum, item) => sum + item.amount, 0)
    addLocalMessage("user", `Claim request submitted by user ${claim.employeeName}\n\nClaim ID: ${claim.claimId}\nBusiness purpose: ${claim.purpose}\nTotal claimed: $${total.toFixed(2)}`)
    let aiReview: { status: "approved" | "manual_review" | "rejected"; reimbursableAmount: number; reasons: string[]; agentAction: string; reviewerAction: string; summary: string } | null = null
    try {
      const conversation = chat?.messages.map(message => ({ role: message.role, content: message.content })) || []
      const response = await fetch("/api/claim-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claim: { ...claim, totalClaimed: total }, conversation }) })
      if (response.ok) aiReview = await response.json()
    } catch { /* Handled below: no claim action is taken without an AI review. */ }
    if (!aiReview) {
      addLocalMessage("assistant", "The Mistral claim-review agent is unavailable. No approval, rejection, or reimbursement ticket was created; please submit the claim again shortly.")
      setIsClaimProcessing(false)
      return
    }
    const ticket = `RMB-${Date.now().toString().slice(-8)}`
    const agentStatus = aiReview.status
    const findings = aiReview.reasons
    const agentAction = aiReview.agentAction
    const reviewerAction = aiReview.reviewerAction
    const record: ClaimRecord = { ...claim, total, reimbursable: Math.max(0, aiReview.reimbursableAmount), ticketId: agentStatus === "approved" ? ticket : undefined, agentStatus, agentAction, reviewerAction, rejectionReasons: agentStatus === "rejected" ? findings.length ? findings : ["The Mistral agent rejected this claim under company policy."] : [], createdAt: Date.now() }
    const result = agentStatus === "approved"
      ? `## Claim approved for reimbursement\n\nYour claim **${claim.claimId}** has passed the Mistral policy review.\n\n- Reimbursement ticket: **${ticket}**\n- Eligible amount: **$${record.reimbursable.toFixed(2)}**\n- Status: **Submitted for processing**\n\n${aiReview.summary}\n\nA reviewer will complete the final approval.`
      : agentStatus === "rejected"
        ? `## Claim rejected\n\nClaim **${claim.claimId}** cannot be reimbursed.\n\n${record.rejectionReasons.map(issue => `- ${issue}`).join("\n")}\n\nPlease rethink and resubmit only expenses that are eligible under company policy.`
        : `## Claim needs attention\n\nClaim **${claim.claimId}** was submitted, but it cannot be automatically reimbursed yet.\n\n${findings.map(issue => `- ${issue}`).join("\n")}\n\n${aiReview.summary}`
    saveClaim(record)
    onClaimCreated(record)
    addLocalMessage("assistant", result)
    setIsClaimProcessing(false)
  }

  const handleCheckClaimStatus = async (id: string) => {
    const record = getClaims().find(claim => claim.claimId === id || claim.ticketId === id)
    const context = record
      ? `Claim record: ${JSON.stringify({ claimId: record.claimId, ticketId: record.ticketId, agentStatus: record.agentStatus, agentAction: record.agentAction, reviewerAction: record.reviewerAction, rejectionReasons: record.rejectionReasons })}`
      : "No matching local claim record was found."
    await handleSendMessage(`Check the status of claim or ticket **${id}**. ${context} Give a concise status and the next action, using the travel policy knowledge base.`, [])
  }

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">
            HCL Tech Travel Reimbursement Assistant
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Select a chat from history or start a new conversation to get
            accurate answers about HCL Tech travel policies and reimbursement.
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
            {chat.title === "New Chat" ? "tra agent" : chat.title}
          </h1>
        </div>
      </div>

      {/* Messages or Welcome Screen */}
      {chat.messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-32 w-32 rounded-full bg-primary/10 mb-4">
                <DotLottieReact
                  src="https://lottie.host/11c0a804-32eb-4c5c-9610-37e2aaa10ce7/YhsW7PdXN0.lottie"
                  loop
                  autoplay
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Travel Reimbursement Assistant
              </h2>
              <p className="text-muted-foreground">
                Ask me anything about HCL Tech travel policies, reimbursement procedures, and expense guidelines.
                I'll provide accurate, policy-backed answers to help you with your travel claims.
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
                Powered by HCL Tech Travel Policy knowledge base with{" "}
                <span className="text-primary font-medium">10 documents</span>{" "}
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
            {(isLoading || isClaimProcessing || streamingContent) && (
              <div className="flex gap-4 px-4 py-6 bg-muted/50 rounded-lg my-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-medium text-sm text-foreground">
                    Travel Reimbursement Agent
                  </div>
                  {streamingContent ? (
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {streamingContent}
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                    </div>
                  ) : isClaimProcessing ? (
                    <div className="text-sm text-foreground">Cross-checking the submitted claim against travel policy with the AI review agent...</div>
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
        <ChatInput onSend={handleSendMessage} isLoading={isLoading || isClaimProcessing} onSubmitClaim={() => setClaimFormOpen(true)} onCheckClaimStatus={() => setStatusDialogOpen(true)} />
      </div>
      <ClaimFormDialog open={claimFormOpen} onOpenChange={setClaimFormOpen} onSubmit={handleClaimSubmit} />
      <ClaimStatusDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen} onCheck={handleCheckClaimStatus} />
    </div>
  )
}
