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

export type ClaimStatus = "approved" | "manual_review" | "rejected"

export interface ClaimExpense {
  category: string
  description: string
  date: string
  units: number
  rate: number
  amount: number
  receiptAttached: boolean
}

export interface ClaimRecord {
  claimId: string
  employeeName: string
  employeeContact: string
  department: string
  purpose: string
  startDate: string
  endDate: string
  destination: string
  submissionDate: string
  expenses: ClaimExpense[]
  total: number
  reimbursable: number
  ticketId?: string
  agentStatus: ClaimStatus
  agentAction: string
  reviewerAction: string
  rejectionReasons: string[]
  createdAt: number
}

export interface Document {
  id: string
  title: string
  content: string
  category: string
}
