"use client"

import React from "react"

import { useState, useRef, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Send, Loader2, Image as ImageIcon, X, ClipboardPlus, CircleHelp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ChatInputProps {
  onSend: (message: string, images: string[]) => void
  isLoading?: boolean
  disabled?: boolean
  onSubmitClaim: () => void
  onCheckClaimStatus: () => void
}

export function ChatInput({ onSend, isLoading, disabled, onSubmitClaim, onCheckClaimStatus }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [images, setImages] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!message.trim() || isLoading || disabled) return
    onSend(message.trim(), images)
    setMessage("")
    setImages([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) continue

      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setImages((prev) => [...prev, dataUrl])
      }
      reader.readAsDataURL(file)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className=" border-border bg-background p-4">
      <div className="mx-auto max-w-3xl">
        {/* Image preview grid */}
        {images.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                <img
                  src={img}
                  alt={`Preview ${idx}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-1 hover:bg-background transition-colors"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-muted/50 p-2 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
          {/* Image button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            disabled={isLoading || disabled}
            type="button"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground" disabled={isLoading || disabled} type="button"><ClipboardPlus className="h-4 w-4" /><span className="sr-only">Claim actions</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52"><DropdownMenuItem onSelect={onSubmitClaim}><ClipboardPlus /> Submit a claim</DropdownMenuItem><DropdownMenuItem onSelect={onCheckClaimStatus}><CircleHelp /> Check status of claim</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about our knowledge base... (attach images for visual questions)"
            disabled={isLoading || disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[36px] max-h-[200px] py-2"
            )}
          />

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading || disabled}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          TRA searches our knowledge base to provide source-backed answers. {images.length > 0 && `${images.length} image(s) attached.`}
        </p>
      </div>
    </div>
  )
}
