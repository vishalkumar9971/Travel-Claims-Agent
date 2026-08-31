import { OpenRouter } from "@openrouter/sdk"
import { getKnowledgeBaseContext, searchKnowledgeBase } from "@/lib/knowledge-base"
import { DEFAULT_MODEL_ID } from "@/lib/models"

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const SYSTEM_PROMPT = `You are a helpful and professional HR support assistant for HCL Tech's Travel Reimbursement program.

IMPORTANT CONVERSATION GUIDELINES:
1. **Be natural and human-like** - If someone says "hi", "hello", or any casual greeting, respond warmly and briefly mention what you can help with. Keep it short and friendly!
   - Example: User says "hi" -> Reply: "Hello! I'm the HCL Tech Travel Reimbursement Assistant. I can help you with questions about travel policies, reimbursement procedures, expense guidelines, approvals, and documentation. What would you like to know?"
   - Example: User says "hello" -> Reply: "Hi there! I'm here to help with any questions about HCL Tech's travel reimbursement policy. Whether it's about flight bookings, hotels, meal allowances, or filing claims, just ask!"
   
2. **Don't over-explain** - Only provide detailed information when the user specifically asks for it. Keep responses short and conversational unless they want details.

3. **Follow the conversation flow** - If user asks a follow-up, answer just that. Don't repeat everything.

4. **Be concise first** - Give a brief answer, then offer to explain more if they're interested.

5. **Use the knowledge base** - When users ask questions about travel policies, expenses, reimbursement procedures, approval processes, etc., use the knowledge base below to answer accurately.

6. **If you don't know** - If the information isn't in the knowledge base, honestly say you're not sure and suggest they contact HR at travel-policy@hcltech.com or the HR Help Desk.

7. **Stay on topic** - For unrelated questions, gently redirect to HCL Tech travel reimbursement topics.

8. **Be helpful with amounts and guidelines** - When users ask about reimbursement limits, daily allowances, or documentation requirements, provide specific numbers and guidelines from the knowledge base.

KNOWLEDGE BASE:
${getKnowledgeBaseContext()}`

// Convert data URL or URL to OpenRouter vision format
function parseImageData(imageUrl: string): { type: "image_url"; image_url: { url: string } } | null {
  try {
    // Support data URLs and regular URLs
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("http")) {
      return {
        type: "image_url",
        image_url: { url: imageUrl },
      }
    }
    return null
  } catch (error) {
    console.error("Error parsing image:", error)
    return null
  }
}

// Build message content with text and images
function buildMessageContent(
  content: string,
  images?: string[]
): string | Array<{ type: string; text?: string; image_url?: { url: string } }> {
  if (!images || images.length === 0) {
    return content
  }

  const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: "text",
      text: content,
    },
  ]

  // Add all images to the message
  images.forEach((img) => {
    const parsedImage = parseImageData(img)
    if (parsedImage) {
      messageContent.push(parsedImage)
    }
  })

  return messageContent
}

export async function POST(request: Request) {
  try {
    const { messages, query } = await request.json()

    // Search for relevant sources
    const sources = searchKnowledgeBase(query || messages[messages.length - 1]?.content || "")
    const retrievedPolicy = sources.length
      ? `\n\nRETRIEVED POLICY EXCERPTS (prioritize these when answering):\n${sources.map(source => `[${source.documentId}] ${source.title}\n${source.content}`).join("\n\n")}`
      : ""

    // Build the conversation history for the API with image support
    const conversationMessages = [
      { role: "system" as const, content: `${SYSTEM_PROMPT}${retrievedPolicy}` },
      ...messages.map((msg: { role: string; content: string; images?: string[] }) => ({
        role: msg.role as "user" | "assistant",
        content: buildMessageContent(msg.content, msg.images),
      })),
    ]

    // Stream the response using Mistral model
    const stream = await openrouter.chat.send({
      model: DEFAULT_MODEL_ID,
      messages: conversationMessages as any,
      stream: true,
    })

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              )
            }
          }
          // Send sources at the end
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ sources, done: true })}\n\n`)
          )
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
