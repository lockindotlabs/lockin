import { createChat, parseStoredMessages } from "@/lib/server/chat-store"
import { getCurrentDbUser } from "@/lib/server/current-db-user"
import prisma from "@workspace/db"
import { z } from "zod"

const CreateChatSchema = z.object({
  id: z.string().min(1).optional(),
})

export async function GET() {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const chats = await prisma.chat.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 10,
  })

  return Response.json({
    chats: chats.map((chat) => {
      const messages = parseStoredMessages(chat.messages)

      return {
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: messages.length,
        status: chat.status,
      }
    }),
  })
}

export async function POST(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rawBody = await req.text()
  const parsed = CreateChatSchema.safeParse(rawBody ? JSON.parse(rawBody) : {})

  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 })
  }

  if (parsed.data.id) {
    const existing = await prisma.chat.findUnique({
      where: { id: parsed.data.id },
    })

    if (existing) {
      if (existing.userId !== user.id) {
        return Response.json({ error: "Not found" }, { status: 404 })
      }

      return Response.json({ id: existing.id }, { status: 200 })
    }

    try {
      const chat = await prisma.chat.create({
        data: {
          id: parsed.data.id,
          userId: user.id,
          title: "New chat",
          messages: [],
        },
      })

      return Response.json({ id: chat.id }, { status: 201 })
    } catch {
      const chat = await prisma.chat.findFirst({
        where: { id: parsed.data.id, userId: user.id },
      })

      if (!chat) {
        return Response.json({ error: "Unable to create chat" }, { status: 409 })
      }

      return Response.json({ id: chat.id }, { status: 200 })
    }
  }

  const chat = await createChat(user.id)

  return Response.json({ id: chat.id }, { status: 201 })
}
