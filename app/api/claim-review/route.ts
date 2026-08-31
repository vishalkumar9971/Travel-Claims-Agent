import { getKnowledgeBaseContext } from "@/lib/knowledge-base"
import { DEFAULT_MODEL_ID } from "@/lib/models"

export async function POST(request: Request) {
  try {
    const { claim, conversation = [] } = await request.json()
    if (!claim) return Response.json({ error: "Claim data is required." }, { status: 400 })
    const history = Array.isArray(conversation)
      ? conversation.slice(-20).map((message: { role?: string; content?: string }) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: String(message.content || ""),
        }))
      : []
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      body: JSON.stringify({
        model: DEFAULT_MODEL_ID,
        temperature: 0.1,
        messages: [
          { role: "system", content: `You are a meticulous HCL Tech travel-claim review agent. Cross-check every submitted field and every expense line against this policy. Return ONLY valid JSON with this exact shape: {"status":"approved"|"manual_review"|"rejected","reimbursableAmount":number,"reasons":string[],"agentAction":string,"reviewerAction":string,"summary":string}. Use rejected only when nothing is eligible. Use manual_review for missing required receipts, premium airfare, late claims, high-value claims, ambiguity, or any exception. Never invent facts.\n\nPOLICY:\n${getKnowledgeBaseContext()}` },
          ...history,
          { role: "user", content: `Review this submitted claim in full. The claim JSON below is authoritative; use prior conversation only for relevant context.\n${JSON.stringify(claim)}` },
        ],
      }),
    })
    if (!response.ok) throw new Error("AI review request failed")
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""
    const json = JSON.parse(content.replace(/^```json\s*|\s*```$/g, "").trim())
    if (!['approved', 'manual_review', 'rejected'].includes(json.status) || !Array.isArray(json.reasons)) throw new Error("Invalid AI review format")
    return Response.json(json)
  } catch (error) {
    console.error("Claim review error:", error)
    return Response.json({ error: "The AI claim review could not be completed." }, { status: 502 })
  }
}
