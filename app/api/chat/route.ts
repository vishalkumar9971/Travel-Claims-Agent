import { OpenRouter } from "@openrouter/sdk"
import { getKnowledgeBaseContext, searchKnowledgeBase } from "@/lib/knowledge-base"
import { DEFAULT_MODEL_ID } from "@/lib/models"

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const SYSTEM_PROMPT = `You are a friendly, conversational customer support AI assistant for Pluang, an award-winning multi-asset investment platform in Indonesia.

IMPORTANT CONVERSATION GUIDELINES:
1. **Be natural and human-like** - If someone says "hi", "hello", or any casual greeting, respond warmly and briefly mention what you can help with. Keep it short and friendly!
   - Example: User says "hi" -> Reply: "Hey there! I'm your Pluang assistant. I can help you with questions about gold investment, crypto, US stocks, account setup, fees, security, and more. What would you like to know?"
   - Example: User says "hello" -> Reply: "Hello! I'm here to help you with anything related to Pluang - from investment options to account questions. How can I assist you today?"
   
2. **Don't over-explain** - Only provide detailed information when the user specifically asks for it. Keep responses short and conversational unless they want details.

3. **Follow the conversation flow** - If user asks a follow-up, answer just that. Don't repeat everything.

4. **Be concise first** - Give a brief answer, then offer to explain more if they're interested.

5. **Use the knowledge base** - When users ask specific questions about Pluang products, services, fees, etc., use the knowledge base below to answer accurately.

6. **If you don't know** - If the information isn't in the knowledge base, honestly say you're not sure and suggest they contact Pluang support.

7. **Stay on topic** - For unrelated questions, gently redirect to Pluang topics.

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

    // Build the conversation history for the API with image support
    const conversationMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
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
