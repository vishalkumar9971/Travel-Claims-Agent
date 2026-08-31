"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Upload } from "lucide-react"

export type ExpenseItem = {
  category: string
  description: string
  date: string
  units: number
  rate: number
  amount: number
  receiptAttached: boolean
}

export type ClaimSubmission = {
  claimId: string
  employeeName: string
  employeeContact: string
  department: string
  purpose: string
  startDate: string
  endDate: string
  destination: string
  submissionDate: string
  expenses: ExpenseItem[]
}

const emptyExpense = (): ExpenseItem => ({ category: "Airfare", description: "", date: "", units: 1, rate: 0, amount: 0, receiptAttached: false })
const today = new Date().toISOString().slice(0, 10)

export function ClaimFormDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (claim: ClaimSubmission) => void }) {
  const [form, setForm] = useState<Omit<ClaimSubmission, "claimId" | "submissionDate">>({ employeeName: "", employeeContact: "", department: "", purpose: "", startDate: "", endDate: "", destination: "", expenses: [emptyExpense()] })
  const [jsonError, setJsonError] = useState("")
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const claimId = useMemo(() => `CLM-${Date.now().toString().slice(-6)}`, [open])
  const updateExpense = (index: number, patch: Partial<ExpenseItem>) => setForm(current => ({ ...current, expenses: current.expenses.map((expense, i) => i === index ? { ...expense, ...patch } : expense) }))

  const fillFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const data = Array.isArray(parsed) ? parsed[0] : parsed
        if (!data || (!data.employee && !data.employeeName) || (!data.line_items && !data.expenses)) throw new Error()
        const categoryMap: Record<string, string> = { airfare: "Airfare", lodging: "Lodging", meals: "Meals", ground_transport: "Ground Transport", conference_fees: "Conference / Registration Fees", other: "Other / Incidental", spa: "Other / Incidental", minibar: "Other / Incidental" }
        const startDate = data.trip_start_date || data.startDate || ""
        const expenses = (data.line_items || data.expenses).map((item: Record<string, unknown>) => ({
          category: categoryMap[String(item.category || item.cat || "").toLowerCase()] || "Other / Incidental",
          description: String(item.description || item.desc || ""),
          date: String(item.date || item.date_of_expense || startDate),
          units: Number(item.nights_or_days || item.units || item.days || item.nights || 1),
          rate: Number(item.rate_per_unit || item.rate || item.amount || item.amt || 0),
          amount: Number(item.amount || item.amt || 0),
          receiptAttached: Boolean(item.receipt_attached ?? item.rcpt ?? item.receiptAttached),
        }))
        setForm({ employeeName: String(data.employee || data.employeeName || ""), employeeContact: String(data.employee_contact || data.employeeContact || data.employee_id || "Sample employee record"), department: String(data.department || ""), purpose: String(data.purpose || ""), startDate, endDate: String(data.trip_end_date || data.endDate || startDate), destination: String(data.destination || ""), expenses: expenses.length ? expenses : [emptyExpense()] })
        setJsonError("")
      } catch { setJsonError("Could not read this file. Upload a claim object or an array of claims in JSON format.") }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.employeeName || !form.employeeContact || !form.purpose || !form.startDate || !form.endDate || !form.expenses.every(item => item.description && item.date && item.amount > 0)) return
    onSubmit({ ...form, claimId, submissionDate: today })
    onOpenChange(false)
    setForm({ employeeName: "", employeeContact: "", department: "", purpose: "", startDate: "", endDate: "", destination: "", expenses: [emptyExpense()] })
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
      <DialogHeader><DialogTitle>Submit travel claim</DialogTitle><DialogDescription>Claim ID: {claimId} · Submission date: {today}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3"><div><p className="text-sm font-medium">Fill from JSON</p><p className="text-xs text-muted-foreground">Upload one claim at a time. For an array, the first claim is loaded only.</p></div><input ref={jsonInputRef} className="hidden" type="file" accept="application/json,.json" onChange={fillFromJson} /><Button type="button" variant="outline" onClick={() => jsonInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Upload JSON</Button>{jsonError && <p className="w-full text-xs text-destructive">{jsonError}</p>}</div>
        <section className="space-y-3"><h3 className="font-medium">Employee & trip details</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Employee full name *"><Input required value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} /></Field>
            <Field label="Employee ID or email *"><Input required value={form.employeeContact} onChange={e => setForm({ ...form, employeeContact: e.target.value })} /></Field>
            <Field label="Department / cost center"><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Field>
            <Field label="Business purpose *" className="sm:col-span-2"><Input required placeholder="e.g. Client site visit" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></Field>
            <Field label="Destination"><Input placeholder="City, Country" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} /></Field>
            <Field label="Trip start date *"><Input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Trip end date *"><Input required type="date" min={form.startDate} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
          </div>
        </section>
        <section className="space-y-3"><div className="flex items-center justify-between gap-3"><div><h3 className="font-medium">Expense line items</h3><p className="text-xs text-muted-foreground">Receipts are required above $25 and for airfare or lodging.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, expenses: [...form.expenses, emptyExpense()] })}><Plus className="mr-1 h-4 w-4" /> Add item</Button></div>
          <div className="space-y-3">{form.expenses.map((expense, index) => <div key={index} className="rounded-lg border bg-muted/30 p-3"><div className="mb-3 flex justify-between"><span className="text-sm font-medium">Expense {index + 1}</span>{form.expenses.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setForm({ ...form, expenses: form.expenses.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button>}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Category *"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={expense.category} onChange={e => updateExpense(index, { category: e.target.value })}>{["Airfare", "Lodging", "Meals", "Ground Transport", "Conference / Registration Fees", "Other / Incidental"].map(category => <option key={category}>{category}</option>)}</select></Field>
              <Field label="Date of expense *"><Input required type="date" value={expense.date} onChange={e => updateExpense(index, { date: e.target.value })} /></Field>
              <Field label="Units / duration"><Input min="1" type="number" value={expense.units || ""} onChange={e => updateExpense(index, { units: Number(e.target.value) })} /></Field>
              <Field label="Rate per unit"><Input min="0" step="0.01" type="number" value={expense.rate || ""} onChange={e => updateExpense(index, { rate: Number(e.target.value) })} /></Field>
              <Field label="Expense description *" className="sm:col-span-2"><Input required placeholder="e.g. Hotel, 2 nights @ $180" value={expense.description} onChange={e => updateExpense(index, { description: e.target.value })} /></Field>
              <Field label="Total claimed (USD) *"><Input required min="0.01" step="0.01" type="number" value={expense.amount || ""} onChange={e => updateExpense(index, { amount: Number(e.target.value) })} /></Field>
              <div className="space-y-1.5"><Label>Receipt attachment</Label><label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"><Upload className="h-4 w-4" /><span>{expense.receiptAttached ? "Attached" : "Upload PDF or image"}</span><input className="hidden" type="file" accept="image/*,.pdf" onChange={e => updateExpense(index, { receiptAttached: Boolean(e.target.files?.length) })} /></label></div>
            </div></div>)}</div>
        </section>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Submit claim for review</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}

export function ClaimStatusDialog({ open, onOpenChange, onCheck }: { open: boolean; onOpenChange: (open: boolean) => void; onCheck: (id: string) => void }) {
  const [id, setId] = useState("")
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Check claim status</DialogTitle><DialogDescription>Enter your claim ID or reimbursement ticket ID.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={event => { event.preventDefault(); onCheck(id.trim()); onOpenChange(false); setId("") }}><Field label="Claim or ticket ID"><Input required autoFocus placeholder="CLM-001 or RMB-12345678" value={id} onChange={event => setId(event.target.value)} /></Field><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Check status</Button></div></form></DialogContent></Dialog>
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <div className={`space-y-1.5 ${className}`}><Label>{label}</Label>{children}</div> }
