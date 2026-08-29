export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  images?: string[]
  sources?: Source[]
  timestamp: number
}

export interface Source {
  title: string
  content: string
  documentId: string
  category?: string
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface Document {
  id: string
  title: string
  content: string
  category: string
}
