"use client"

import { Chat, ClaimRecord } from "./types"
import sampleClaims from "@/claims.json"

const STORAGE_KEY = "travel-reimbursement-claims"

export function getClaims(): ClaimRecord[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

export function saveClaim(claim: ClaimRecord): ClaimRecord[] {
  const claims = [claim, ...getClaims().filter(item => item.claimId !== claim.claimId)]
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(claims))
  return claims
}

export function migrateClaimsFromChats(chats: Chat[]): ClaimRecord[] {
  const existing = getClaims()
  const recovered = chats.flatMap(chat => chat.messages.flatMap((message, index) => {
    const match = message.role === "user" && message.content.match(/Claim ID:\s*(CLM-[A-Z0-9-]+)/i)
    if (!match || existing.some(claim => claim.claimId === match[1])) return []
    const following = chat.messages.slice(index + 1).find(item => item.role === "assistant")?.content || ""
    const ticketId = following.match(/Reimbursement ticket:\s*\*\*(RMB-[A-Z0-9-]+)\*\*/i)?.[1]
    const rejected = /claim rejected/i.test(following)
    const total = Number(message.content.match(/Total claimed:\s*\$([\d.]+)/i)?.[1] || 0)
    const employeeName = message.content.match(/Claim request submitted by user\s+(.+)/i)?.[1]?.trim() || "Unknown employee"
    const purpose = message.content.match(/Business purpose:\s*(.+)/i)?.[1]?.trim() || "Recovered from chat history"
    const reasons = following.split("\n").filter(line => line.startsWith("- ")).map(line => line.slice(2))
    const agentStatus = rejected ? "rejected" : ticketId ? "approved" : "manual_review"
    return [{ claimId: match[1], employeeName, employeeContact: "Not available", department: "Not available", purpose, startDate: "Not available", endDate: "Not available", destination: "Not available", submissionDate: new Date(message.timestamp).toISOString().slice(0, 10), expenses: [], total, reimbursable: agentStatus === "approved" ? total : 0, ticketId, agentStatus, agentAction: agentStatus === "approved" ? "Approved during the initial policy check." : agentStatus === "rejected" ? "Rejected during the initial policy check." : "Routed for manual review.", reviewerAction: agentStatus === "approved" ? "Complete final approval and release reimbursement." : agentStatus === "rejected" ? "No action unless a revised claim is submitted." : "Review the flagged policy exceptions.", rejectionReasons: rejected ? reasons : [], createdAt: message.timestamp } satisfies ClaimRecord]
  }))
  const claims = [...recovered, ...existing].sort((a, b) => b.createdAt - a.createdAt)
  if (typeof window !== "undefined" && recovered.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(claims))
  return claims
}

export function seedSampleClaims(existing: ClaimRecord[]): ClaimRecord[] {
  const samples = sampleClaims.map((claim, index): ClaimRecord => {
    const expenses = claim.line_items.map(item => ({
      category: item.category,
      description: item.description,
      date: claim.trip_start_date,
      units: item.nights_or_days || 1,
      rate: item.rate_per_unit || item.amount,
      amount: item.amount,
      receiptAttached: item.receipt_attached,
    }))
    const base = { claimId: claim.claim_id, employeeName: claim.employee, employeeContact: "Sample employee record", department: "Not provided", purpose: claim.purpose, startDate: claim.trip_start_date, endDate: claim.trip_end_date, destination: "Not provided", submissionDate: claim.submitted_date, expenses, total: claim.total_claimed, createdAt: new Date(claim.submitted_date).getTime() + index }
    switch (claim.claim_id) {
      case "CLM-001": return { ...base, reimbursable: 1110, ticketId: "RMB-CLM001", agentStatus: "approved", agentAction: "Validated economy airfare, lodging and meals within policy caps, required receipts, and documented business purpose. Approved for manager processing.", reviewerAction: "Manager should complete final approval and release the $1,110.00 reimbursement.", rejectionReasons: [] }
      case "CLM-002": return { ...base, reimbursable: 0, agentStatus: "rejected", agentAction: "Rejected: the claim contains no eligible business expense.", reviewerAction: "No approval action. Ask the employee to submit only eligible business travel expenses.", rejectionReasons: ["Hotel spa package is a personal expense and is ineligible (POL-CAT-02).", "Minibar charge is ineligible (POL-CAT-02)."] }
      case "CLM-003": return { ...base, reimbursable: 840, ticketId: "RMB-CLM003", agentStatus: "approved", agentAction: "Partially approved. Lodging is capped at $200/night; $100.00 was deducted under POL-PD-02.", reviewerAction: "Manager should approve the adjusted reimbursement of $840.00.", rejectionReasons: [] }
      case "CLM-004": return { ...base, reimbursable: 600, agentStatus: "manual_review", agentAction: "Escalated for manual review due to premium airfare, a missing lodging receipt, and a total above the $2,000 director threshold.", reviewerAction: "Obtain the hotel receipt, verify any premium-airfare pre-approval, then route to a director for decision.", rejectionReasons: [] }
      default: return { ...base, reimbursable: 75, agentStatus: "manual_review", agentAction: "Escalated because the meal receipt is missing and the claimed $220/day exceeds the $75/day meal cap.", reviewerAction: "Request an itemized receipt and review whether the eligible meal reimbursement should be limited to $75.00.", rejectionReasons: [] }
    }
  })
  const merged = [...existing]
  samples.forEach(sample => { if (!merged.some(claim => claim.claimId === sample.claimId)) merged.push(sample) })
  merged.sort((a, b) => b.createdAt - a.createdAt)
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  return merged
}
