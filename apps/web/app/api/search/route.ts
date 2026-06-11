import { parseStoredMessages } from "@/lib/server/chat-store"
import { getCurrentDbUser } from "@/lib/server/current-db-user"
import { serializePlanSummary } from "@/lib/server/plan-store"
import prisma from "@workspace/db"

type SearchType = "all" | "chats" | "plans"

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 20
const SEARCH_TYPES = new Set<SearchType>(["all", "chats", "plans"])

function parseSearchType(value: string | null): SearchType {
  if (value && SEARCH_TYPES.has(value as SearchType)) {
    return value as SearchType
  }

  return "all"
}

function parseLimit(value: string | null) {
  const limit = Number(value)

  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT
  }

  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit)))
}

export async function GET(req: Request) {
  const user = await getCurrentDbUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = (searchParams.get("q") ?? "").trim()
  const type = parseSearchType(searchParams.get("type"))
  const limit = parseLimit(searchParams.get("limit"))

  if (!query) {
    return Response.json({ chats: [], plans: [] })
  }

  const shouldSearchChats = type === "all" || type === "chats"
  const shouldSearchPlans = type === "all" || type === "plans"

  const chats = shouldSearchChats
    ? await prisma.chat.findMany({
        where: {
          userId: user.id,
          title: { contains: query, mode: "insensitive" },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      })
    : []

  const plans = shouldSearchPlans
    ? await prisma.plan.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          name: { contains: query, mode: "insensitive" },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: {
          steps: {
            select: {
              id: true,
              status: true,
              dueDate: true,
            },
          },
        },
      })
    : []

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
    plans: plans.map(serializePlanSummary),
  })
}
