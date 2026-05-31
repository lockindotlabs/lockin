import { z } from "zod"

import {
  getChatTitleFromMessages,
  parseStoredMessages,
} from "@/lib/server/chat-store"
import { getCurrentDbUser } from "@/lib/server/current-db-user"
import prisma from "@workspace/db"

const ImportChatSchema = z.object({
  id: z.string().min(1),
  messages: z.array(z.unknown()),
})

export async function POST(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = ImportChatSchema.safeParse(await req.json())

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.message },
      { status: 400 }
    )
  }

  const messages = parseStoredMessages(parsed.data.messages)
  const existing = await prisma.chat.findUnique({
    where: { id: parsed.data.id },
  })

  if (existing && existing.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const chat = existing
    ? await prisma.chat.update({
        where: { id: parsed.data.id },
        data: {
          messages: JSON.parse(JSON.stringify(messages)),
          title: getChatTitleFromMessages(messages),
          status: "IDLE",
        },
      })
    : await prisma.chat.create({
        data: {
          id: parsed.data.id,
          userId: user.id,
          messages: JSON.parse(JSON.stringify(messages)),
          title: getChatTitleFromMessages(messages),
          status: "IDLE",
        },
      })

  return Response.json({
    id: chat.id,
    title: chat.title,
    messages: parseStoredMessages(chat.messages),
    updatedAt: chat.updatedAt.toISOString(),
    status: chat.status,
  })
}
