import { Document, Source } from "./types"

// HCL Tech Travel Reimbursement Knowledge Base Documents
export const knowledgeBase: Document[] = [
  {
    id: "doc-1",
    title: "Eligible & Ineligible Categories",
    category: "Policy Categories",
    content: `POL-CAT-01 — Eligible Categories (Reimbursable when incurred for documented business purpose):
- Airfare (economy class only — see POL-AIR-01)
- Lodging (hotel room charges)
- Meals (subject to per-diem limits — see POL-PD-01)
- Ground transport (taxi, rideshare, train, rental car, parking)
- Conference / registration fees

POL-CAT-02 — Ineligible Items (Never reimbursable; rejected in full):
- Alcohol and minibar charges
- Spa, gym, and personal entertainment
- In-room movies, personal shopping, gifts
- Traffic fines, penalties, and late fees
- Any personal (non-business) expense

All ineligible items are automatically deducted from the claim and cannot be reimbursed.`,
  },
  {
    id: "doc-2",
    title: "Per-Diem and Category Limits",
    category: "Limits",
    content: `POL-PD-01 — Meals Per-Diem Limit:
- Maximum $75 per day
- Amounts above the daily cap are deducted; the rest is reimbursed
- Example: If you claim $90 in meals for one day, you get reimbursed $75 and $15 is deducted

POL-PD-02 — Lodging Per-Diem Limit:
- Maximum $200 per night
- Amounts above the nightly cap are deducted; the rest is reimbursed
- Example: Hotel charging $250/night = reimburse $200, deduct $50

POL-PD-03 — Ground Transport Per-Diem Limit:
- Maximum $50 per day
- Amounts above the cap are deducted

POL-AIR-01 — Airfare Class Restriction:
- Only economy class airfare is reimbursable
- Business/first-class fares are a policy exception and MUST be routed to Manual Review
- Pre-approval may exist for premium cabin travel`,
  },
  {
    id: "doc-3",
    title: "Receipt Requirements",
    category: "Documentation",
    content: `POL-RCT-01 — Receipt Required Above $25:
- Any single line item greater than $25 requires an attached, itemized receipt
- Airfare and lodging ALWAYS require a receipt regardless of amount
- Items under $25 may be accepted without receipt if properly documented

POL-RCT-02 — Missing Receipt Handling:
- If a receipt is missing for an item that requires one, the item is NOT silently rejected
- The entire claim is routed to Manual Review so the reviewer can request the receipt
- Do not auto-approve claims with missing required receipts
- This protects both the employee and the company`,
  },
  {
    id: "doc-4",
    title: "Approval Thresholds and Authority",
    category: "Approval Process",
    content: `Approval thresholds are evaluated on the TOTAL reimbursable amount (after per-diem deductions but before final decision).

POL-APR-01 — Auto-Approve Tier:
- Total reimbursement ≤ $500
- May be auto-approved by the agent if fully compliant with all policy rules
- No missing receipts, no ineligible items, no policy exceptions

POL-APR-02 — Manager Tier:
- Total reimbursement > $500 and ≤ $2,000
- Eligible for approval by manager when fully compliant
- Agent can approve if all conditions met

POL-APR-03 — Director / Manual-Review Tier:
- Total reimbursement > $2,000
- EXCEEDS the agent's auto-approval authority
- Must be routed to Manual Review for director approval, EVEN IF otherwise fully compliant
- High-value claims require human oversight`,
  },
  {
    id: "doc-5",
    title: "Timeliness Requirements",
    category: "Policy Rules",
    content: `POL-TIME-01 — Submission Window:
- Claims must be submitted within 30 days of the expense date
- Late claims are automatically routed to Manual Review
- The review committee may approve late claims at their discretion if justified
- Do not auto-reject late claims; send them for manual review with a note about the delay`,
  },
  {
    id: "doc-6",
    title: "Decision Framework and Logic",
    category: "Decision Making",
    content: `Apply these rules in order when making reimbursement decisions:

APPROVE — Full reimbursement when:
- Every item is in an eligible category (POL-CAT-01)
- All required receipts are present (POL-RCT-01)
- All amounts are within per-diem caps (POL-PD-01, POL-PD-02, POL-PD-03)
- Airfare is economy class only (POL-AIR-01)
- Claim is submitted within 30 days (POL-TIME-01)
- Total is within auto-approvable tier ≤ $500 (POL-APR-01) or manager-approvable tier ≤ $2,000 (POL-APR-02)

PARTIALLY APPROVE — when:
- The claim is valid but some amounts exceed per-diem caps
- Reimburse up to the applicable caps and deduct the excess
- All other policy rules are met

REJECT — when:
- The claimed items are ineligible (POL-CAT-02) with nothing reimbursable
- The entire claim consists of personal or prohibited expenses

MANUAL REVIEW — Route to manual review when:
- Any policy exception (e.g., business-class airfare — POL-AIR-01)
- High value exceeding $2,000 (POL-APR-03)
- Missing required receipt (POL-RCT-02)
- Late submission beyond 30 days (POL-TIME-01)
- Any ambiguity or conflicting information
- Partial approval needed with unusual circumstances

ALWAYS PREFER MANUAL REVIEW over forcing a decision in ambiguous cases.`,
  },
  {
    id: "doc-7",
    title: "Sample Claims for Testing",
    category: "Examples",
    content: `CLM-001 — Attend 2-day industry conference (business):
Employee: A. Rivera | Trip: 2026-06-10 to 2026-06-12 | Submitted: 2026-06-20
- Airfare (economy): $420.00 (receipt: yes)
- Lodging (2 nights @ $180): $360.00 (receipt: yes)
- Meals (3 days @ ~$60/day): $180.00 (receipt: yes)
- Conference registration: $150.00 (receipt: yes)
Total claimed: $1,110.00
Expected Decision: PARTIALLY APPROVE (meals exceed $75/day limit for some days)

CLM-002 — Weekend hotel stay (personal):
Employee: B. Osei | Trip: 2026-06-14 to 2026-06-15 | Submitted: 2026-06-25
- Spa package: $300.00 (receipt: yes)
- Minibar: $80.00 (receipt: yes)
Total claimed: $380.00
Expected Decision: REJECT (all items ineligible — spa and minibar are personal)

CLM-003 — Client site visit (business):
Employee: C. Nakamura | Trip: 2026-06-08 to 2026-06-10 | Submitted: 2026-06-22
- Airfare (economy): $300.00 (receipt: yes)
- Lodging (2 nights @ $250): $500.00 (receipt: yes)
- Meals (2 days @ $70/day): $140.00 (receipt: yes)
Total claimed: $940.00
Expected Decision: PARTIALLY APPROVE (lodging exceeds $200/night limit)

CLM-004 — International vendor negotiation (business):
Employee: D. Fischer | Trip: 2026-06-16 to 2026-06-18 | Submitted: 2026-06-28
- Business-class airfare: $2,400.00 (receipt: yes)
- Lodging (3 nights): $600.00 (receipt: NO)
Total claimed: $3,000.00
Expected Decision: MANUAL REVIEW (business-class airfare is exception + missing lodging receipt + exceeds $2,000 threshold)

CLM-005 — Client dinner / business development:
Employee: E. Haddad | Trip: 2026-06-11 | Submitted: 2026-06-24
- Client dinner for 4 (business development): $220.00 (receipt: NO)
Total claimed: $220.00
Expected Decision: MANUAL REVIEW (missing receipt for meal item $220 > $25 threshold)`,
  },
  {
    id: "doc-8",
    title: "Common Decision Examples",
    category: "FAQ",
    content: `Q: A meal expense is $80/day but the limit is $75/day. What happens?
A: PARTIALLY APPROVE. Reimburse $75, deduct $5. Policy cap is firm but partial reimbursement is allowed.

Q: An employee forgot to attach a receipt for a $300 hotel bill. Should we reject it?
A: NO. Route to MANUAL REVIEW. Per POL-RCT-02, do not silently reject. Ask the employee to provide the receipt.

Q: An employee booked a business-class flight for $2,400. Can we auto-approve it?
A: NO. Route to MANUAL REVIEW. Per POL-AIR-01, business class requires pre-approval review. Even if everything else is valid.

Q: A claim is submitted 45 days after the trip. What happens?
A: Route to MANUAL REVIEW. Per POL-TIME-01, claims beyond 30 days go to manual review for possible exception approval.

Q: An employee claims $3,500 total for meals and hotel. All receipts are present and amounts are reasonable. Should we approve?
A: NO. Route to MANUAL REVIEW. Per POL-APR-03, anything over $2,000 exceeds agent authority and needs director approval.

Q: A claim has one $50 meal receipt (present), one $30 spa charge (no receipt), and $20 parking (no receipt). What decision?
A: MANUAL REVIEW. The spa is ineligible (POL-CAT-02), so it's deducted. The $30 meal exceeds $25 so needs receipt (it's missing). Result: route to manual review for clarification.`,
  },
  {
    id: "doc-9",
    title: "Policy Contact & Support",
    category: "Support",
    content: `For questions about travel reimbursement policy:
- Email: travel-policy@company.com
- Policy Handbook: Internal Wiki / Travel Portal
- HR Help Desk: Extension 5500

Key Policy IDs for Reference:
- POL-CAT-01: Eligible categories
- POL-CAT-02: Ineligible categories
- POL-PD-01: Meals limit ($75/day)
- POL-PD-02: Lodging limit ($200/night)
- POL-PD-03: Ground transport limit ($50/day)
- POL-AIR-01: Airfare class (economy only)
- POL-RCT-01: Receipt required above $25
- POL-RCT-02: Missing receipt handling
- POL-APR-01: Auto-approve tier (≤$500)
- POL-APR-02: Manager tier (>$500, ≤$2,000)
- POL-APR-03: Director/Manual review tier (>$2,000)
- POL-TIME-01: Submission within 30 days`,
  },
]

// Simple keyword-based search for demo purposes
export function searchKnowledgeBase(query: string): Source[] {
  const queryLower = query.toLowerCase()
  const keywords = queryLower.split(/\s+/).filter((word) => word.length > 2)

  const results: { doc: Document; score: number }[] = []

  for (const doc of knowledgeBase) {
    let score = 0
    const contentLower = doc.content.toLowerCase()
    const titleLower = doc.title.toLowerCase()
    const categoryLower = doc.category.toLowerCase()

    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        score += 5
      }
      if (categoryLower.includes(keyword)) {
        score += 3
      }
      if (contentLower.includes(keyword)) {
        score += 1
        // Count occurrences
        const matches = contentLower.split(keyword).length - 1
        score += Math.min(matches, 5)
      }
    }

    if (score > 0) {
      results.push({ doc, score })
    }
  }

  // Sort by score and take top 3
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, 3).map(({ doc }) => ({
    title: doc.title,
    content: doc.content,
    documentId: doc.id,
  }))
}

// Get full knowledge base as context string
export function getKnowledgeBaseContext(): string {
  return knowledgeBase
    .map((doc) => `## ${doc.title} (${doc.category})\n${doc.content}`)
    .join("\n\n---\n\n")
}
