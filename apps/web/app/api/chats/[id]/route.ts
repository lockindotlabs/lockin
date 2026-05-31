import { z } from "zod"

import { getOwnedChat, parseStoredMessages } from "@/lib/server/chat-store"
import { getCurrentDbUser } from "@/lib/server/current-db-user"
import prisma from "@workspace/db"

const UpdateChatSchema = z.object({
  title: z.string().trim().min(1).max(100),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const chat = await getOwnedChat(user.id, id)

  if (!chat) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({
    id: chat.id,
    title: chat.title,
    messages: parseStoredMessages(chat.messages),
    updatedAt: chat.updatedAt.toISOString(),
    status: chat.status,
  })
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const parsed = UpdateChatSchema.safeParse(await req.json())

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.message },
      { status: 400 }
    )
  }

  const existing = await getOwnedChat(user.id, id)

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const chat = await prisma.chat.update({
    where: { id },
    data: { title: parsed.data.title },
  })

  return Response.json({
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt.toISOString(),
    status: chat.status,
  })
}

export async function DELETE(_req: Request, context: RouteContext) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const existing = await getOwnedChat(user.id, id)

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.chat.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
