"use client"

import { Chat, Message } from "./types"

const STORAGE_KEY = "kb-copilot-chats"

export function getChats(): Chat[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveChats(chats: Chat[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
}

export function createChat(): Chat {
  const chat: Chat = {
    id: `chat-${Date.now()}`,
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const chats = getChats()
  chats.unshift(chat)
  saveChats(chats)
  return chat
}

export function updateChat(chatId: string, updates: Partial<Chat>): Chat | null {
  const chats = getChats()
  const index = chats.findIndex((c) => c.id === chatId)
  if (index === -1) return null
  
  chats[index] = { ...chats[index], ...updates, updatedAt: Date.now() }
  saveChats(chats)
  return chats[index]
}

export function addMessageToChat(chatId: string, message: Message): Chat | null {
  const chats = getChats()
  const index = chats.findIndex((c) => c.id === chatId)
  if (index === -1) return null
  
  chats[index].messages.push(message)
  chats[index].updatedAt = Date.now()
  
  // Update title based on first user message
  if (chats[index].messages.filter(m => m.role === "user").length === 1 && message.role === "user") {
    chats[index].title = message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
  }
  
  saveChats(chats)
  return chats[index]
}

export function deleteChat(chatId: string): void {
  const chats = getChats()
  const filtered = chats.filter((c) => c.id !== chatId)
  saveChats(filtered)
}

export function clearChatMessages(chatId: string): Chat | null {
  const chats = getChats()
  const index = chats.findIndex((c) => c.id === chatId)
  if (index === -1) return null
  
  chats[index].messages = []
  chats[index].title = "New Chat"
  chats[index].updatedAt = Date.now()
  saveChats(chats)
  return chats[index]
}

export function getChat(chatId: string): Chat | null {
  const chats = getChats()
  return chats.find((c) => c.id === chatId) || null
}
